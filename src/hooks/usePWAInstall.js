import { useState, useEffect } from 'react';

// Attach global event listener as early as possible to capture the beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    window.deferredPrompt = e;
    // Dispatch a custom event to notify hooks that the prompt is ready
    window.dispatchEvent(new CustomEvent('hk-pwa-prompt-available'));
  });
}

export default function usePWAInstall() {
  const [installable, setInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Detect if the app is already running in standalone mode (installed)
    const checkInstalledState = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = window.navigator.standalone === true; // iOS Safari fallback
      const installed = isStandalone || isNavigatorStandalone;
      setIsInstalled(installed);
      return installed;
    };

    // 2. Evaluate if the installation prompt should be shown
    const evaluatePrompt = () => {
      const installed = checkInstalledState();
      if (installed) {
        setInstallable(false);
        setDeferredPrompt(null);
        setShowPrompt(false);
        return;
      }

      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
        setInstallable(true);

        // Check if the user dismissed it in the last 24 hours
        const lastDismissed = localStorage.getItem('hk_pwa_dismissed_at');
        if (lastDismissed) {
          const parsedTime = parseInt(lastDismissed, 10);
          const hoursPassed = (Date.now() - parsedTime) / (1000 * 60 * 60);
          if (hoursPassed < 24) {
            setShowPrompt(false);
            return;
          }
        }
        setShowPrompt(true);
      } else {
        setInstallable(false);
        setShowPrompt(false);
      }
    };

    evaluatePrompt();

    // Listeners for prompt events
    const handlePromptAvailable = () => {
      evaluatePrompt();
    };

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      setInstallable(true);
      
      // Re-evaluate showing prompt
      const lastDismissed = localStorage.getItem('hk_pwa_dismissed_at');
      if (lastDismissed) {
        const parsedTime = parseInt(lastDismissed, 10);
        const hoursPassed = (Date.now() - parsedTime) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          setShowPrompt(false);
          return;
        }
      }
      setShowPrompt(true);
    };

    window.addEventListener('hk-pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Watch for dynamic display-mode changes (e.g. if installed during session)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      setIsInstalled(e.matches);
      if (e.matches) {
        setInstallable(false);
        setShowPrompt(false);
      }
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('hk-pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const triggerInstall = async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt;
    if (!promptEvent) {
      console.warn('Install prompt not available');
      return { success: false, outcome: 'dismissed' };
    }

    // Show the native browser install prompt
    promptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      // Clear the deferred prompt
      window.deferredPrompt = null;
      setDeferredPrompt(null);
      setInstallable(false);
      setIsInstalled(true);
      setShowPrompt(false);
      return { success: true, outcome };
    }

    return { success: false, outcome };
  };

  const dismissPrompt = () => {
    localStorage.setItem('hk_pwa_dismissed_at', Date.now().toString());
    setShowPrompt(false);
  };

  return {
    installable,
    isInstalled,
    showPrompt,
    triggerInstall,
    dismissPrompt
  };
}
