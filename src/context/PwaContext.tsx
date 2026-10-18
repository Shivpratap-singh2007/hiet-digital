// =============================================================================
// HIET DIGITAL CAMPUS — PWA INSTALLATION CONTEXT & HOOK
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Handles Service Worker registration, BeforeInstallPrompt & iOS Add-to-Home-Screen
// =============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isBannerDismissed: boolean;
  showIosModal: boolean;
  setShowIosModal: (show: boolean) => void;
  installApp: () => Promise<boolean>;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

const DISMISSED_KEY = 'hiet_pwa_banner_dismissed_until';

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // 1. Detect Standalone / Already Installed status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsInstalled(Boolean(isStandalone));
    };

    checkInstalled();
    const media = window.matchMedia('(display-mode: standalone)');
    media.addEventListener('change', checkInstalled);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIos(isIosDevice);

    // Check if user dismissed banner recently (within 7 days)
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsBannerDismissed(true);
    }

    return () => media.removeEventListener('change', checkInstalled);
  }, []);

  // 2. Register Service Worker on boot
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[HIET PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[HIET PWA] Service Worker registration failed:', err);
        });
    });
  }, []);

  // 3. Listen to beforeinstallprompt event (Chromium, Android, Edge)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('[HIET PWA] App install prompt captured and ready');
    };

    const handleAppInstalled = () => {
      console.log('[HIET PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 4. Trigger Install Action
  const installApp = useCallback(async (): Promise<boolean> => {
    if (isIos) {
      setShowIosModal(true);
      return false;
    }

    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        console.log('[HIET PWA] User accepted installation prompt');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[HIET PWA] User dismissed installation prompt');
        return false;
      }
    } catch (err) {
      console.warn('[HIET PWA] Error triggering install prompt:', err);
      return false;
    }
  }, [deferredPrompt, isIos]);

  // 5. Dismiss Banner for 7 days
  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(expireTime));
  }, []);

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIos,
        isBannerDismissed,
        showIosModal,
        setShowIosModal,
        installApp,
        dismissBanner
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = (): PwaContextType => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};
