'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.warn('[RECAPTCHA] Site key not configured');
      setIsLoaded(true); // Considéré comme chargé en dev
      return;
    }

    // Vérifier si le script est déjà chargé
    if (window.grecaptcha) {
      setIsLoaded(true);
      return;
    }

    // Charger le script reCAPTCHA
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha.ready(() => {
        setIsLoaded(true);
      });
    };

    script.onerror = () => {
      console.error('[RECAPTCHA] Failed to load script');
      setIsLoaded(true); // Permettre de continuer même si le chargement échoue
    };

    document.body.appendChild(script);

    return () => {
      // Nettoyer le script si le composant est démonté
      document.body.removeChild(script);
    };
  }, [siteKey]);

  const executeRecaptcha = async (action: string = 'inscription'): Promise<string | null> => {
    if (!siteKey) {
      console.warn('[RECAPTCHA] Site key not configured - bypassing');
      return null;
    }

    if (!isLoaded) {
      console.warn('[RECAPTCHA] Not loaded yet');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('[RECAPTCHA] Error executing:', error);
      return null;
    }
  };

  return {
    isLoaded,
    executeRecaptcha,
  };
}
