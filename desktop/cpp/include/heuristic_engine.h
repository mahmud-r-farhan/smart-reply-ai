#pragma once
#include <string>
#include <vector>
#include "app_config.h"

namespace SmartReply {

class HeuristicEngine {
public:
    static std::vector<Suggestion> GenerateReplies(const std::string& input, const std::string& tone);
    static std::vector<Suggestion> EnhanceText(const std::string& input, const std::string& tone);
    static std::vector<Suggestion> TranslateText(const std::string& input, const std::string& targetLang, const std::string& tone);
    static std::vector<Suggestion> SummarizeText(const std::string& input);

private:
    static std::string ToLower(const std::string& str);
    static std::string Trim(const std::string& str);
};

} // namespace SmartReply
