import { NextResponse } from 'next/server';
import { ArbitreService } from '../../../../services/arbitre.service';
import { inscriptionArbitreSchema } from '../../../../lib/validators/arbitre.schema';
import { handleApiError } from '../../../../lib/http';
import { checkInscriptionRateLimit, formatResetTime } from '../../../../lib/rate-limiter';
import { verifyCaptcha, CAPTCHA_SCORES } from '../../../../lib/captcha';

/**
 * POST /api/arbitres/inscriptions
 * Créer une nouvelle inscription de licence pour un arbitre
 *
 * @body InscriptionArbitreInput - Données validées par Zod
 * @header x-recaptcha-token - Token reCAPTCHA v3 (optionnel en dev)
 * @returns { success: true, message: string, numeroLicence: string | null }
 *
 * Sécurité:
 * - Rate limiting par IP (5 inscriptions/heure)
 * - CAPTCHA Google reCAPTCHA v3
 * - Validation Zod stricte
 * - Transaction atomique Prisma
 * - Retourne uniquement numeroLicence (pas de données sensibles)
 * - Public (pas d'authentification requise)
 */
export async function POST(req: Request) {
  try {
    // 1. Vérifier le rate limiting
    const rateLimitResult = checkInscriptionRateLimit(req);

    if (!rateLimitResult.allowed) {
      const resetTime = formatResetTime(rateLimitResult.resetAt);
      return NextResponse.json(
        {
          message: `Trop de tentatives d'inscription. Réessayez dans ${resetTime}.`,
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 2. Vérifier le CAPTCHA (sauf en développement sans clé)
    const captchaToken = req.headers.get('x-recaptcha-token');
    const shouldCheckCaptcha = process.env.NODE_ENV === 'production' || process.env.RECAPTCHA_SECRET_KEY;

    if (shouldCheckCaptcha) {
      if (!captchaToken) {
        return NextResponse.json(
          { message: 'Token CAPTCHA manquant' },
          { status: 400 }
        );
      }

      const captchaResult = await verifyCaptcha(captchaToken, 'inscription', CAPTCHA_SCORES.NORMAL);

      if (!captchaResult.success) {
        return NextResponse.json(
          { message: captchaResult.error || 'Vérification CAPTCHA échouée' },
          { status: 403 }
        );
      }
    }

    // 3. Parser et valider les données
    const body = await req.json();
    const validatedData = inscriptionArbitreSchema.parse(body);

    // 4. Créer l'inscription via le service arbitre
    const result = await ArbitreService.creerInscriptionArbitre(validatedData);

    // 5. Retourner le numéro de licence et message de succès
    const message = result.numeroLicence
      ? result.emailSent
        ? `Inscription créée avec succès ! Votre numéro de licence est ${result.numeroLicence}. Un email de confirmation a été envoyé. Votre demande est en attente de validation par un administrateur.`
        : `Inscription créée avec succès ! Votre numéro de licence est ${result.numeroLicence}. Conservez précieusement ce numéro. Votre demande est en attente de validation par un administrateur.`
      : result.emailSent
        ? `Inscription créée avec succès ! Un email de confirmation a été envoyé. Votre demande est en attente de validation par un administrateur.`
        : `Inscription créée avec succès ! Votre demande est en attente de validation par un administrateur.`;

    return NextResponse.json(
      {
        success: true,
        message,
        numeroLicence: result.numeroLicence,
        emailSent: result.emailSent,
        statut: 'SOUMISE', // La licence est créée en SOUMISE, nécessite validation admin
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/arbitres/inscriptions?numeroLicence=xxx&dateNaissance=xxx&telephone=xxx&forRenewal=true
 * Récupérer une licence d'arbitre par numéro de licence, date de naissance et téléphone
 *
 * @query numeroLicence - Numéro de licence au format FIK-YYYY-XXXXXX (requis)
 * @query dateNaissance - Date de naissance au format ISO (YYYY-MM-DD) (requis)
 * @query telephone - Numéro de téléphone (requis)
 * @query forRenewal - Si 'true', cherche dans toutes les saisons (pour renouvellement). Sinon, cherche uniquement dans la saison en cours (pour suivi)
 * @returns Licence complète avec relations
 *
 * Cas d'usage:
 * - forRenewal = false ou absent (défaut) : Page de SUIVI → cherche licence de la saison en cours
 * - forRenewal = true : Page de RENOUVELLEMENT → cherche dans toutes les saisons
 *
 * Sécurité:
 * - Validation des 3 paramètres requis
 * - Vérification que les informations correspondent à l'arbitre
 * - Accès protégé par authentification via informations personnelles
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const numeroLicence = searchParams.get('numeroLicence');
    const dateNaissance = searchParams.get('dateNaissance');
    const telephone = searchParams.get('telephone');
    const forRenewal = searchParams.get('forRenewal') === 'true';

    // Vérifier que tous les paramètres sont fournis
    if (!numeroLicence || !dateNaissance || !telephone) {
      return NextResponse.json(
        { message: 'Les paramètres numeroLicence, dateNaissance et telephone sont requis' },
        { status: 400 }
      );
    }

    // Valider le format du numéro de licence (ex: FIK-2024-123456)
    if (!/^FIK-\d{4}-\d{6}$/.test(numeroLicence)) {
      return NextResponse.json(
        { message: 'Format de numéro de licence invalide. Format attendu: FIK-YYYY-XXXXXX (ex: FIK-2024-123456 avec 6 chiffres à la fin)' },
        { status: 400 }
      );
    }

    // Valider le format de la date de naissance
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateNaissance)) {
      return NextResponse.json(
        { message: 'Format de date de naissance invalide. Format attendu: YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Récupérer la licence avec vérification des identifiants
    // Si forRenewal = true, on cherche dans toutes les saisons (filterBySeason = false)
    // Si forRenewal = false, on cherche uniquement dans la saison en cours (filterBySeason = true)
    const licence = await ArbitreService.getLicenceArbitreByCredentials(
      numeroLicence,
      dateNaissance,
      telephone,
      !forRenewal // Inverser la logique: forRenewal=true => filterBySeason=false
    );

    return NextResponse.json(licence);
  } catch (error) {
    return handleApiError(error);
  }
}
