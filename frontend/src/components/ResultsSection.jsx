import { motion } from "framer-motion";
import { RotateCcw, Copy, Check } from "lucide-react";
import LatencyBadge from "./LatencyBadge";

const ResultsSection = ({
  results,
  loading,
  handleRegenerate,
  copiedIndex,
  handleCopy,
  mode,
  latencyMs,
  source,
  model
}) => {
  if (results.length === 0) return null;

  let title = "AI-Generated Responses";
  let regenerateTitle = "Regenerate with same settings";

  if (mode === "enhance") {
    title = "AI-Enhanced Versions";
    regenerateTitle = "Re-enhance with same settings";
  } else if (mode === "translate") {
    title = "AI-Translated Versions";
    regenerateTitle = "Re-translate with same settings";
  } else if (mode === "summarize") {
    title = "AI Summaries & Takeaways";
    regenerateTitle = "Re-summarize with same settings";
  }

  return (
    <div className="p-6 pt-0">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <motion.div 
          className="w-2 h-2 bg-emerald-400 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <h2 className="text-lg font-semibold text-slate-200">
          {title}
        </h2>

        {latencyMs > 0 && (
          <div className="ml-2">
            <LatencyBadge latencyMs={latencyMs} source={source} model={model} />
          </div>
        )}

        <span className="text-xs text-slate-500 ml-auto">
          {results.length} suggestions
        </span>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="ml-3 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
          title={regenerateTitle}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Regenerate</span>
        </button>
      </div>
      
      <motion.div 
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
      >
        {results.map((item, index) => {
          const text = typeof item === "string" ? item : (item?.text || JSON.stringify(item));
          return (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              className="group relative p-4 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer"
              onClick={() => handleCopy(text, index)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold mt-0.5">
                  {index + 1}
                </div>
                <p className="flex-1 text-slate-200 leading-relaxed pr-12 text-sm whitespace-pre-line">
                  {text}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(text, index);
                  }}
                  className="absolute top-4 right-4 p-2 bg-slate-700/60 text-slate-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-all opacity-80 group-hover:opacity-100 focus:opacity-100"
                  title="Copy to clipboard"
                  aria-label="Copy item"
                >
                  {copiedIndex === index ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <Check className="w-4 h-4" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default ResultsSection;