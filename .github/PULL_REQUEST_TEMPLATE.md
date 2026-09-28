## Description
<!-- Please include a concise summary of the change and which issue it resolves (if applicable). -->

Fixes #(issue)

## Type of Change
<!-- Mark the relevant options with an 'x' -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring / Performance optimization
- [ ] Documentation update
- [ ] CI / Build tooling update

## Component Affected
<!-- Mark all applicable components -->
- [ ] Flutter Client (`smart_reply_app/`)
  - [ ] Android / iOS
  - [ ] Desktop (Windows / macOS / Linux)
  - [ ] Web
- [ ] Native C++ Desktop (`desktop/`)
- [ ] React Frontend (`frontend/`)
- [ ] Chrome Extension MV3 (`extension/`)
- [ ] Node.js Backend (`backend/`)
- [ ] Core Engine / Heuristics

## Verification & Testing
<!-- Describe the tests that you ran to verify your changes. -->
- [ ] Flutter analyze passed (`flutter analyze --fatal-infos`)
- [ ] Flutter unit tests passed (`flutter test`)
- [ ] Frontend build succeeded (`npm run build` in `frontend/`)
- [ ] Backend tests passed (`npm test` in `backend/`)
- [ ] Desktop C++ compilation succeeded
- [ ] Tested offline heuristic baseline fallback (< 5ms response)
- [ ] Tested cloud LLM provider connection (OpenAI / Groq / Ollama)

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or linter errors
- [ ] I have verified that no private API keys, secrets, or personal data are committed
