# Contributing to SmartReply AI

First off, thank you for considering contributing to **SmartReply AI**! It's people like you that make SmartReply AI such an empowering, open-source AI productivity suite for everyone.

Following these guidelines helps maintain clean code, consistent styles, high performance, and rapid review turnaround.

---

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Project Architecture Overview](#project-architecture-overview)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Local Development Setup](#local-development-setup)
  - [Flutter Application (Multiplatform)](#1-flutter-application-smart_reply_app)
  - [React Web Application](#2-react-web-application-frontend)
  - [Chrome Extension (MV3)](#3-chrome-extension-mv3-extension)
  - [Node.js Backend & API](#4-nodejs-backend-backend)
  - [Native Win32 C++ Desktop](#5-native-win32-c-desktop-desktop)
- [Coding & Design Standards](#coding--design-standards)
- [Commit Message Conventions](#commit-message-conventions)
- [Testing & Quality Verification](#testing--quality-verification)
- [License](#license)

---

## Code of Conduct

This project and everyone participating in it is governed by the [SmartReply AI Code of Conduct](.github/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior following the guidelines in that file.

---

## Project Architecture Overview

SmartReply AI follows a **Hybrid Dual-Engine Architecture**:
1. **Offline Heuristic Engine (< 5ms)**: Instant on-device pattern recognition, sentiment heuristics, intent categorization, and grammar normalization without network calls or API keys.
2. **Universal Cloud LLM Engine (BYOK)**: Orchestrator compatible with any standard OpenAI-format endpoint (Groq, OpenRouter, Ollama, OpenAI, Together, DeepSeek).

For detailed subsystem diagrams and component flows, review [ARCHITECTURE.md](ARCHITECTURE.md).

---

## How Can I Contribute?

### Reporting Bugs
Before filing an issue:
1. Search existing [GitHub Issues](https://github.com/mahmud-r-farhan/smart-reply-ai/issues) to ensure the bug hasn't already been reported.
2. Reproduce the bug on the latest `master` branch.
3. Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:
   - Operating system and version.
   - Client runtime (Flutter, React web, Chrome Extension, HarmonyOS ArkTS, or Win32 C++).
   - Engine mode (Smart Reply, Enhance, Translate, Summarize).
   - Input text and exact error message / stack trace.
   - Steps to reproduce.

### Suggesting Features
We welcome feature suggestions that align with our core goals: zero-latency offline intelligence, seamless multiplatform presence, and user privacy (BYOK).
- Open an issue using the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml).
- Explain the user problem and the proposed technical implementation.

### Pull Requests
1. Fork the repository and create your branch from `master`.
2. Ensure dependencies are cleanly installed without altering package-lock versions unnecessarily.
3. Maintain modularity: keep components small, reusable, and single-responsibility.
4. Verify all tests and linter checks pass before submitting.
5. Reference any relevant issue in your PR description.

---

## Local Development Setup

### 1. Flutter Application (`smart_reply_app/`)
The Flutter client targets Android, iOS, Windows, macOS, Linux, and Web.

**Prerequisites:** Flutter SDK >= 3.20.0, Dart SDK >= 3.3.0.

```bash
cd smart_reply_app
flutter pub get

# Run on your desktop platform
flutter run -d windows    # or -d macos / -d linux

# Run on Chrome web
flutter run -d chrome

# Run tests & analysis
flutter analyze
flutter test
```

### 2. React Web Application (`frontend/`)
Vite-powered Single Page Application.

**Prerequisites:** Node.js >= 18.0.0, npm >= 9.0.0.

```bash
cd frontend
npm install
npm run dev

# Production build test
npm run build
```

### 3. Chrome Extension MV3 (`extension/`)
Manifest V3 browser extension with offline-first heuristic fallback and floating overlay support.

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` folder.
4. When editing files (`background.js`, `content.js`, `popup.js`), click the reload icon on the extension card in `chrome://extensions/`.

### 4. Node.js Backend (`backend/`)
Express.js microservice providing multi-provider cloud orchestration and heuristic fallback.

```bash
cd backend
npm install
npm run dev     # Starts the nodemon dev server on http://localhost:5006
npm test        # Runs the Node test suite (node --test)
npm run start:cluster   # Multi-core production cluster (WORKERS=N)
```

### 5. Native Win32 C++ Desktop (`desktop/`)
Lightweight (< 2 MB) standalone Windows executable with global keyboard hooks (`Ctrl+Shift+R`), GDI+ floating palette, and WinINet HTTP client.

**Prerequisites:** Visual Studio 2022 / MSVC (C++17) or MinGW-w64, CMake >= 3.16.

```bash
cd desktop
mkdir build && cd build
cmake ..
cmake --build . --config Release

# Or quick build using the batch script on Windows:
.\build.bat
```

---

## Coding & Design Standards

### Modularity & Architecture
- **Single Responsibility Principle**: Decompose large views into focused widgets/components. For example, see [smart_reply_app/lib/widgets/](smart_reply_app/lib/widgets/).
- **Zero-Latency Offline Baseline**: Any AI feature must include an offline heuristic fallback so that users get immediate value even when offline or without an API key.
- **Provider Agnostic**: Cloud calls must route through the universal OpenAI-compatible schema (`/v1/chat/completions`) accepting custom `baseUrl`, `apiKey`, and `modelId`.

### Style Guides
- **Dart / Flutter**: Follow [Effective Dart](https://dart.dev/guides/language/effective-dart) rules enforced by `flutter_lints`.
- **JavaScript / React**: ES6+, modular JSX components, vanilla CSS variables matching our dark-mode glassmorphic theme.
- **C++**: Modern C++17, RAII resource management, clean Win32 handle encapsulation.
- **ArkTS (HarmonyOS)**: Keep Stage-model resources in sync and run the structure validation used by CI (`harmonyos-native-check`).

---

## Commit Message Conventions

We adhere to [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short imperative summary>

[optional body]

[optional footer(s)]
```

### Common Types:
- `feat`: A new feature or capability.
- `fix`: A bug fix.
- `docs`: Documentation changes only.
- `style`: Changes that do not affect code meaning (formatting, whitespace).
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `ci`: Changes to CI/CD workflows and configuration scripts.
- `chore`: Maintenance tasks, dependency bumps.

---

## Testing & Quality Verification

Before opening a pull request, ensure the following pass locally:

1. **Flutter**:
   ```bash
   cd smart_reply_app
   flutter analyze --fatal-infos
   flutter test
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
3. **Backend**:
   ```bash
   cd backend
   npm test
   ```
4. **Desktop C++**:
   Ensure compilation succeeds with zero warnings.

---

## License

By contributing, you agree that your contributions will be licensed under the project's [Apache 2.0 License](LICENSE).
