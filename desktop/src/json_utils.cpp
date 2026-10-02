#include "json_utils.h"

#include <cctype>
#include <cstdio>

namespace SmartReply {
namespace JsonUtils {

namespace {

void AppendUtf8(uint32_t codePoint, std::string& out) {
    if (codePoint == 0) return; // NUL cannot appear in a std::string payload
    if (codePoint < 0x80) {
        out += static_cast<char>(codePoint);
    } else if (codePoint < 0x800) {
        out += static_cast<char>(0xC0 | (codePoint >> 6));
        out += static_cast<char>(0x80 | (codePoint & 0x3F));
    } else if (codePoint < 0x10000) {
        out += static_cast<char>(0xE0 | (codePoint >> 12));
        out += static_cast<char>(0x80 | ((codePoint >> 6) & 0x3F));
        out += static_cast<char>(0x80 | (codePoint & 0x3F));
    } else {
        out += static_cast<char>(0xF0 | (codePoint >> 18));
        out += static_cast<char>(0x80 | ((codePoint >> 12) & 0x3F));
        out += static_cast<char>(0x80 | ((codePoint >> 6) & 0x3F));
        out += static_cast<char>(0x80 | (codePoint & 0x3F));
    }
}

bool ParseHex4(const std::string& text, size_t pos, uint32_t& outValue) {
    if (pos + 4 > text.size()) return false;
    uint32_t value = 0;
    for (size_t i = 0; i < 4; ++i) {
        const char c = text[pos + i];
        value <<= 4;
        if (c >= '0' && c <= '9') value |= static_cast<uint32_t>(c - '0');
        else if (c >= 'a' && c <= 'f') value |= static_cast<uint32_t>(c - 'a' + 10);
        else if (c >= 'A' && c <= 'F') value |= static_cast<uint32_t>(c - 'A' + 10);
        else return false;
    }
    outValue = value;
    return true;
}

/** Read a JSON string starting at the opening quote; returns index past the closing quote. */
bool ReadJsonString(const std::string& text, size_t start, std::string& outValue, size_t& outNext) {
    if (start >= text.size() || text[start] != '"') return false;

    std::string raw;
    size_t i = start + 1;
    for (; i < text.size(); ++i) {
        const char c = text[i];
        if (c == '\\') {
            if (i + 1 >= text.size()) return false;
            raw += c;
            raw += text[i + 1];
            ++i;
            if (text[i] == 'u' && i + 4 < text.size()) {
                raw += text.substr(i + 1, 4);
                i += 4;
            }
            continue;
        }
        if (c == '"') break;
        raw += c;
    }
    if (i >= text.size()) return false; // unterminated string

    outValue = UnescapeString(raw);
    outNext = i + 1;
    return true;
}

} // namespace

std::string EscapeString(const std::string& input) {
    std::string out;
    out.reserve(input.size() + input.size() / 8 + 8);

    for (unsigned char c : input) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\b': out += "\\b";  break;
            case '\f': out += "\\f";  break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            default:
                if (c < 0x20) {
                    char buffer[7];
                    std::snprintf(buffer, sizeof(buffer), "\\u%04x", c);
                    out += buffer;
                } else {
                    out += static_cast<char>(c); // UTF-8 bytes pass through untouched
                }
        }
    }
    return out;
}

std::string UnescapeString(const std::string& input) {
    std::string out;
    out.reserve(input.size());

    for (size_t i = 0; i < input.size(); ++i) {
        const char c = input[i];
        if (c != '\\' || i + 1 >= input.size()) {
            out += c;
            continue;
        }

        const char next = input[++i];
        switch (next) {
            case '"':  out += '"';  break;
            case '\\': out += '\\'; break;
            case '/':  out += '/';  break;
            case 'b':  out += '\b'; break;
            case 'f':  out += '\f'; break;
            case 'n':  out += '\n'; break;
            case 'r':  out += '\r'; break;
            case 't':  out += '\t'; break;
            case 'u': {
                uint32_t codePoint = 0;
                if (!ParseHex4(input, i + 1, codePoint)) {
                    out += "\\u";
                    break;
                }
                i += 4;

                // Combine UTF-16 surrogate pairs into a single code point.
                if (codePoint >= 0xD800 && codePoint <= 0xDBFF && i + 6 < input.size() &&
                    input[i + 1] == '\\' && input[i + 2] == 'u') {
                    uint32_t low = 0;
                    if (ParseHex4(input, i + 3, low) && low >= 0xDC00 && low <= 0xDFFF) {
                        i += 6;
                        codePoint = 0x10000 + ((codePoint - 0xD800) << 10) + (low - 0xDC00);
                    }
                }
                AppendUtf8(codePoint, out);
                break;
            }
            default:
                // Unknown escape: keep the character as-is rather than dropping data.
                out += next;
        }
    }
    return out;
}

