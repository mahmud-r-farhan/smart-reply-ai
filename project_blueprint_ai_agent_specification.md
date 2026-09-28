# AGENTS.md — System Architecture, Agent Directives & Technical Roadmap

> **Target Project:** `smart-reply-ai`  
> **Mission:** Transform a basic reply-generator into a high-performance, cross-platform productivity ecosystem capable of seamless **Zero-Latency Offline Heuristics / On-Device ML** and **Universal OpenAI-Compatible Cloud LLM Orchestration**.

---

## 1. Reality Check & Technical Directives

Before contributing code or executing architectural refactors, every autonomous agent and human contributor must adhere to the following realities:

### 1.1 The "Google ML Kit" Reality
* **Google ML Kit is native-only to Android and iOS.** It does **not** have official, supported runtimes for native Windows desktop, Node.js, or Chrome Extensions.
* **The Solution:** We implement a **Unified Multi-Engine Strategy**:
  1. **Android:** Official Google ML Kit Smart Reply SDK (`com.google.mlkit:smart-reply`).
  2. **Windows Desktop:** High-performance, lightweight **ONNX Runtime (DirectML / CPU)** using quantized zero-shot conversational models or **MediaPipe Desktop C++ / Rust bindings**.
  3. **Web & Browser Extensions:** **Transformers.js (ONNX Runtime Web)** running lightweight WASM/WebGPU models locally, avoiding any server roundtrips.
  4. **Universal Offline Fallback (All Platforms):** Ultra-fast deterministic rule/template engine (~0ms execution overhead) when models are downloading or inactive.

