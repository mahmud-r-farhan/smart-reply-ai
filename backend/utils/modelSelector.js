export const PROVIDER_PRESETS = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter (Multi-model Cloud)",
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    fallbackModel: "google/gemini-2.0-flash-exp:free"
  },
  groq: {
    id: "groq",
    name: "Groq (Ultra-Low Latency LPU)",
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    fallbackModel: "mixtral-8x7b-32768"
  },
  ollama: {
    id: "ollama",
    name: "Ollama (Local On-Device Server)",
    baseURL: "http://localhost:11434/v1",
    defaultModel: "llama3.2:latest",
    fallbackModel: "qwen2.5:latest"
  },
  openai: {
    id: "openai",
    name: "OpenAI Direct",
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    fallbackModel: "gpt-3.5-turbo"
  }
};

export const MODELS = {
  SUGGESTIONS: {
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "qwen/qwen-2.5-7b-instruct:free"
    ],
    default: "meta-llama/llama-3.3-70b-instruct:free"
  },
  ENHANCEMENTS: {
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "deepseek/deepseek-chat",
      "qwen/qwen-2.5-7b-instruct:free"
    ],
    default: "meta-llama/llama-3.3-70b-instruct:free"
  },
  TRANSLATIONS: {
    models: [
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "qwen/qwen-2.5-7b-instruct:free"
    ],
    default: "google/gemini-2.0-flash-exp:free"
  },
  SUMMARIZATION: {
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "qwen/qwen-2.5-7b-instruct:free"
    ],
    default: "meta-llama/llama-3.3-70b-instruct:free"
  }
};

// Supported formats/tones
export const FORMATS = {
  PROFESSIONAL: "professional",
  CASUAL: "casual",
  FRIENDLY: "friendly",
  FORMAL: "formal",
  FLIRTY: "flirty",
  ROMANTIC: "romantic",
  CONCISE: "concise"
};

/**
 * Legacy wire aliases. Clients shipped in v1.1.0 send the misspelled token
 * "flating"; accept it forever so those installs keep working.
 */
export const FORMAT_ALIASES = {
  flating: FORMATS.FLIRTY
};

export const VALID_FORMATS = Object.values(FORMATS);

/** Normalize case and legacy aliases to the canonical wire value. */
export const normalizeFormat = (format) => {
  if (typeof format !== "string") return format;
  const lower = format.trim().toLowerCase();
  return FORMAT_ALIASES[lower] || lower;
};

/* Get a model for the specified operation type */
export const getModel = (operationType, index = 0) => {
  const operation = MODELS[operationType] || MODELS.SUGGESTIONS;
  const selectedIndex = index % operation.models.length;
  return operation.models[selectedIndex];
};

/* Get default model for the specified operation type */
export const getDefaultModel = (operationType) => {
  const operation = MODELS[operationType] || MODELS.SUGGESTIONS;
  return operation.default;
};

/* Validate if format is supported */
export const isValidFormat = (format) => {
  if (!format) return true;
  return VALID_FORMATS.includes(normalizeFormat(format));
};

/* Get all available formats */
export const getAvailableFormats = () => {
  return VALID_FORMATS;
};

// Get format instruction for the LLM
export const getFormatInstruction = (format) => {
  const lowerFormat = normalizeFormat(format || "professional");
  
  const instructions = {
    professional: "in a professional, business-appropriate tone",
    casual: "in a casual, conversational tone",
    friendly: "in a warm, approachable, and genuinely friendly tone. Be encouraging and personable, using inclusive and positive language.",
    formal: "in a formal, respectful tone suitable for official correspondence",
    flirty: "as a playful, flirtatious compliment that shows romantic interest while staying tasteful and respectful",
    romantic: "as a heartfelt romantic expression conveying genuine affection and emotional depth",
    concise: "in an extremely clear, concise, and to-the-point manner without unnecessary filler"
  };
  
  return instructions[lowerFormat] || instructions.professional;
};
