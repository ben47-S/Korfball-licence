import { NextResponse } from 'next/server';
import { InscriptionService } from '../../../../services/inscription.service';
import { inscriptionLicenceSchema } from '../../../../lib/validators/inscription.schema';
import { handleApiError } from '../../../../lib/http';
import { verifyCaptcha, CAPTCHA_SCORES } from '../../../../lib/captcha';
import { z } from 'zod';

/**
 * PUT /api/inscriptions/update
 * Modifier une licence existante (REJETEE → EN_CORRECTION)
 */
export async function PUT(req: Request) {
  try {
    // 1. Vérifier le CAPTCHA
    const captchaToken = req.headers.get('x-recaptcha-token');
    const shouldCheckCaptcha = process.env.NODE_ENV === 'production' || process.env.RECAPTCHA_SECRET_KEY;

    if (shouldCheckCaptcha) {
      if (!captchaToken) {
        return NextResponse.json(
          { message: 'Token CAPTCHA manquant' },
          { status: 400 }
        );
      }

      const captchaResult = await verifyCaptcha(captchaToken, 'inscription_update', CAPTCHA_SCORES.NORMAL);

      if (!captchaResult.success) {
        return NextResponse.json(
          { message: captchaResult.error || 'Vérification CAPTCHA échouée' },
          { status: 403 }
        );
      }
    }

    // 2. Parser les données
    const body = await req.json();

    // Valider que licenceId est présent
    const updateSchema = inscriptionLicenceSchema.extend({
      licenceId: z.string().uuid('ID de licence invalide'),
    });

    const validatedData = updateSchema.parse(body);

    // 3. Mettre à jour l'inscription via le service
    const result = await InscriptionService.modifierInscription(
      validatedData.licenceId,
      validatedData
    );

    // 4. Retourner le résultat
    const message = `Votre demande a été modifiée et resoumise avec succès ! Votre numéro de licence est ${result.numeroLicence}. Elle est maintenant en cours de traitement.`;

    return NextResponse.json(
      {
        success: true,
        message,
        numeroLicence: result.numeroLicence,
        statut: 'EN_CORRECTION',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
