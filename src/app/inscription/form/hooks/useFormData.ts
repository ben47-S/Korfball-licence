'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FormData } from '../types';

const STORAGE_KEY = 'inscription_form_data';

export function useFormData() {
  // Toujours initialiser avec les valeurs par défaut pour éviter les erreurs d'hydratation
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [isHydrated, setIsHydrated] = useState(false);

  // Charger les données de localStorage après l'hydratation
  useEffect(() => {
    setIsHydrated(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFormData(parsed);
      } catch {
        // En cas d'erreur, garder les valeurs par défaut
      }
    }
  }, []);

  // Sauvegarder dans localStorage après l'hydratation
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isHydrated]);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => {
      const newData = { ...prev };
      
      // Gérer les mises à jour imbriquées
      if (updates.joueur) {
        newData.joueur = { ...prev.joueur, ...updates.joueur };
      }
      if (updates.responsables !== undefined) {
        newData.responsables = updates.responsables;
      }
      
      // Mettre à jour les autres champs
      Object.keys(updates).forEach((key) => {
        if (key !== 'joueur' && key !== 'responsables') {
          (newData as any)[key] = (updates as any)[key];
        }
      });
      
      return newData;
    });
  }, []);

  const clearFormData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(getDefaultFormData());
  }, []);

  return {
    formData,
    setFormData,
    updateFormData,
    clearFormData,
    isHydrated,
  };
}

function getDefaultFormData(): FormData {
  return {
    type: '',
    saisonId: '',
    joueur: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      dateNaissance: '',
      lieuNaissance: '',
      nationalite: 'Ivoirienne',
      sexe: '',
      photo: '',
      signature: '',
      pieceIdentite: '',
      certificatMedical: '',
    },
    responsables: [],
    numeroLicencePrecedent: '',
    clubPrecedentId: '',
    clubActuelId: '',
  };
}