bool ExtractStringValue(const std::string& json, const std::string& key, std::string& outValue) {
    const std::string needle = "\"" + key + "\"";
    size_t pos = json.find(needle);
    while (pos != std::string::npos) {
        size_t cursor = pos + needle.size();
        while (cursor < json.size() && std::isspace(static_cast<unsigned char>(json[cursor]))) ++cursor;
        if (cursor < json.size() && json[cursor] == ':') {
            ++cursor;
            while (cursor < json.size() && std::isspace(static_cast<unsigned char>(json[cursor]))) ++cursor;
            std::string value;
            size_t next = cursor;
            if (ReadJsonString(json, cursor, value, next)) {
                outValue = value;
                return true;
            }
            return false; // key exists but is not a string value
        }
        pos = json.find(needle, pos + 1);
    }
    return false;
}

std::vector<std::string> ParseStringArray(const std::string& text) {
    std::vector<std::string> results;

    const size_t start = text.find('[');
    if (start == std::string::npos) return results;

    size_t cursor = start + 1;
    while (cursor < text.size()) {
        while (cursor < text.size() && std::isspace(static_cast<unsigned char>(text[cursor]))) ++cursor;
        if (cursor >= text.size()) break;

        if (text[cursor] == ']') break; // end of array

        if (text[cursor] == ',') { ++cursor; continue; }

        if (text[cursor] == '"') {
            std::string value;
            size_t next = cursor;
            if (!ReadJsonString(text, cursor, value, next)) break;
            if (!value.empty()) results.push_back(value);
            cursor = next;
            continue;
        }

        // Skip non-string elements (numbers, nested objects/arrays, literals).
        int depth = 0;
        bool inString = false;
        for (; cursor < text.size(); ++cursor) {
            const char c = text[cursor];
            if (inString) {
                if (c == '\\') { ++cursor; continue; }
                if (c == '"') inString = false;
                continue;
            }
            if (c == '"') { inString = true; continue; }
            if (c == '[' || c == '{') { ++depth; continue; }
            if (c == ']' || c == '}') {
                if (depth == 0 && c == ']') break;
                --depth;
                continue;
            }
            if (c == ',' && depth == 0) break;
        }
    }

    return results;
}

std::vector<std::string> ParseLooseLines(const std::string& text, size_t maxItems) {
    std::vector<std::string> results;
    std::string current;

    auto flush = [&]() {
        size_t begin = 0;
        size_t end = current.size();
        while (begin < end && std::isspace(static_cast<unsigned char>(current[begin]))) ++begin;
        while (end > begin && std::isspace(static_cast<unsigned char>(current[end - 1]))) --end;
        std::string line = current.substr(begin, end - begin);
        current.clear();

        if (line.empty()) return;
        if (line.rfind("```", 0) == 0) return; // fenced code marker

        // Strip list markers: "1. ", "2) ", "- ", "* ", "• ".
        size_t marker = 0;
        size_t digits = 0;
        while (digits < line.size() && std::isdigit(static_cast<unsigned char>(line[digits]))) ++digits;
        if (digits > 0 && digits < line.size() && (line[digits] == '.' || line[digits] == ')')) {
            marker = digits + 1;
        } else if (line[0] == '-' || line[0] == '*') {
            marker = 1;
        } else if (line.compare(0, 3, "\xE2\x80\xA2") == 0) { // UTF-8 bullet "•"
            marker = 3;
        }
        while (marker < line.size() && line[marker] == ' ') ++marker;
        if (marker > 0 && marker < line.size()) {
            line = line.substr(marker);
        }

        // Strip surrounding quotes.
        if (line.size() >= 2 && ((line.front() == '"' && line.back() == '"') ||
                                 (line.front() == '\'' && line.back() == '\''))) {
            line = line.substr(1, line.size() - 2);
        }

        if (!line.empty() && results.size() < maxItems) results.push_back(line);
    };

    for (char c : text) {
        if (c == '\n') flush();
        else if (c != '\r') current += c;
    }
    flush();

    return results;
}

} // namespace JsonUtils
} // namespace SmartReply
