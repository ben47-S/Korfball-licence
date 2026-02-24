import { z } from 'zod';

/**
 * Schema réutilisable pour valider les UUID
 * Utilisé pour les IDs de saison, club, licence, etc.
 */
export const uuidSchema = z.string().uuid({
  message: 'Format UUID invalide',
});

/**
 * Helper pour valider un UUID depuis une string (ex: query param)
 * Retourne l'UUID validé ou lance une ZodError avec message personnalisé
 */
export function validateUuid(value: string | null, fieldName: string = 'UUID'): string {
  // Créer un schema dynamique avec message personnalisé
  const schema = z.string().uuid({
    message: `${fieldName} invalide`,
  });
  
  return schema.parse(value);
}

