import { z } from 'zod';
import { TypeLicence } from '../../../generated/prisma/client';

/**
 * Schema de validation pour l'inscription d'un arbitre
 * Les arbitres utilisent la même table Joueur mais avec une validation adaptée
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

// Sous-schema pour l'arbitre
const arbitreInscriptionSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(100),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: telephoneSchema,
  dateNaissance: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, 'Date de naissance invalide'),
  nationalite: z.string().min(2, 'La nationalité est requise (minimum 2 caractères)'),
  sexe: z.string().refine(
    (val) => val === 'M' || val === 'F' || val === 'Autre',
    { message: 'Le sexe est requis (M, F ou Autre)' }
  ),
  numeroPieceIdentite: z.string().min(1, 'Le numéro de pièce d\'identité est requis'),

  // Documents (optionnels pour arbitres)
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

  // Champs spécifiques arbitres (non stockés pour l'instant, car pas dans le schéma Joueur)
  adresse: z.string().optional().or(z.literal('')),
  niveauArbitre: z.string().optional().or(z.literal('')),
  dateCertification: z.string().optional().or(z.literal('')),
  numeroCertificat: z.string().optional().or(z.literal('')),
  autoriteCertificatrice: z.string().optional().or(z.literal('')),
  zoneAffectation: z.string().optional().or(z.literal('')),
  certificatMedicalValide: z.string().optional().or(z.literal('')),
  dateExpirationCertificatMedical: z.string().optional().or(z.literal('')),
  assuranceActive: z.string().optional().or(z.literal('')),
});

// Schema principal d'inscription arbitre
export const inscriptionArbitreSchema = z.object({
  // Type de licence
  type: z.nativeEnum(TypeLicence),

  // Saison obligatoire
  saisonId: z.string().uuid('ID de saison invalide'),

  // Données de l'arbitre
  arbitre: arbitreInscriptionSchema,

  // Numéro de licence précédent (obligatoire si RENOUVELLEMENT)
  numeroLicencePrecedent: z.string().regex(/^FIK-\d{4}-\d{6}$/, {
    message: 'Le numéro de licence doit être au format FIK-YYYY-XXXXXX',
  }).optional(),

  // Club précédent et actuel (optionnels pour arbitres)
  clubPrecedentId: z.string().uuid('ID de club précédent invalide').optional(),
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
  // Validation : Pièce d'identité obligatoire pour NOUVEAU
  .refine(
    (data) => {
      if (data.type === TypeLicence.NOUVEAU) {
        return !!data.arbitre.pieceIdentite && data.arbitre.pieceIdentite.trim() !== '';
      }
      return true;
    },
    {
      message: 'La pièce d\'identité est obligatoire pour une nouvelle licence',
      path: ['arbitre', 'pieceIdentite'],
    }
  )
  // Validation : Certificat médical obligatoire pour NOUVEAU
  .refine(
    (data) => {
      if (data.type === TypeLicence.NOUVEAU) {
        return !!data.arbitre.certificatMedical && data.arbitre.certificatMedical.trim() !== '';
      }
      return true;
    },
    {
      message: 'Le certificat médical est obligatoire pour une nouvelle licence',
      path: ['arbitre', 'certificatMedical'],
    }
  );

// Type inféré pour TypeScript
export type InscriptionArbitreInput = z.infer<typeof inscriptionArbitreSchema>;

// Schema de réponse (pour documentation uniquement)
export type InscriptionArbitreResponse = {
  success: true;
  message: string;
  numeroLicence: string | null;
};
