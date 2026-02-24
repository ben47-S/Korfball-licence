/**
 * Service de validation Google reCAPTCHA v3
 *
 * Configuration requise:
 * - NEXT_PUBLIC_RECAPTCHA_SITE_KEY (client-side)
 * - RECAPTCHA_SECRET_KEY (server-side)
 *
 * Documentation: https://developers.google.com/recaptcha/docs/v3
 */

type RecaptchaResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  'error-codes'?: string[];
};

/**
 * Vérifie un token reCAPTCHA v3 côté serveur
 *
 * @param token - Token reCAPTCHA reçu du client
 * @param expectedAction - Action attendue (ex: 'inscription')
 * @param minScore - Score minimum requis (0.0 à 1.0, défaut: 0.5)
 * @returns { success: boolean, score?: number, error?: string }
 */
export async function verifyCaptcha(
  token: string,
  expectedAction: string = 'inscription',
  minScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Vérifier que la clé secrète est configurée
  if (!secretKey) {
    console.error('[CAPTCHA] RECAPTCHA_SECRET_KEY non configurée');
    // En développement, on peut bypass le CAPTCHA
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CAPTCHA] Mode développement - CAPTCHA bypassé');
      return { success: true, score: 1.0 };
    }
    return { success: false, error: 'Configuration CAPTCHA manquante' };
  }

  // Vérifier que le token est fourni
  if (!token || typeof token !== 'string') {
    return { success: false, error: 'Token CAPTCHA manquant ou invalide' };
  }

  try {
    // Appeler l'API Google reCAPTCHA
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data: RecaptchaResponse = await response.json();

    // Vérifier la réponse de base
    if (!data.success) {
      console.error('[CAPTCHA] Échec de la vérification:', data['error-codes']);
      return {
        success: false,
        error: 'Échec de la vérification CAPTCHA',
      };
    }

    // Vérifier l'action (protection contre la réutilisation de tokens)
    if (data.action !== expectedAction) {
      console.warn('[CAPTCHA] Action incorrecte:', data.action, 'attendue:', expectedAction);
      return {
        success: false,
        error: 'Action CAPTCHA incorrecte',
      };
    }

    // Vérifier le score (reCAPTCHA v3 uniquement)
    if (data.score !== undefined && data.score < minScore) {
      console.warn('[CAPTCHA] Score trop bas:', data.score, 'minimum:', minScore);
      return {
        success: false,
        score: data.score,
        error: 'Score CAPTCHA trop bas - comportement suspect détecté',
      };
    }

    // Succès
    return {
      success: true,
      score: data.score,
    };
  } catch (error) {
    console.error('[CAPTCHA] Erreur lors de la vérification:', error);
    return {
      success: false,
      error: 'Erreur lors de la vérification CAPTCHA',
    };
  }
}

/**
 * Middleware de vérification CAPTCHA pour les routes API
 *
 * @param request - Request Next.js
 * @param action - Action attendue (ex: 'inscription')
 * @returns { success: boolean, score?: number, error?: string }
 */
export async function checkCaptcha(
  request: Request,
  action: string = 'inscription'
): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    // Récupérer le token depuis les headers ou le body
    const captchaToken = request.headers.get('x-recaptcha-token');

    if (!captchaToken) {
      // Essayer de le récupérer depuis le body
      const body = await request.clone().json();
      if (body.captchaToken) {
        return verifyCaptcha(body.captchaToken, action);
      }

      return {
        success: false,
        error: 'Token CAPTCHA manquant',
      };
    }

    return verifyCaptcha(captchaToken, action);
  } catch (error) {
    console.error('[CAPTCHA] Erreur lors de la vérification:', error);
    return {
      success: false,
      error: 'Erreur lors de la vérification CAPTCHA',
    };
  }
}

/**
 * Configuration pour différents niveaux de sécurité
 */
export const CAPTCHA_SCORES = {
  STRICT: 0.7,   // Pour les actions sensibles
  NORMAL: 0.5,   // Pour les inscriptions
  PERMISSIVE: 0.3, // Pour les formulaires de contact
};
