import { z } from 'zod';
import { TypeLicence, LienResponsable } from '../../../generated/prisma/client';

/**
 * Schema de validation pour l'inscription d'une licence
 * Retourne uniquement numeroLicence et message de succès pour la sécurité
 */

/**
 * Validation du format téléphone : +225 suivi de 10 chiffres
 * Format attendu : +225XXXXXXXXXX (ex: +2250123456789)
 */
const telephoneSchema = z
  .string()
  .min(1, 'Le téléphone est requis')
  .refine(
    (val) => {
      // Vérifier le format exact : +225 suivi de 10 chiffres
      const phoneRegex = /^\+225\d{10}$/;
      return phoneRegex.test(val);
    },
    {
      message: 'Le téléphone doit être au format +225 suivi de 10 chiffres (ex: +2250123456789)',
    }
  );

// Sous-schema pour le joueur
const joueurInscriptionSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(100),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: telephoneSchema,
  dateNaissance: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, 'Date de naissance invalide'),
  lieuNaissance: z.string().min(1, 'Le lieu de naissance est requis'),
  nationalite: z.string().min(2, 'La nationalité est requise (minimum 2 caractères)'),
  sexe: z.enum(['M', 'F', 'Autre'], {
    errorMap: () => ({ message: 'Le sexe est requis (M, F ou Autre)' }),
  }),
  photo: z.string()
    .refine((val) => !val || val === '' || val.startsWith('data:image/') || val.startsWith('http'), {
      message: 'La photo doit être une image en base64 (data:image/...) ou une URL valide',
    })
    .optional()
    .or(z.literal('')),
  signature: z.string()
    .refine((val) => !val || val === '' || val.startsWith('data:image/') || val.startsWith('http'), {
      message: 'La signature doit être une image en base64 (data:image/...) ou une URL valide',
    })
    .optional()
    .or(z.literal('')),
  pieceIdentite: z.string()
    .refine((val) => !val || val === '' || val.startsWith('data:image/') || val.startsWith('http'), {
      message: 'La pièce d\'identité doit être une image en base64 (data:image/...) ou une URL valide',
    })
    .optional()
    .or(z.literal('')),
  certificatMedical: z.string()
    .refine((val) => !val || val === '' || val.startsWith('data:image/') || val.startsWith('http'), {
      message: 'Le certificat médical doit être une image en base64 (data:image/...) ou une URL valide',
    })
    .optional()
    .or(z.literal('')),
});

// Sous-schema pour les responsables
const responsableInscriptionSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(100),
  telephone: telephoneSchema,
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  lien: z.nativeEnum(LienResponsable),
});

// Schema principal d'inscription
export const inscriptionLicenceSchema = z.object({
  // Type de licence
  type: z.nativeEnum(TypeLicence, {
    errorMap: () => ({ message: 'Type de licence invalide (NOUVEAU ou RENOUVELLEMENT)' }),
  }),

  // Saison obligatoire
  saisonId: z.string().uuid('ID de saison invalide'),

  // Données du joueur
  joueur: joueurInscriptionSchema,

  // Responsables (obligatoire pour les mineurs)
  responsables: z.array(responsableInscriptionSchema)
    .min(1, 'Au moins un responsable est requis')
    .max(3, 'Maximum 3 responsables')
    .optional(),

  // Numéro de licence précédent (obligatoire si RENOUVELLEMENT)
  numeroLicencePrecedent: z.string().regex(/^FIK-\d{4}-\d{6}$/, {
    message: 'Le numéro de licence doit être au format FIK-YYYY-XXXXXX',
  }).optional(),

  // Club précédent (optionnel, peut être déduit de la licence précédente)
  clubPrecedentId: z.string().uuid('ID de club précédent invalide').optional(),

  // Club actuel (recommandé mais optionnel)
  clubActuelId: z.string().uuid('ID de club actuel invalide').optional(),
})
  // Validation croisée : RENOUVELLEMENT nécessite numeroLicencePrecedent
  .refine(
    (data) => {
      if (data.type === TypeLicence.RENOUVELLEMENT) {
        return !!data.numeroLicencePrecedent;
      }
      return true;
    },
    {
      message: 'Le numéro de licence de votre licence précédente est obligatoire pour un renouvellement',
      path: ['numeroLicencePrecedent'],
    }
  )
  // Validation : Mineur (< 18 ans) nécessite des responsables
  .refine(
    (data) => {
      const dateNaissance = new Date(data.joueur.dateNaissance);
      const age = Math.floor((Date.now() - dateNaissance.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      if (age < 18) {
        return data.responsables && data.responsables.length > 0;
      }
      return true;
    },
    {
      message: 'Au moins un responsable est requis pour les joueurs mineurs (< 18 ans)',
      path: ['responsables'],
    }
  )
  // Validation : Pièce d'identité obligatoire pour NOUVEAU
  .refine(
    (data) => {
      if (data.type === TypeLicence.NOUVEAU) {
        return !!data.joueur.pieceIdentite && data.joueur.pieceIdentite.trim() !== '';
      }
      return true;
    },
    {
      message: 'La pièce d\'identité est obligatoire pour une nouvelle licence',
      path: ['joueur', 'pieceIdentite'],
    }
  )
  // Validation : Certificat médical obligatoire pour NOUVEAU
  .refine(
    (data) => {
      if (data.type === TypeLicence.NOUVEAU) {
        return !!data.joueur.certificatMedical && data.joueur.certificatMedical.trim() !== '';
      }
      return true;
    },
    {
      message: 'Le certificat médical est obligatoire pour une nouvelle licence',
      path: ['joueur', 'certificatMedical'],
    }
  );

// Type inféré pour TypeScript
export type InscriptionLicenceInput = z.infer<typeof inscriptionLicenceSchema>;

// Schema de réponse (pour documentation uniquement)
export type InscriptionLicenceResponse = {
  success: true;
  message: string;
  numeroLicence: string | null;
};
