'use server';

import { z } from 'zod';
import { InscriptionService } from '../../services/inscription.service';
import {
  inscriptionLicenceSchema,
  InscriptionLicenceInput,
  InscriptionLicenceResponse,
} from '../../lib/validators/inscription.schema';

/**
 * Type pour les résultats d'actions Next.js
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server Action: Créer une inscription de licence
 *
 * @param input - Données de l'inscription validées par Zod
 * @returns Résultat avec numeroLicence ou erreur
 *
 * Sécurité:
 * - Validation Zod stricte
 * - Transactions Prisma atomiques
 * - Retourne uniquement numeroLicence (pas de données sensibles)
 * - Rate limiting recommandé au niveau middleware
 */
export async function creerInscriptionAction(
  input: InscriptionLicenceInput
): Promise<ActionResult<InscriptionLicenceResponse>> {
  try {
    // 1. Validation Zod
    const validatedData = inscriptionLicenceSchema.parse(input);

    // 2. Appeler le service métier
    const result = await InscriptionService.creerInscription(validatedData);

    // 3. Retourner le numéro de licence et message de succès
    const message = result.numeroLicence
      ? `Inscription réussie ! Votre numéro de licence est ${result.numeroLicence}. Conservez précieusement ce numéro pour suivre votre demande.`
      : `Inscription réussie ! Votre demande est en attente de validation par un administrateur.`;

    return {
      success: true,
      data: {
        success: true,
        message,
        numeroLicence: result.numeroLicence,
      },
    };
  } catch (error) {
    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};

      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      });

      return {
        success: false,
        error: 'Erreur de validation des données',
        fieldErrors,
      };
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Erreur inconnue
    console.error('[INSCRIPTION_ACTION_ERROR]', error);
    return {
      success: false,
      error: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    };
  }
}

