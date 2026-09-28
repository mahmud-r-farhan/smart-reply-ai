#pragma once
#include <string>
#include <vector>

namespace SmartReply {

enum class EngineMode {
    HybridRace,
    OfflineOnly,
    CloudOnly,
    Fallback
};

enum class AppMode {
    Reply,
    Enhance,
    Translate,
    Summarize
};

struct Suggestion {
    std::string text;
    std::string source; // "heuristic", "cloud-llm", "offline"
    int latencyMs{ 0 };
    double confidence{ 0.95 };
};

struct ProviderConfig {
    std::string name{ "Groq" };
    std::string baseURL{ "https://api.groq.com/openai/v1" };
    std::string apiKey{ "" };
    std::string model{ "llama-3.1-8b-instant" };
    double temperature{ 0.7 };
    int maxTokens{ 300 };
};

struct AppSettings {
    EngineMode engineMode{ EngineMode::HybridRace };
    AppMode currentMode{ AppMode::Reply };
    std::string tone{ "professional" };
    std::string targetLanguage{ "Spanish" };
    ProviderConfig provider;
    bool minimizeToTray{ true };
    bool autoPaste{ true };
};

} // namespace SmartReply
