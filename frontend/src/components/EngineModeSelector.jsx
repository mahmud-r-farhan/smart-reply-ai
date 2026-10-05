import { Zap, ShieldCheck, Cloud, Settings2 } from "lucide-react";

const MODES = [
  { id: "hybrid-race", label: "Hybrid Race", icon: Zap, tip: "Zero-latency on-device raced with cloud" },
  { id: "offline-only", label: "On-Device", icon: ShieldCheck, tip: "100% private, 0ms, zero data egress" },
  { id: "cloud-only", label: "Cloud LLM", icon: Cloud, tip: "Deep reasoning via Groq/OpenRouter/Ollama" }
];

export default function EngineModeSelector({ activeMode, onModeChange, onOpenSettings }) {
  return (
    <div className="px-6 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Engine:
        </span>
        <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
          {MODES.map((m) => {
            const isSelected = activeMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                title={m.tip}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onOpenSettings}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition"
      >
        <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
        <span>Configure AI Model</span>
      </button>
    </div>
  );
}
