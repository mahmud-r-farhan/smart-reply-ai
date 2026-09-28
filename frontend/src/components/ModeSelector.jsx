import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Edit, Languages, FileText } from "lucide-react";

const ModeSelector = memo(({ mode, setMode }) => {
  const modes = useMemo(
    () => [
      { value: "reply", label: "Smart Reply", icon: MessageSquare, description: "Generate replies to received messages" },
      { value: "enhance", label: "Smart Enhance", icon: Edit, description: "Improve your own text like Grammarly" },
      { value: "translate", label: "Smart Translate", icon: Languages, description: "Translate text with style" },
      { value: "summarize", label: "Smart Summarize", icon: FileText, description: "Condense long text and emails" },
    ],
    []
  );

  return (
    <div className="p-6 border-b border-slate-800 bg-slate-900/50">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {modes.map((m) => (
          <motion.button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`p-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              mode === m.value
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <m.icon className="w-5 h-5" />
            <span>{m.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
});

ModeSelector.displayName = 'ModeSelector';
export default ModeSelector;