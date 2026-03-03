'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FormData } from '../types';

const STORAGE_KEY = 'arbitre_form_data';

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
      try {
        const serialized = JSON.stringify(formData);
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (error) {
        // Gérer les erreurs de quota (QuotaExceededError)
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('Quota localStorage dépassé. Tentative de nettoyage...');
          
          // Essayer de sauvegarder sans les images pour libérer de l'espace
          const formDataWithoutImages = {
            ...formData,
            arbitre: {
              ...formData.arbitre,
              photo: '',
              signature: '',
              pieceIdentite: '',
              certificatMedical: '',
            },
          };
          
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formDataWithoutImages));
            console.warn('Données sauvegardées sans images pour libérer de l\'espace');
          } catch (retryError) {
            console.error('Impossible de sauvegarder même sans images:', retryError);
            // En dernier recours, supprimer toutes les données du formulaire
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          console.error('Erreur lors de la sauvegarde dans localStorage:', error);
        }
      }
    }
  }, [formData, isHydrated]);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => {
      const newData = { ...prev };
      
      // Gérer les mises à jour imbriquées
      if (updates.arbitre) {
        newData.arbitre = { ...prev.arbitre, ...updates.arbitre };
      }
      
      // Mettre à jour les autres champs
      Object.keys(updates).forEach((key) => {
        if (key !== 'arbitre') {
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
    arbitre: {
      nom: '',
      prenom: '',
      dateNaissance: '',
      sexe: '',
      nationalite: 'Ivoirienne',
      numeroPieceIdentite: '',
      telephone: '',
      email: '',
      adresse: '',
      niveauArbitre: '',
      dateCertification: '',
      numeroCertificat: '',
      autoriteCertificatrice: '',
      zoneAffectation: '',
      certificatMedicalValide: '',
      dateExpirationCertificatMedical: '',
      assuranceActive: '',
      photo: '',
      signature: '',
      pieceIdentite: '',
      certificatMedical: '',
    },
    numeroLicencePrecedent: '',
  };
}

