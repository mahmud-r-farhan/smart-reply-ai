import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Key, Cpu, Sparkles, Check, ExternalLink } from "lucide-react";
import { PROVIDER_PRESETS } from "../utils/universalCloudEngine";

export default function ProviderModal({ isOpen, onClose, currentConfig, onSave }) {
  const [baseURL, setBaseURL] = useState(currentConfig?.baseURL || PROVIDER_PRESETS[0].baseURL);
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || "");
  const [model, setModel] = useState(currentConfig?.model || PROVIDER_PRESETS[0].model);
  const [temperature, setTemperature] = useState(currentConfig?.temperature ?? 0.7);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setBaseURL(preset.baseURL);
    setModel(preset.model);
  };

  const handleSave = () => {
    onSave({
      id: "custom",
      baseURL: baseURL.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      temperature
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cloud AI Provider</h3>
                <p className="text-xs text-slate-400">Zero-data-egress & BYOK (Bring Your Own Key)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDER_PRESETS.map((p) => {
                  const isSelected = baseURL === p.baseURL;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-2.5 text-left rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{p.name.split(" (")[0]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                OpenAI-Compatible Base URL
              </label>
              <input
                type="text"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://api.groq.com/openai/v1"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
              />
            </div>

            {/* Model ID */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Model Identifier
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="llama-3.1-8b-instant"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
              />
            </div>

            {/* API Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> API Key (Stored only in your browser)
                </label>
                <span className="text-[10px] text-slate-500">Optional for Ollama</span>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste API Key here..."
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 font-mono"
              />
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Temperature (Creativity)</span>
                <span className="font-semibold text-indigo-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition"
            >
              Save Configuration
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
