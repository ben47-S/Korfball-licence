import { z } from 'zod';
import { TypeLicence } from '../../../generated/prisma/client';


// ===============================
// Création licence
// ===============================
export const creerLicenceSchema = z.object({
  type: z.nativeEnum(TypeLicence),

  saisonId: z.uuid(),

  joueur: z.object({
    nom: z.string().min(2),
    prenom: z.string().min(2),
    dateNaissance: z.string(),
    lieuNaissance: z.string().optional(),
    nationalite: z.string().optional(),
    sexe: z.string().optional(),
    photo: z.string().optional(),
    signature: z.string().optional(),
  }),

  responsables: z.array(
    z.object({
      nom: z.string(),
      prenom: z.string(),
      lien: z.enum(["PERE", "MERE", "TUTEUR"]),
    })
  ).optional(),

  clubPrecedentId: z.string().uuid().optional(),
  clubActuelId: z.string().uuid().optional(),
});

// ===============================
// Soumission
// ===============================
export const soumettreLicenceSchema = z.object({
  licenceId: z.string().uuid(),
});

// ===============================
// Validation ADMIN
// ===============================
export const validerLicenceSchema = z.object({
  licenceId: z.string().uuid(),
  // Le numéro de licence n'est plus nécessaire ici car il est assigné lors de la création
});

// ===============================
// Rejet ADMIN
// ===============================
export const rejeterLicenceSchema = z.object({
  licenceId: z.string().uuid(),
  commentaireAdmin: z.string().min(3),
});
