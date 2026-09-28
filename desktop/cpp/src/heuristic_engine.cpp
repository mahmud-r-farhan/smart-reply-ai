#include "../include/heuristic_engine.h"
#include <algorithm>
#include <chrono>

namespace SmartReply {

std::string HeuristicEngine::ToLower(const std::string& str) {
    std::string lower = str;
    std::transform(lower.begin(), lower.end(), lower.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return lower;
}

std::string HeuristicEngine::Trim(const std::string& str) {
    const auto strBegin = str.find_first_not_of(" \t\r\n");
    if (strBegin == std::string::npos) return "";
    const auto strEnd = str.find_last_not_of(" \t\r\n");
    return str.substr(strBegin, strEnd - strBegin + 1);
}

std::vector<Suggestion> HeuristicEngine::GenerateReplies(const std::string& input, const std::string& tone) {
    auto start = std::chrono::high_resolution_clock::now();
    std::string clean = Trim(input);
    std::string lower = ToLower(clean);
    std::string normTone = ToLower(tone.empty() ? "professional" : tone);

    std::vector<std::string> texts;

    if (lower.find("meet") != std::string::npos || lower.find("schedule") != std::string::npos || lower.find("call") != std::string::npos) {
        if (normTone == "casual" || normTone == "friendly") {
            texts = {
                "Sounds good! Let me know what time works best for you. 😊",
                "Sure thing, shoot over a calendar invite!",
                "Down for a chat. When are you free this week?",
                "Count me in! Let me know when."
            };
        } else {
            texts = {
                "I would be glad to meet. Please send over an invite with the agenda.",
                "That works for me. What time window suits your schedule best?",
                "I am available this week. Let me know which time slot works best.",
                "Let's sync up. Feel free to share your calendar link."
            };
        }
    } else if (lower.find("thank") != std::string::npos || lower.find("thx") != std::string::npos) {
        if (normTone == "casual" || normTone == "friendly") {
            texts = {
                "Anytime! Always happy to help! 😊",
                "You're so welcome! Let me know if you need anything else.",
                "Glad I could help out! Have an awesome day!",
                "No problem at all! 👍"
            };
        } else {
            texts = {
                "You are very welcome! Please let me know if you need anything else.",
                "Glad I could be of assistance. Don't hesitate to reach out.",
                "Happy to help! Looking forward to our continued collaboration.",
                "It was my pleasure. Wishing you the best with your next steps."
            };
        }
    } else if (lower.find("how are you") != std::string::npos || lower.find("how are things") != std::string::npos) {
        texts = {
            "Doing well and staying productive, thank you! How are things with you?",
            "All is progressing smoothly here. Hope you are having a great week!",
            "Can't complain! Ready to dive in whenever you are.",
            "Very well, thanks for asking! How about yourself?"
        };
    } else {
        texts = {
            "Thank you for the detailed update. I will review and follow up shortly.",
            "Acknowledged. That aligns well with our current roadmap.",
            "Thank you for sharing this. Let's touch base on the next steps.",
            "Understood. I will take the necessary action and keep you informed."
        };
    }

    auto end = std::chrono::high_resolution_clock::now();
    int latency = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

    std::vector<Suggestion> results;
    for (const auto& t : texts) {
        results.push_back({ t, "heuristic", latency, 0.95 });
    }
    return results;
}

std::vector<Suggestion> HeuristicEngine::EnhanceText(const std::string& input, const std::string& tone) {
    auto start = std::chrono::high_resolution_clock::now();
    std::string clean = Trim(input);
    if (clean.empty()) return {};

    // Capitalize first letter
    clean[0] = static_cast<char>(std::toupper(clean[0]));
    if (clean.back() != '.' && clean.back() != '!' && clean.back() != '?') {
        clean += '.';
    }

    std::vector<std::string> variations = {
        clean,
        "Please note: " + clean + " We appreciate your prompt attention.",
        "Kindly be advised: " + clean + " Let me know if any questions arise.",
        "Update: " + clean
    };

    auto end = std::chrono::high_resolution_clock::now();
    int latency = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

    std::vector<Suggestion> results;
    for (const auto& v : variations) {
        results.push_back({ v, "heuristic", latency, 0.93 });
    }
    return results;
}

std::vector<Suggestion> HeuristicEngine::TranslateText(const std::string& input, const std::string& targetLang, const std::string& tone) {
    auto start = std::chrono::high_resolution_clock::now();
    std::string clean = Trim(input);

    std::vector<std::string> translations = {
        "[" + targetLang + "] " + clean,
        "[" + targetLang + " - Formal]: " + clean,
        "[" + targetLang + " - Casual]: " + clean,
        "[" + targetLang + " - Direct]: " + clean
    };

    auto end = std::chrono::high_resolution_clock::now();
    int latency = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

    std::vector<Suggestion> results;
    for (const auto& t : translations) {
        results.push_back({ t, "heuristic", latency, 0.90 });
    }
    return results;
}

std::vector<Suggestion> HeuristicEngine::SummarizeText(const std::string& input) {
    auto start = std::chrono::high_resolution_clock::now();
    std::string clean = Trim(input);

    std::vector<std::string> summaries = {
        clean,
        "Key Takeaway: " + clean,
        "• " + clean,
        "Summary: " + clean
    };

    auto end = std::chrono::high_resolution_clock::now();
    int latency = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

    std::vector<Suggestion> results;
    for (const auto& s : summaries) {
        results.push_back({ s, "heuristic", latency, 0.92 });
    }
    return results;
}

} // namespace SmartReply
