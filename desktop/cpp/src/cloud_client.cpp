#include "../include/cloud_client.h"
#include <windows.h>
#include <wininet.h>
#include <chrono>
#include <iostream>
#include <sstream>

#pragma comment(lib, "wininet.lib")

namespace SmartReply {

std::vector<std::string> CloudClient::ParseJsonArray(const std::string& json) {
    std::vector<std::string> results;
    size_t start = json.find('[');
    size_t end = json.rfind(']');

    if (start != std::string::npos && end != std::string::npos && end > start) {
        std::string arrayContent = json.substr(start + 1, end - start - 1);
        std::stringstream ss(arrayContent);
        std::string item;
        bool inQuotes = false;
        std::string current;

        for (size_t i = 0; i < arrayContent.size(); ++i) {
            char c = arrayContent[i];
            if (c == '"' && (i == 0 || arrayContent[i - 1] != '\\')) {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                if (!current.empty()) {
                    results.push_back(current);
                    current.clear();
                }
            } else if (inQuotes) {
                if (c == '\\' && i + 1 < arrayContent.size()) {
                    if (arrayContent[i + 1] == 'n') { current += '\n'; i++; }
                    else if (arrayContent[i + 1] == '"') { current += '"'; i++; }
                    else { current += c; }
                } else {
                    current += c;
                }
            }
        }
        if (!current.empty()) {
            results.push_back(current);
        }
    }

    return results;
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

    // Read response
    char buffer[4096];
    DWORD bytesRead = 0;
    outResponse.clear();

    while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
        buffer[bytesRead] = '\0';
        outResponse += buffer;
    }

    outStatusCode = 200;
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

    std::string endpoint = config.baseURL;
    if (endpoint.back() != '/') endpoint += "/";
    endpoint += "chat/completions";

    // Escape prompt text for JSON
    std::string escapedPrompt = "";
    for (char c : prompt) {
        if (c == '"') escapedPrompt += "\\\"";
        else if (c == '\\') escapedPrompt += "\\\\";
        else if (c == '\n') escapedPrompt += "\\n";
        else if (c == '\r') continue;
        else escapedPrompt += c;
    }

    std::string jsonBody = "{"
        "\"model\":\"" + config.model + "\","
        "\"messages\":["
        "{\"role\":\"system\",\"content\":\"" + systemPrompt + "\"},"
        "{\"role\":\"user\",\"content\":\"" + escapedPrompt + "\"}"
        "],"
        "\"temperature\":0.7,"
        "\"max_tokens\":" + std::to_string(config.maxTokens) +
    "}";

    std::string response;
    int statusCode = 0;
    bool success = PostHttpRequest(endpoint, config.apiKey, jsonBody, response, statusCode);

    auto end = std::chrono::high_resolution_clock::now();
    int latency = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

    if (!success || response.empty()) {
        return {};
    }

    // Extract content from choices[0].message.content
    size_t contentPos = response.find("\"content\":");
    if (contentPos == std::string::npos) return {};

    std::string contentSnippet = response.substr(contentPos);
    std::vector<std::string> rawList = ParseJsonArray(contentSnippet);

    std::vector<Suggestion> results;
    for (const auto& item : rawList) {
        if (!item.empty()) {
            results.push_back({ item, "cloud-llm", latency, 0.96 });
        }
    }

    return results;
}

} // namespace SmartReply
