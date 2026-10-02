#include "cloud_client.h"
#include "json_utils.h"
#include <windows.h>
#include <wininet.h>
#include <chrono>
#include <iostream>

#pragma comment(lib, "wininet.lib")

namespace SmartReply {

std::vector<std::string> CloudClient::ParseJsonArray(const std::string& json) {
    // Kept for API compatibility; delegates to the shared JSON helpers so the
    // desktop client parses arrays exactly like every other Smart Reply client.
    return JsonUtils::ParseStringArray(json);
}

bool CloudClient::PostHttpRequest(
    const std::string& fullUrl,
    const std::string& apiKey,
    const std::string& jsonBody,
    std::string& outResponse,
    int& outStatusCode
) {
    HINTERNET hInternet = InternetOpenA("SmartReplyNative/1.0", INTERNET_OPEN_TYPE_DIRECT, nullptr, nullptr, 0);
    if (!hInternet) return false;

    // Parse URL (protocol, host, path)
    std::string host;
    std::string path;
    INTERNET_PORT port = INTERNET_DEFAULT_HTTPS_PORT;
    DWORD flags = INTERNET_FLAG_SECURE | INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE;

    std::string url = fullUrl;
    if (url.find("http://") == 0) {
        port = INTERNET_DEFAULT_HTTP_PORT;
        flags = INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE;
        url = url.substr(7);
    } else if (url.find("https://") == 0) {
        url = url.substr(8);
    }

    size_t slashPos = url.find('/');
    if (slashPos != std::string::npos) {
        host = url.substr(0, slashPos);
        path = url.substr(slashPos);
    } else {
        host = url;
        path = "/";
    }

    // Check for custom port in host (e.g. localhost:11434)
    size_t colonPos = host.find(':');
    if (colonPos != std::string::npos) {
        port = static_cast<INTERNET_PORT>(std::stoi(host.substr(colonPos + 1)));
        host = host.substr(0, colonPos);
    }

    HINTERNET hConnect = InternetConnectA(hInternet, host.c_str(), port, nullptr, nullptr, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        InternetCloseHandle(hInternet);
        return false;
    }

    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", path.c_str(), nullptr, nullptr, nullptr, flags, 0);
    if (!hRequest) {
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return false;
    }

    // Headers
    std::string headers = "Content-Type: application/json\r\n";
    if (!apiKey.empty()) {
        headers += "Authorization: Bearer " + apiKey + "\r\n";
    }

    // Set timeouts (6 seconds)
    DWORD timeout = 6000;
    InternetSetOptionA(hRequest, INTERNET_OPTION_RECEIVE_TIMEOUT, &timeout, sizeof(timeout));
    InternetSetOptionA(hRequest, INTERNET_OPTION_SEND_TIMEOUT, &timeout, sizeof(timeout));

    BOOL sent = HttpSendRequestA(
        hRequest,
        headers.c_str(),
        static_cast<DWORD>(headers.length()),
        (LPVOID)jsonBody.c_str(),
        static_cast<DWORD>(jsonBody.length())
    );

    if (!sent) {
        InternetCloseHandle(hRequest);
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return false;
    }

    // Read the real HTTP status code (WinINet defaults to 0 otherwise)
    DWORD statusCode = 0;
    DWORD statusSize = sizeof(statusCode);
    if (!HttpQueryInfoA(
            hRequest,
            HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER,
            &statusCode,
            &statusSize,
            nullptr)) {
        statusCode = 0;
    }
    outStatusCode = static_cast<int>(statusCode);

    // Read response body
    char buffer[4096];
    DWORD bytesRead = 0;
    outResponse.clear();

    while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
        buffer[bytesRead] = '\0';
        outResponse.append(buffer, bytesRead);
    }
    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);
    return true;
}

std::vector<Suggestion> CloudClient::Complete(
    const ProviderConfig& config,
    const std::string& prompt,
    const std::string& systemPrompt
) {
    auto start = std::chrono::high_resolution_clock::now();

    if (config.baseURL.empty()) {
        std::cerr << "[CloudClient] Provider base URL is empty" << std::endl;
        return {};
    }

    std::string endpoint = config.baseURL;
    if (endpoint.back() != '/') endpoint += "/";
    endpoint += "chat/completions";

    // Escape every interpolated value: prompts can contain quotes, backslashes,
    // tabs or newlines from the user's captured text and would otherwise produce
    // invalid JSON (the system prompt and model id are just as untrusted).
    std::string jsonBody = "{"
        "\"model\":\"" + JsonUtils::EscapeString(config.model) + "\","
        "\"messages\":["
        "{\"role\":\"system\",\"content\":\"" + JsonUtils::EscapeString(systemPrompt) + "\"},"
        "{\"role\":\"user\",\"content\":\"" + JsonUtils::EscapeString(prompt) + "\"}"
        "],"
        "\"temperature\":0.7,"
        "\"max_tokens\":" + std::to_string(config.maxTokens > 0 ? config.maxTokens : 300) +
    "}";

    std::string response;
    int statusCode = 0;
    bool success = PostHttpRequest(endpoint, config.apiKey, jsonBody, response, statusCode);

    auto end = std::chrono::high_resolution_clock::now();
    int latency = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

    if (!success || response.empty() || statusCode < 200 || statusCode >= 300) {
        if (success && (statusCode < 200 || statusCode >= 300)) {
            std::cerr << "[CloudClient] Provider returned HTTP " << statusCode << std::endl;
        }
        return {};
    }

    // The provider wraps the model answer in `choices[0].message.content`, where
    // the value is a JSON *string* — find and unescape it before parsing the
    // inner array, otherwise the escaped quotes/switches confuse the parser.
    std::string content;
    if (!JsonUtils::ExtractStringValue(response, "content", content) || content.empty()) {
        std::cerr << "[CloudClient] Response contained no message content" << std::endl;
        return {};
    }

    std::vector<std::string> rawList = JsonUtils::ParseStringArray(content);
    if (rawList.empty()) {
        // Some models answer with prose bullets instead of a JSON array.
        rawList = JsonUtils::ParseLooseLines(content, 4);
    }

    std::vector<Suggestion> results;
    for (const auto& item : rawList) {
        if (!item.empty()) {
            results.push_back({ item, "cloud-llm", latency, 0.96 });
        }
        if (results.size() >= 4) break;
    }

    return results;
}

} // namespace SmartReply
