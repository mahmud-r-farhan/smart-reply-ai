// CONSTANTS & ICONS
const DEFAULT_BACKEND_URL = 'http://localhost:5006/api';
const DEFAULT_PROVIDER = 'groq';
const DEFAULT_ENGINE_MODE = 'hybrid';

const icons = {
  spinner: `<svg class="icon icon-sm spinner" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
    <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
  copy: `<svg class="icon icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>`,
  insert: `<svg class="icon icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>`,
  check: `<svg class="icon icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
  </svg>`,
  lightning: `<svg class="icon icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>`
};

// STATE MANAGEMENT
const state = {
  mode: 'reply',
  engineMode: DEFAULT_ENGINE_MODE,
  provider: DEFAULT_PROVIDER,
  apiKey: '',
  backendUrl: DEFAULT_BACKEND_URL,
  isLoading: false
};

// UTILITIES
const utils = {
  $: (s) => document.querySelector(s),
  $$: (s) => document.querySelectorAll(s),
  
  showView: (viewId) => {
    utils.$$('.view').forEach(v => v.classList.remove('active'));
    utils.$(`#${viewId}`).classList.add('active');
  },

  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      textarea.remove();
      return success;
    }
  }
};

// COMPONENTS
const components = {
  errorAlert: (message) => `
    <div class="alert alert-error">
      <strong>Error:</strong> ${utils.escapeHtml(message)}
    </div>
  `,

  emptyState: () => `
    <div class="empty-state">
      <svg class="icon icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="text-secondary text-sm">Suggestions will appear here</p>
    </div>
  `,

  suggestionCard: (text, index) => {
    const escaped = utils.escapeHtml(text);
    return `
      <div class="card" data-index="${index}">
        <p class="card-text">${escaped}</p>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm copy-btn" data-index="${index}" title="Copy">
            ${icons.copy}
            <span>Copy</span>
          </button>
          <button class="btn btn-secondary btn-sm insert-btn" data-index="${index}" title="Insert into page field">
            ${icons.insert}
            <span>Insert</span>
          </button>
        </div>
      </div>
    `;
  }
};

const api = (typeof chrome !== 'undefined' ? chrome : browser);

const chromeApi = {
  getSelectedText: async () => {
    try {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (!tab) return '';
      const result = await api.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
      return result?.text || '';
    } catch {
      return '';
    }
  },

  insertText: async (text) => {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');
    await api.tabs.sendMessage(tab.id, { action: 'insertText', text });
    return true;
  },

  loadSettings: async () => {
    return await api.storage.sync.get({
      engineMode: DEFAULT_ENGINE_MODE,
      provider: DEFAULT_PROVIDER,
      apiKey: '',
      backendUrl: DEFAULT_BACKEND_URL
    });
  },

  saveSettings: async (settings) => {
    await api.storage.sync.set(settings);
    return settings;
  },

  sendMessage: async (action, data) => {
    return await api.runtime.sendMessage({ action, ...data });
  }
};

// UI CONTROLLER
const ui = {
  setLoading: (loading) => {
    state.isLoading = loading;
    const btn = utils.$('#generateBtn');
    let modeText = 'Generating...';
    let normalText = 'Generate Suggestions';

    if (state.mode === 'enhance') {
      modeText = 'Enhancing...';
      normalText = 'Enhance Text';
    } else if (state.mode === 'translate') {
      modeText = 'Translating...';
      normalText = 'Translate Text';
    } else if (state.mode === 'summarize') {
      modeText = 'Summarizing...';
      normalText = 'Summarize Text';
    }

    btn.disabled = loading;
    btn.innerHTML = loading 
      ? `${icons.spinner} ${modeText}`
      : `${icons.lightning} <span>${normalText}</span>`;
  },

  showResults: (results, telemetry) => {
    const container = utils.$('#resultsContainer');
    const telemetryBanner = utils.$('#telemetryBanner');
    const telemetrySource = utils.$('#telemetrySource');
    const telemetryLatency = utils.$('#telemetryLatency');

    if (telemetry && telemetry.latencyMs) {
      telemetryBanner.style.display = 'flex';
      const isLocal = telemetry.source === 'heuristic';
      telemetrySource.textContent = isLocal ? '⚡ On-Device Heuristic' : `☁️ Cloud (${telemetry.model || 'LLM'})`;
      telemetrySource.style.color = isLocal ? '#34d399' : '#818cf8';
      telemetryLatency.textContent = `${telemetry.latencyMs}ms`;
    }

    if (!results || results.length === 0) {
      container.innerHTML = '<p class="text-secondary text-sm" style="text-align:center; padding:20px;">No results. Please try again.</p>';
      return;
    }

    container.innerHTML = results.map((t, idx) => components.suggestionCard(t, idx)).join('');

    // Attach copy button handlers
    utils.$$('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        const text = results[idx];
        const success = await utils.copyToClipboard(text);
        if (success) {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = `${icons.check} Copied!`;
          btn.disabled = true;
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
          }, 2000);
        }
      });
    });

    // Attach insert button handlers
    utils.$$('.insert-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        const text = results[idx];
        try {
          await chromeApi.insertText(text);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = `${icons.check} Inserted!`;
          btn.disabled = true;
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
          }, 2000);
        } catch (err) {
          alert(err.message || 'Could not insert text. Click inside a text box first.');
        }
      });
    });
  },

  showError: (message) => {
    const container = utils.$('#resultsContainer');
    container.innerHTML = components.errorAlert(message);
  },

  updateModeUI: () => {
    const inputLabel = utils.$('#inputLabel');
    const inputField = utils.$('#inputText');
    const generateBtn = utils.$('#generateBtn');
    const langGroup = utils.$('#languageGroup');

    langGroup.classList.add('hidden');

    if (state.mode === 'reply') {
      inputLabel.textContent = 'Message to Reply To';
      inputField.placeholder = 'Paste message or highlight text...';
      generateBtn.innerHTML = `${icons.lightning} <span>Generate Suggestions</span>`;
    } else if (state.mode === 'enhance') {
      inputLabel.textContent = 'Text to Enhance';
      inputField.placeholder = 'Paste your text to enhance...';
      generateBtn.innerHTML = `${icons.lightning} <span>Enhance Text</span>`;
    } else if (state.mode === 'translate') {
      inputLabel.textContent = 'Text to Translate';
      inputField.placeholder = 'Paste text to translate...';
      generateBtn.innerHTML = `${icons.lightning} <span>Translate Text</span>`;
      langGroup.classList.remove('hidden');
    } else if (state.mode === 'summarize') {
      inputLabel.textContent = 'Text to Summarize';
      inputField.placeholder = 'Paste long message, email, or meeting notes...';
      generateBtn.innerHTML = `${icons.lightning} <span>Summarize Text</span>`;
    }
  }
};