### 1.2 The "OpenAI SDK" Reality
* Every major cloud provider (OpenRouter, Groq, Ollama, DeepSeek, Together, vLLM, LM Studio) supports the OpenAI `/v1/chat/completions` API format.
* Do **not** import separate vendor SDKs. Use the official `openai` client (or native HTTP requests in Rust/C#) with configurable `baseURL`, `apiKey`, and `model`.

### 1.3 Target Performance & Latency Budgets
* **Offline On-Device Suggestion:** $< 30\text{ ms}$ (instant typing assistant experience).
* **Cloud LLM Suggestion:** $< 600\text{ ms}$ to first token (utilizing streaming and fast endpoints such as Groq or OpenRouter fast-tier).
* **Desktop Binary Footprint:** $< 35\text{ MB}$ initial bundle size (native shell). On-device models must be lazily fetched or strictly sub-50MB.

---

## 2. Target System Architecture

```text
                                  +---------------------------------------+
                                  |       Application Presentation        |
                                  | (Tauri Desktop / Ext / Web / Android) |
                                  +---------------------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |        Engine Dispatcher Core         |
                                  |   (Mode: Offline | Hybrid | Cloud)    |
                                  +---------------------------------------+
                                          /                       \
                     [Offline Mode / Latency Sensitive]     [Deep Reasoning / High Context]
                                        /                           \
                                       v                             v
                     +----------------------------------+   +----------------------------------+
                     |    Local On-Device Subsystem     |   |    Universal Cloud Subsystem     |
                     +----------------------------------+   +----------------------------------+
                     | - Android: Google ML Kit         |   | - OpenRouter (Default)           |
                     | - Windows: ONNX DirectML (Rust)  |   | - OpenAI / Anthropic / Groq      |
                     | - Web/Ext: Transformers.js/WASM  |   | - Local Server (Ollama/LM Studio)|
                     | - Fallback: Regex/Pattern Heuristic|  | - Protocol: OpenAI-Compatible API |
                     +----------------------------------+   +----------------------------------+
```

---

## 3. Recommended Platform Stacks

### 3.1 Windows Desktop: Tauri v2 + Rust
* **Why not Electron?** Electron consumes 150MB+ RAM and 120MB+ bundle size for a utility that should idle quietly in the system tray.
* **Stack:**
  * **Core Shell:** Tauri v2 (Rust).
  * **On-Device ML:** `ort` (Rust bindings for ONNX Runtime) with DirectML support for hardware acceleration on Windows.
  * **Global Hotkey & Clipboard:** Tauri Global Shortcut plugin + OS clipboard hooks for instant text detection and inline overlay insertion.
  * **Frontend UI:** React + Tailwind CSS (Vite) or Svelte (minimal footprint).

### 3.2 Android: Modern Native / Compose or Capacitor
* **Core Library:** `com.google.mlkit:smart-reply:17.0.4`.
* **Flow:** Input conversation stream $\rightarrow$ pass history to `SmartReplyGenerator` $\rightarrow$ generate up to 3 quick responses entirely offline.

### 3.3 Chrome / Edge Extension: Manifest V3
* **Background Service Worker:** WebAssembly-driven **Transformers.js** with a tiny quantized model (e.g., `Xenova/Qwen1.5-0.5B-Chat` with WebGPU or a dedicated quantized classification model like `bge-micro`).
* **Content Scripts:** Injectable floating action bar for Gmail, LinkedIn, Slack, WhatsApp Web, and generic text inputs.

---

## 4. Unified Type Definitions & Protocols

All platforms must adhere to the standard provider interface to guarantee interoperability.

```typescript
export type EngineMode = 'offline-only' | 'cloud-only' | 'hybrid-race' | 'fallback';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'peer' | 'system';
  content: string;
  timestamp: number;
}

export interface ReplySuggestion {
  text: string;
  confidence: number;
  source: 'mlkit' | 'onnx' | 'cloud-llm' | 'heuristic';
  latencyMs: number;
}

export interface CloudProviderConfig {
  id: string;
  name: string;
  baseURL: string; // Defaults to "https://openrouter.ai/api/v1"
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface EngineSettings {
  mode: EngineMode;
  activeProviderId: string;
  providers: CloudProviderConfig[];
  enableSystemTray: boolean;
  enableGlobalShortcuts: boolean;
  tone: 'professional' | 'casual' | 'concise' | 'humorous';
}

export interface ISmartReplyEngine {
  generateReplies(history: ChatMessage[], tone?: string): Promise<ReplySuggestion[]>;
  isOfflineCapable(): boolean;
  dispose(): Promise<void>;
}
```

---

## 5. Universal OpenAI-Compatible Cloud Adapter

Agents must use this baseline pattern for any cloud LLM execution:

```typescript
import OpenAI from 'openai';
import { ChatMessage, CloudProviderConfig, ReplySuggestion } from './types';

export class UniversalCloudEngine {
  private client: OpenAI;
  private config: CloudProviderConfig;

  constructor(config: CloudProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true, // Needed for Extension/Web contexts
    });
  }

  async getSuggestions(history: ChatMessage[], tone: string = 'professional'): Promise<ReplySuggestion[]> {
    const startTime = performance.now();
    
    const formattedHistory = history
      .map((msg) => `${msg.sender === 'user' ? 'Me' : 'Them'}: ${msg.content}`)
      .join('\n');

    const prompt = `Context:\n${formattedHistory}\n\nTask: Generate 3 distinct, high-quality, contextual short replies matching tone "${tone}". Output strictly a JSON array of strings: ["reply1", "reply2", "reply3"].`;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 150,
      response_format: { type: 'json_object' },
    });

    const elapsed = Math.round(performance.now() - startTime);
    const rawContent = response.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(rawContent);
      const list: string[] = Array.isArray(parsed) ? parsed : parsed.replies || Object.values(parsed);
      return list.map((text) => ({
        text,
        confidence: 0.95,
        source: 'cloud-llm',
        latencyMs: elapsed,
      }));
    } catch {
      return [];
    }
  }
}
```

---

## 6. Hybrid Dispatcher Pattern (Zero-Latency Guarantee)

When in `hybrid-race` mode, the dispatcher immediately triggers the local on-device engine. If the cloud engine completes within a specific window (e.g., 400ms), it enriches the result; otherwise, the user receives local suggestions instantaneously without waiting.

```typescript
export class HybridDispatcher {
  constructor(
    private localEngine: ISmartReplyEngine,
    private cloudEngine: ISmartReplyEngine
  ) {}

  async fetchSmartReplies(history: ChatMessage[], timeoutMs = 400): Promise<ReplySuggestion[]> {
    // 1. Fetch local instantly
    const localPromise = this.localEngine.generateReplies(history);

    // 2. Fetch cloud with a race timeout
    const cloudPromise = Promise.race([
      this.cloudEngine.generateReplies(history),
      new Promise<ReplySuggestion[]>((_, reject) =>
        setTimeout(() => reject(new Error('Cloud timeout')), timeoutMs)
      ),
    ]);

    try {
      const cloudResults = await cloudPromise;
      if (cloudResults && cloudResults.length > 0) return cloudResults;
    } catch {
      // Fallback cleanly to local suggestions
    }

    return await localPromise;
  }
}
```

---

## 7. Step-by-Step Implementation Roadmap

### Phase 1: Core Decoupling & Monorepo Structure
Convert repository into a pnpm / turbo monorepo:
* `packages/core`: Unified types, interfaces, prompt templates, and OpenAI adapter.
* `packages/engine-local-web`: Transformers.js runtime for browser and extension.
* `packages/extension`: Chrome Manifest V3 extension.
* `packages/desktop`: Tauri v2 Windows/macOS desktop application.
* `packages/android`: Android native library / wrapper using ML Kit.

### Phase 2: Windows Desktop App with Tauri v2
1. Initialize `tauri-app` inside `packages/desktop`.
2. Configure system tray icon (`minimize to tray`, `always on top` toggle).
3. Bind OS clipboard reader on global shortcut (`Ctrl + Shift + R`).
4. Display a floating pill UI next to the cursor with 3 quick suggestions.
5. Clicking a suggestion auto-copies or injects text into the active focused window.

### Phase 3: Android Native Integration with ML Kit
1. Import `com.google.mlkit:smart-reply`.
2. Map incoming notifications/conversations into `TextMessage.createForRemoteUser` and `TextMessage.createForLocalUser`.
3. Call `SmartReplyGenerator.suggestReplies(conversation)`.

### Phase 4: Provider Configuration Engine
Add out-of-the-box templates for:
* **OpenRouter** (Default: `anthropic/claude-3-haiku`, `meta-llama/llama-3.3-70b-instruct`)
* **Groq** (`llama-3.1-8b-instant` for ultra-fast latency)
* **Ollama** (`http://localhost:11434/v1` for 100% offline self-hosted LLMs)
* **Custom OpenAI Endpoints** (DeepSeek, Together, vLLM)

---

## 8. Development Rules & Contribution Standards for Agents

1. **No Proprietary Vendor Lock-in:** Never build a hardcoded client for a single vendor when an OpenAI-standard client can do it.
2. **Never Block the UI Thread:** All local model operations (ONNX, Transformers.js, ML Kit) must run in Web Workers, background Rust threads, or background coroutines.
3. **Graceful Degradation:** If model download fails or no network is found, fallback to regex heuristics and prompt the user gracefully.
4. **Security & Privacy:** API keys must only be saved locally (e.g., using `tauri-plugin-store` with encryption or `chrome.storage.local`). Never transmit API keys to intermediate proxy servers.