'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import PageLoader from '@/components/ui/PageLoader';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  // Mémoriser setLoading pour éviter les re-renders inutiles
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Désactiver le chargement après un court délai si aucune page ne le gère
  // Cela évite que le loader reste affiché sur les pages statiques
  useEffect(() => {
    const timer = setTimeout(() => {
      // Si le chargement est toujours actif après 500ms et qu'aucune page
      // n'a appelé setLoading, on le désactive
      setIsLoading((prev) => {
        // Si toujours à true, c'est qu'aucune page n'a géré le chargement
        return false;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
      {isLoading && <PageLoader />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    // Retourner une valeur par défaut pour éviter les erreurs
    // Cela peut arriver lors du SSR ou si le provider n'est pas encore monté
    console.warn('useLoading is being used outside of LoadingProvider. Returning default values.');
    return {
      isLoading: false,
      setLoading: () => {
        // No-op function pour éviter les erreurs
      },
    };
  }
  return context;
}

