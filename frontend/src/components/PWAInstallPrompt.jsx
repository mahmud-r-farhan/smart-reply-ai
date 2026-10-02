import { useState, useEffect } from 'react';
import { X, Download, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isDismissed = () => {
      try {
        return localStorage.getItem('pwa-install-dismissed') === 'true';
      } catch {
        return false; // storage blocked (private mode): keep showing the prompt
      }
    };
    const isStandalone = Boolean(
      window.matchMedia?.('(display-mode: standalone)')?.matches
    );

    // Never nag users who already installed the app (or dismissed the prompt).
    if (isStandalone || isDismissed()) return undefined;

    // Modern iPadOS reports itself as macOS, so also check touch support.
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    let timer;

    if (isIOSDevice) {
      setIsIOS(true);
      timer = setTimeout(() => {
        if (!isDismissed()) setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Handle beforeinstallprompt for other browsers
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isDismissed()) return;

      clearTimeout(timer);
      timer = setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      try {
        localStorage.setItem('pwa-install-dismissed', 'true');
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowPrompt(false);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        try {
          localStorage.setItem('pwa-install-dismissed', 'true');
        } catch {
          /* ignore */
        }
      }
    } catch {
      // The prompt can only be used once; ignore stale-prompt failures.
    } finally {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const persistDismissal = () => {
    try {
      localStorage.setItem('pwa-install-dismissed', 'true');
    } catch {
      /* ignore */
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    persistDismissal();
  };

  const handleIOSInstall = () => {
    setShowPrompt(false);
    persistDismissal();
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40"
            style={{
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
            }}
            onClick={handleDismiss}
          />

          {/* Main prompt card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            {/* Glassmorphism container */}
            <div
              className="rounded-2xl shadow-2xl overflow-hidden border border-white border-opacity-20"
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-transparent to-purple-500 opacity-20 pointer-events-none" />

              <div className="relative p-6">
                {isIOS ? (
                  // iOS Installation Instructions
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        <Download className="w-5 h-5 text-purple-400" />
                        Install App
                      </h3>
                      <motion.button
                        onClick={handleIOSInstall}
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200"
                        aria-label="Close"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-5 h-5 text-gray-300" />
                      </motion.button>
                    </div>
                    <p className="text-sm text-gray-200 mb-4 leading-relaxed">
                      Tap the share button, then select "Add to Home Screen" to install the app.
                    </p>
                    <div
                      className="rounded-xl p-3 text-xs text-gray-100 border border-indigo-400 border-opacity-30"
                      style={{
                        background: 'rgba(34, 211, 238, 0.05)',
                      }}
                    >
                      <p className="font-semibold mb-2 text-purple-300">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-300">
                        <li>Tap the Share button</li>
                        <li>Select "Add to Home Screen"</li>
                        <li>Tap "Add" to confirm</li>
                      </ol>
                    </div>
                  </motion.div>
                ) : (
                  // Standard Web Installation
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Install Smart Reply
                      </h3>
                      <motion.button
                        onClick={handleDismiss}
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200"
                        aria-label="Close"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-5 h-5 text-gray-300" />
                      </motion.button>
                    </div>
                    <p className="text-sm text-gray-200 mb-5 leading-relaxed">
                      Get quick access to Smart Reply right from your home screen or app drawer!
                    </p>

                    {/* Install button */}
                    <motion.button
                      onClick={handleInstall}
                      className="w-full font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg mb-2 transition-all duration-200 relative overflow-hidden group"
    
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent opacity-0 group-hover:opacity-20 transition-opacity cursor-pointer" />
                      <span className="relative text-white font-semibold flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Install Now
                      </span>
                    </motion.button>

                    {/* Later button */}
                    <motion.button
                      onClick={handleDismiss}
                      className="w-full font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-gray-200 border border-gray-400 border-opacity-20 cursor-pointer hover:bg-opacity-5"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Maybe Later
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {/* Animated accent border */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}