// HANDLERS
const handlers = {
  switchMode: (mode) => {
    state.mode = mode;
    utils.$$('.tab').forEach(tab => tab.classList.remove('active'));
    const tabBtn = utils.$(`#mode${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (tabBtn) tabBtn.classList.add('active');
    ui.updateModeUI();
  },

  generate: async () => {
    const inputText = utils.$('#inputText').value.trim();
    const style = utils.$('#styleSelect').value;
    const toLang = utils.$('#toLangSelect').value || 'spanish';

    if (!inputText) {
      ui.showError('Please enter some text first');
      return;
    }

    ui.setLoading(true);

    try {
      const response = await chromeApi.sendMessage('getResults', {
        input: inputText,
        style,
        mode: state.mode,
        to_lang: toLang
      });

      if (response && response.results) {
        ui.showResults(response.results, {
          latencyMs: response.latencyMs || 2,
          source: response.source || 'heuristic',
          model: response.model
        });
      } else {
        ui.showError(response?.error || 'Failed to generate suggestions');
      }
    } catch (err) {
      ui.showError(err.message || 'Error communicating with extension background.');
    } finally {
      ui.setLoading(false);
    }
  },

  openSettings: async () => {
    const settings = await chromeApi.loadSettings();
    utils.$('#engineModeSelect').value = settings.engineMode || 'hybrid';
    utils.$('#providerSelect').value = settings.provider || 'groq';
    utils.$('#apiKeyInput').value = settings.apiKey || '';
    utils.$('#backendUrlInput').value = settings.backendUrl || DEFAULT_BACKEND_URL;
    utils.showView('settingsView');
  },

  saveSettings: async () => {
    const engineMode = utils.$('#engineModeSelect').value;
    const provider = utils.$('#providerSelect').value;
    const apiKey = utils.$('#apiKeyInput').value.trim();
    const backendUrl = utils.$('#backendUrlInput').value.trim() || DEFAULT_BACKEND_URL;

    let baseURL = 'https://api.groq.com/openai/v1';
    let model = 'llama-3.1-8b-instant';

    if (provider === 'openrouter') {
      baseURL = 'https://openrouter.ai/api/v1';
      model = 'meta-llama/llama-3.3-70b-instruct:free';
    } else if (provider === 'ollama') {
      baseURL = 'http://localhost:11434/v1';
      model = 'llama3.2:latest';
    }

    await chromeApi.saveSettings({
      engineMode,
      provider,
      apiKey,
      baseURL,
      model,
      backendUrl
    });

    state.engineMode = engineMode;
    state.provider = provider;
    state.apiKey = apiKey;

    const badge = utils.$('#engineBadge');
    if (badge) {
      badge.textContent = engineMode === 'offline' ? 'OFFLINE 🔒' : engineMode === 'cloud' ? 'CLOUD ☁️' : 'HYBRID ⚡';
    }

    utils.showView('mainView');
  }
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
  // Tab listeners
  utils.$('#modeReply').addEventListener('click', () => handlers.switchMode('reply'));
  utils.$('#modeEnhance').addEventListener('click', () => handlers.switchMode('enhance'));
  utils.$('#modeTranslate').addEventListener('click', () => handlers.switchMode('translate'));
  utils.$('#modeSummarize').addEventListener('click', () => handlers.switchMode('summarize'));

  // Button listeners
  utils.$('#generateBtn').addEventListener('click', handlers.generate);
  utils.$('#settingsBtn').addEventListener('click', handlers.openSettings);
  utils.$('#backBtn').addEventListener('click', () => utils.showView('mainView'));
  utils.$('#saveBtn').addEventListener('click', handlers.saveSettings);

  // Keyboard shortcut Ctrl/Cmd+Enter
  utils.$('#inputText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlers.generate();
    }
  });

  // Auto-fill selected text or pending action
  try {
    const localData = await api.storage.local.get(['pendingAction']);
    if (localData?.pendingAction) {
      const { mode, input } = localData.pendingAction;
      if (mode) handlers.switchMode(mode);
      if (input) utils.$('#inputText').value = input;
      await api.storage.local.remove(['pendingAction']);
      return;
    }

    const selectedText = await chromeApi.getSelectedText();
    if (selectedText) {
      utils.$('#inputText').value = selectedText;
    }
  } catch {}
});