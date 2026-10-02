import { motion } from "framer-motion";
import { Zap, Trash2, Clipboard, Sparkles } from "lucide-react";
import TextareaAutoResize from "./TextareaAutoResize";

const SAMPLE_PROMPTS = {
  reply: [
    "Can we meet tomorrow at 3 PM?",
    "Thanks for the quick turnaround on the project!",
    "Sorry for the delay in following up."
  ],
  enhance: [
    "i want to know if you can finish this by tomorrow let me know",
    "we need to discuss about the budget problem asap"
  ],
  translate: [
    "Hello, it is a pleasure to meet you.",
    "Thank you very much for your kind support."
  ],
  summarize: [
    "The engineering team delivered the Q3 migration to multi-cloud. Customer latency dropped by 45%. System availability remained at 99.99%. Next sprint targets on-device ML caching."
  ]
};

// Mirror of the backend limits so users get instant feedback instead of a 400.
const INPUT_LIMITS = { reply: 2000, enhance: 2000, translate: 2000, summarize: 8000 };

const InputSection = ({ input, setInput, handleSubmit, loading, error, clear, mode }) => {
  let placeholder = "Paste the message you received here... (Ctrl/Cmd + Enter to generate)";
  let buttonText = "Generate Replies";
  let loadingText = "Generating...";

  if (mode === "enhance") {
    placeholder = "Paste your text to enhance here... (Ctrl/Cmd + Enter to enhance)";
    buttonText = "Enhance Text";
    loadingText = "Enhancing...";
  } else if (mode === "translate") {
    placeholder = "Paste text to translate here... (Ctrl/Cmd + Enter to translate)";
    buttonText = "Translate Text";
    loadingText = "Translating...";
  } else if (mode === "summarize") {
    placeholder = "Paste long conversation, email, or meeting notes to summarize... (Ctrl/Cmd + Enter)";
    buttonText = "Summarize Text";
    loadingText = "Summarizing...";
  }

  const maxLength = INPUT_LIMITS[mode] ?? 2000;
  const isOverLimit = input.length > maxLength;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(text.slice(0, maxLength));
    } catch {
      // Clipboard permission denied or unsupported browser — users can still
      // paste manually with the keyboard.
    }
  };

  const samples = SAMPLE_PROMPTS[mode] || SAMPLE_PROMPTS.reply;

  return (
    <div className="p-6">
      {/* Sample prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-1 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Samples:
        </span>
        {samples.map((sample, i) => (
          <button
            key={i}
            onClick={() => setInput(sample)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 whitespace-nowrap transition"
          >
            {sample.length > 38 ? `${sample.slice(0, 38)}...` : sample}
          </button>
        ))}
      </div>

      <div className="relative">
        <TextareaAutoResize
          className="w-full min-h-[120px] max-h-[320px] p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent overflow-hidden transition-all text-sm leading-relaxed"
          placeholder={placeholder}
          value={input}
          maxLength={maxLength + 500}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        <div className="absolute bottom-3 right-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handlePaste}
            className="text-xs text-slate-400 hover:text-indigo-400 transition flex items-center gap-1"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5" /> Paste
          </button>
          <span className={`text-xs ${isOverLimit ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
            {input.length} / {maxLength}
          </span>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-red-400 text-sm"
        >
          {error}
        </motion.p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim() || isOverLimit}
          title={isOverLimit ? `Please shorten your text to ${maxLength} characters` : undefined}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
        >
          {loading ? (
            <>
              <motion.div 
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
        <button
          onClick={clear}
          className="p-3.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-slate-300 transition-all"
          title="Clear input"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InputSection;