# Security Policy

The SmartReply AI team takes the security and privacy of our users very seriously. Given that this project processes user communication and handles AI provider credentials (BYOK), we prioritize secure coding practices, zero-telemetry defaults, and transparent vulnerability reporting.

---

## Supported Versions

We provide security patches for the following versions:

| Version | Supported          |
| :---    | :---               |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability within SmartReply AI, please report it privately:

1. **Do not create a public GitHub issue.**
2. Send an email to the repository maintainer or submit a private security advisory through GitHub:
   - Navigate to [Security Advisories](https://github.com/mahmud-r-farhan/smart-reply-ai/security/advisories)
   - Click **Report a vulnerability**
3. Include the following details in your report:
   - Description of the vulnerability and its potential impact.
   - Proof of concept (PoC) code or step-by-step reproduction instructions.
   - Component affected (Flutter client, Win32 C++, Extension, Backend, or Dependencies).
   - Any suggested mitigations.

### Response Timeline
- **Initial Acknowledgment:** Within 48 hours.
- **Triage & Assessment:** Within 5 business days.
- **Fix & Disclosure:** Coordinated release once a patched version is available.

---

## Core Security & Privacy Principles

### 1. Bring Your Own Key (BYOK)
- All user-supplied API keys (e.g. OpenAI, Groq, OpenRouter) are stored client-side only (via platform secure storage, `chrome.storage.local`, or local config files).
- Client applications communicate directly with user-configured endpoints via HTTPS. Keys are never logged or forwarded to external third parties.

### 2. Zero-Telemetry & Local Heuristic Isolation
- The offline heuristic engine runs entirely on-device and performs no network socket connections or file system leaks.
- No analytics or crash telemetry is collected without explicit user opt-in.

### 3. Local Model Verification
- When using local inference (such as Ollama on `127.0.0.1:11434`), communication stays entirely within the localhost loopback interface.
