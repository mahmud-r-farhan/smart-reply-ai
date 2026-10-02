import { Zap, Cloud } from "lucide-react";

export default function LatencyBadge({ latencyMs, source, model }) {
  const isLocal = source === "heuristic" || source === "on-device";
  const icon = isLocal ? <Zap className="w-3 h-3 text-emerald-400" /> : <Cloud className="w-3 h-3 text-indigo-400" />;
  const label = isLocal
    ? `On-Device ${latencyMs}ms`
    : `Cloud ${latencyMs}ms${model ? ` (${model.split("/").pop()})` : ""}`;
  const badgeClass = isLocal
    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
    : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
