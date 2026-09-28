import { useState, memo } from "react";
import { motion } from "framer-motion";
import { Settings, Info } from "lucide-react";
import SidePanel from "./SidePanel";

const Header = memo(({ onOpenProviderSettings }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-3 mb-3">
          <motion.button
            onClick={() => setIsOpen(true)}
            whileHover={{ rotate: 360, scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="
              p-2.5 rounded-2xl cursor-help
              bg-white/10
              backdrop-blur-xl
              border border-white/20
              shadow-lg shadow-indigo-500/20
              hover:shadow-indigo-500/40
              relative overflow-hidden
            "
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent opacity-50 pointer-events-none" />
            <img
              src="https://i.postimg.cc/HkhmHFxy/icons8-chatbot-48.png"
              alt="Logo"
              title="About Project"
              className="relative z-10 w-8 h-8"
            />
          </motion.button>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent tracking-tight">
            Smart Reply AI
          </h1>
        </div>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Zero-latency on-device heuristics & Universal OpenAI-compatible cloud orchestrator.
          <span className="block mt-1 text-xs text-slate-500">
            Powered by Google ML Kit directives, Groq LPU, OpenRouter, and local Ollama.
          </span>
        </p>
      </motion.div>

      {/* Side Panel */}
      <SidePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
});

Header.displayName = "Header";
export default Header;