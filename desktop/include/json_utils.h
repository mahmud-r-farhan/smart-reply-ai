#pragma once
#include <cstddef>
#include <string>
#include <vector>

namespace SmartReply {
namespace JsonUtils {

/**
 * Escape a UTF-8 string so it can be embedded inside a JSON string literal.
 * Handles quotes, backslashes, newlines, tabs and all other control characters
 * (which must be escaped as \u00XX to keep the payload valid JSON).
 */
std::string EscapeString(const std::string& input);

/**
 * Unescape the body of a JSON string literal: \" \\ \/ \b \f \n \r \t and
 * \uXXXX escapes (including UTF-16 surrogate pairs) become real UTF-8 bytes.
 */
std::string UnescapeString(const std::string& input);

/**
 * Extract the value of the first `"key": "..."` string field in `json`.
 * Returns the *unescaped* value in `outValue`. Returns false when the key is
 * missing or is not a string value.
 */
bool ExtractStringValue(const std::string& json, const std::string& key, std::string& outValue);

/**
 * Parse every string element of the first JSON array found in `text`.
 * The input must already be unescaped (i.e. real JSON, not a JSON string that
 * contains JSON). Non-string elements are skipped, so both
 * ["a","b"] and {"replies":["a","b"]} work.
 */
std::vector<std::string> ParseStringArray(const std::string& text);

/**
 * Last-resort fallback for models that answer with prose: strip list markers
 * (1. / - / • / *) and leading/trailing quotes from each non-empty line.
 */
std::vector<std::string> ParseLooseLines(const std::string& text, std::size_t maxItems);

} // namespace JsonUtils
} // namespace SmartReply
