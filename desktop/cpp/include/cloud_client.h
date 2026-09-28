#pragma once
#include <string>
#include <vector>
#include "app_config.h"

namespace SmartReply {

class CloudClient {
public:
    // Execute chat completion against any standard OpenAI-compatible API
    static std::vector<Suggestion> Complete(
        const ProviderConfig& config,
        const std::string& prompt,
        const std::string& systemPrompt = "You are a helpful AI writing assistant. Output strictly a JSON array of strings."
    );

    // Simple JSON array parser for C++ without external dependencies
    static std::vector<std::string> ParseJsonArray(const std::string& json);

private:
    static bool PostHttpRequest(
        const std::string& fullUrl,
        const std::string& apiKey,
        const std::string& jsonBody,
        std::string& outResponse,
        int& outStatusCode
    );
};

} // namespace SmartReply
