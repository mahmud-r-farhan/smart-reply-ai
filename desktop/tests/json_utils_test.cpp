/**
 * Unit tests for desktop/src/json_utils.cpp.
 *
 * These functions are deliberately platform-neutral (no <windows.h>), so the
 * suite builds and runs on any host with a C++17 compiler:
 *
 *   g++ -std=c++17 -Iinclude src/json_utils.cpp tests/json_utils_test.cpp -o /tmp/json_utils_test
 *   /tmp/json_utils_test
 *
 * The first three cases reproduce the real response shape returned by every
 * OpenAI-compatible provider, where `content` is a JSON string that *contains*
 * an escaped JSON array.
 */
#include "json_utils.h"

#include <iostream>
#include <string>
#include <vector>

using namespace SmartReply::JsonUtils;

static int g_failures = 0;

static void Expect(bool condition, const std::string& label) {
    std::cout << (condition ? "  PASS  " : "  FAIL  ") << label << "\n";
    if (!condition) ++g_failures;
}

static void ExpectEq(const std::string& actual, const std::string& expected, const std::string& label) {
    if (actual == expected) {
        std::cout << "  PASS  " << label << "\n";
    } else {
        std::cout << "  FAIL  " << label << "\n"
                  << "        expected: [" << expected << "]\n"
                  << "        actual:   [" << actual << "]\n";
        ++g_failures;
    }
}

static void ExpectList(const std::vector<std::string>& actual,
                       const std::vector<std::string>& expected,
                       const std::string& label) {
    if (actual == expected) {
        std::cout << "  PASS  " << label << " (" << actual.size() << " items)\n";
        return;
    }
    std::cout << "  FAIL  " << label << " — expected " << expected.size()
              << " item(s), got " << actual.size() << "\n";
    for (const auto& item : actual) std::cout << "        actual item: [" << item << "]\n";
    ++g_failures;
}

int main() {
    std::cout << "json_utils tests\n----------------\n";

    // 1. A real provider response: content is an escaped JSON array inside a string.
    std::cout << "[extract] real OpenAI-compatible response\n";
    const std::string providerResponse =
        "{\"id\":\"chat-1\",\"object\":\"chat.completion\",\"choices\":[{\"index\":0,"
        "\"message\":{\"role\":\"assistant\",\"content\":"
        "\"[\\\"Sounds great, see you at 3!\\\",\\\"Can we push to 3:30 PM?\\\","
        "\\\"Sorry, let's catch up tomorrow!\\\"]\"},\"finish_reason\":\"stop\"}]}";

    std::string content;
    Expect(ExtractStringValue(providerResponse, "content", content), "content field extracted");
    ExpectEq(content,
             "[\"Sounds great, see you at 3!\",\"Can we push to 3:30 PM?\",\"Sorry, let's catch up tomorrow!\"]",
             "escapes resolved inside content");
    ExpectList(ParseStringArray(content),
               { "Sounds great, see you at 3!", "Can we push to 3:30 PM?", "Sorry, let's catch up tomorrow!" },
               "three suggestions parsed");

    // 2. The old parser is what regressed here: it returned the garbage item "}}".
    Expect(ParseStringArray(content).size() == 3 && ParseStringArray(content)[0] != "}}",
           "no garbage fragments from the outer JSON envelope");

    // 3. Escaped newlines, quotes and unicode inside individual suggestions.
    std::cout << "[parse] escapes inside array items\n";
    ExpectList(ParseStringArray("[\"line one\\nline two\",\"He said \\\"hi\\\"\",\"emoji \\ud83d\\ude00 🌟\"]"),
               { "line one\nline two", "He said \"hi\"", "emoji \xF0\x9F\x98\x80 🌟" },
               "newlines, quotes and surrogate pairs decoded");

    // 4. Alternate envelopes still resolve to the first array.
    std::cout << "[parse] alternate envelopes\n";
    ExpectList(ParseStringArray("{\"suggestions\":[\"a\",\"b\"]}"), { "a", "b" }, "object wrapper");
    ExpectList(ParseStringArray("Here you go:\n```json\n[\"x\", \"y\"]\n```"), { "x", "y" }, "fenced code block");
    Expect(ParseStringArray("no array here").empty(), "non-array text yields no items");

    // 5. Escape/unescape round-trip over hostile text.
    std::cout << "[escape] round-trip\n";
    const std::string hostile = "Quote \" backslash \\ newline \n tab \t control \x01 emoji 😀";
    ExpectEq(UnescapeString(EscapeString(hostile)), hostile, "round-trip preserves the original text");
    Expect(EscapeString(hostile).find('\n') == std::string::npos, "control characters are escaped");
    ExpectEq(EscapeString("a\"b"), "a\\\"b", "quote escaping");

    // 6. Missing / non-string fields are reported, not guessed.
    std::cout << "[extract] negative cases\n";
    std::string unused;
    Expect(!ExtractStringValue("{\"other\":\"x\"}", "content", unused), "missing key returns false");
    Expect(!ExtractStringValue("{\"content\":42}", "content", unused), "non-string value returns false");

    // 7. Prose fallback for models that ignore the JSON instruction.
    std::cout << "[fallback] bullet and numbered prose\n";
    ExpectList(ParseLooseLines("1. First reply\n2. Second reply\n- Third reply", 4),
               { "First reply", "Second reply", "Third reply" },
               "list markers stripped");
    ExpectList(ParseLooseLines("\"Quoted reply\"\n\nPlain reply", 4),
               { "Quoted reply", "Plain reply" },
               "surrounding quotes stripped, blank lines skipped");
    ExpectList(ParseLooseLines("one\ntwo\nthree\nfour\nfive", 4).size() == 4 ? std::vector<std::string>{"one","two","three","four"} : std::vector<std::string>{},
               { "one", "two", "three", "four" },
               "result count capped");

    std::cout << "----------------\n";
    if (g_failures == 0) {
        std::cout << "ALL TESTS PASSED\n";
        return 0;
    }
    std::cout << g_failures << " TEST(S) FAILED\n";
    return 1;
}
