import { motion } from "framer-motion";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useChatStore } from "./store/useChatStore";
import Header from "./components/Header.jsx";
import EngineModeSelector from "./components/EngineModeSelector.jsx";
import ProviderModal from "./components/ProviderModal.jsx";
import ModeSelector from "./components/ModeSelector.jsx";
import StyleSelector from "./components/StyleSelector.jsx";
import LanguageSelector from "./components/LanguageSelector.jsx";
import InputSection from "./components/InputSection.jsx";
import ResultsSection from "./components/ResultsSection.jsx";
import EmptyState from "./components/EmptyState.jsx";
import Footer from "./components/Footer.jsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.jsx";

export default function App() {
  const {
    input,
    results,
    loading,
    style,
    mode,
    language,
    error,
    latencyMs,
    source,
    model,
    engineMode,
    providerConfig,
    setInput,
    setStyle,
    setMode,
    setLanguage,
    setEngineMode,
    setProviderConfig,
    getResults,
    clear,
    cancelRequest
  } = useChatStore();

  const [copiedIndex, setCopiedIndex] = useState(null);
  const copyResetTimer = useRef(null);
  const [showStyleInfo, setShowStyleInfo] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

  // Abort any in-flight generation (and pending timers) when the app unmounts.
  useEffect(
    () => () => {
      cancelRequest();
      clearTimeout(copyResetTimer.current);
    },
    [cancelRequest]
  );

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;
    await getResults();
  }, [input, getResults]);

  // "Regenerate" re-runs the same prompt but asks the backend to skip its
  // cache read, so the user actually gets a fresh answer.
  const handleRegenerate = useCallback(async () => {
    if (!input.trim()) return;
    await getResults({ refresh: true });
  }, [input, getResults]);

  const handleCopy = useCallback(async (text, index) => {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }

    // Fallback for insecure origins / older WebViews without the async API.
    if (!copied) {
      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        copied = document.execCommand("copy");
        document.body.removeChild(area);
      } catch {
        copied = false;
      }
    }

    if (!copied) return;
    setCopiedIndex(index);
    clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Memoize background animation to prevent re-renders
  const backgroundAnimation = useMemo(
    () => (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 2.5 }}
        />
      </div>
    ),
    []
  );

  const shouldShowLanguageSelector = useMemo(
    () => mode === "translate",
    [mode]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 md:p-8">
      {backgroundAnimation}
      <PWAInstallPrompt />

      <ProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        currentConfig={providerConfig}
        onSave={(newConfig) => setProviderConfig(newConfig)}
      />

      <div className="relative max-w-5xl mx-auto">
        <Header />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Engine Mode selector: Hybrid Race, On-Device, Cloud */}
          <EngineModeSelector
            activeMode={engineMode}
            onModeChange={setEngineMode}
            onOpenSettings={() => setIsProviderModalOpen(true)}
          />

          {/* Mode Selector: Reply, Enhance, Translate, Summarize */}
          <ModeSelector mode={mode} setMode={setMode} />

          {/* Style / Tone Selector */}
          <StyleSelector 
            style={style} 
            setStyle={setStyle} 
            showStyleInfo={showStyleInfo} 
            setShowStyleInfo={setShowStyleInfo} 
          />

          {/* Language Selector for translation */}
          {shouldShowLanguageSelector && (
            <LanguageSelector 
              language={language} 
              setLanguage={setLanguage} 
            />
          )}

          {/* Input Area */}
          <InputSection 
            input={input} 
            setInput={setInput} 
            handleSubmit={handleSubmit} 
            loading={loading} 
            error={error} 
            clear={clear} 
            mode={mode}
          />

          {/* Results Area with Latency Badge */}
          <ResultsSection 
            results={results} 
            loading={loading} 
            handleRegenerate={handleRegenerate} 
            copiedIndex={copiedIndex} 
            handleCopy={handleCopy} 
            mode={mode}
            latencyMs={latencyMs}
            source={source}
            model={model}
          />

          <EmptyState loading={loading} results={results} input={input} />
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}