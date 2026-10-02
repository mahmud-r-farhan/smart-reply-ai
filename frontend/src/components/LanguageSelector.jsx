import { motion } from "framer-motion";
import { Globe } from "lucide-react";

const LanguageSelector = ({ language, setLanguage }) => {
  const languages = [
    { value: "english", label: "English", icon: "🇺🇸", description: "Translate to English" },
    { value: "spanish", label: "Spanish", icon: "🇪🇸", description: "Translate to Spanish" },
    { value: "french", label: "French", icon: "🇫🇷", description: "Translate to French" },
    { value: "german", label: "German", icon: "🇩🇪", description: "Translate to German" },
    { value: "chinese", label: "Chinese", icon: "🇨🇳", description: "Translate to Chinese" },
    { value: "arabic", label: "Arabic", icon: "🇸🇦", description: "Translate to Arabic" },
    { value: "bengali", label: "বাংলা", icon: "🇧🇩", description: "Translate to বাংলা" },
    // Add more based on LLM support (e.g., OpenRouter free models like Qwen2 support these)
  ];

  return (
    <div className="p-6 border-b border-slate-800 bg-slate-900/30 relative">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-indigo-400" />
        <span className="text-sm font-semibold text-slate-300">Target Language</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {languages.map((l) => (
          <motion.button
            key={l.value}
            onClick={() => setLanguage(l.value)}
            className={`p-3 rounded-xl font-medium transition-all relative ${
              language === l.value
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl mb-1 block">{l.icon}</span>
            <span className="text-sm">{l.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;