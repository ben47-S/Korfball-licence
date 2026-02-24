/**
 * Service d'envoi d'emails
 *
 * Supporte plusieurs providers:
 * - Resend (recommandé pour Next.js)
 * - SMTP générique (Gmail, Outlook, etc.)
 *
 * Configuration requise (choisir l'une ou l'autre):
 *
 * Option 1 - Resend (recommandé):
 * - RESEND_API_KEY
 *
 * Option 2 - SMTP:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASS
 *
 * Commun:
 * - EMAIL_FROM (adresse d'expédition)
 */

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Envoie un email via Resend
 */
async function sendWithResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY non configurée' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@korfball.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Erreur Resend:', error);
      return { success: false, error: 'Échec de l\'envoi d\'email' };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[EMAIL] Erreur Resend:', error);
    return { success: false, error: 'Erreur lors de l\'envoi d\'email' };
  }
}

/**
 * Envoie un email via SMTP (solution de secours si Resend n'est pas disponible)
 * Note: Nécessite l'installation de nodemailer (npm install nodemailer)
 */
async function sendWithSMTP(options: EmailOptions): Promise<EmailResult> {
  // Cette implémentation est un placeholder
  // En production, installer nodemailer et implémenter
  console.warn('[EMAIL] SMTP non implémenté - installer nodemailer si nécessaire');
  return { success: false, error: 'SMTP non configuré' };
}

/**
 * Envoie un email (détecte automatiquement le provider disponible)
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Validation des options
  if (!options.to || !options.subject || !options.html) {
    return { success: false, error: 'Paramètres d\'email manquants' };
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.to)) {
    return { success: false, error: 'Adresse email invalide' };
  }

  // En développement, logger au lieu d'envoyer
  if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
    console.log('[EMAIL] Mode développement - Email non envoyé:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html);
    return { success: true, messageId: 'dev-mode' };
  }

  // Essayer Resend en premier
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(options);
  }

  // Fallback sur SMTP si configuré
  if (process.env.SMTP_HOST) {
    return sendWithSMTP(options);
  }

  return { success: false, error: 'Aucun provider d\'email configuré' };
}

/**
 * Génère l'email de confirmation d'inscription avec le numéro de licence
 */
export function generateInscriptionEmail(
  nomJoueur: string,
  prenomJoueur: string,
  numeroLicence: string,
  saison: string
): { subject: string; html: string; text: string } {
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/inscription/suivi`;

  const subject = `Confirmation d'inscription - Licence Korfball ${saison}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .access-key {
      background: white;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .access-key-value {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
      word-break: break-all;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏐 Inscription Confirmée</h1>
    <p>Licence Korfball ${saison}</p>
  </div>

  <div class="content">
    <p>Bonjour <strong>${prenomJoueur} ${nomJoueur}</strong>,</p>

    <p>Votre inscription pour une licence de korfball a bien été enregistrée pour la saison <strong>${saison}</strong>.</p>

    <div class="warning">
      <strong>⚠️ Important</strong><br>
      Conservez précieusement votre numéro de licence ci-dessous. Il vous permettra de suivre l'état de votre demande et de renouveler votre licence.
    </div>

    <div class="access-key">
      <p style="margin: 0; color: #666; font-size: 14px;">Votre numéro de licence :</p>
      <div class="access-key-value">${numeroLicence}</div>
      <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Copiez et conservez ce numéro</p>
    </div>

    <center>
      <a href="${trackingUrl}" class="button">Suivre ma demande</a>
    </center>

    <h3>Prochaines étapes :</h3>
    <ol>
      <li>Votre demande est actuellement en cours de traitement</li>
      <li>Un administrateur va vérifier vos informations</li>
      <li>Vous serez notifié par email une fois votre licence validée</li>
      <li>Vous pourrez alors procéder au paiement</li>
    </ol>

    <h3>Besoin d'aide ?</h3>
    <p>Utilisez votre numéro de licence avec votre date de naissance et votre téléphone pour consulter l'état de votre licence à tout moment sur notre site.</p>
  </div>

  <div class="footer">
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    <p>© ${new Date().getFullYear()} Fédération de Korfball - Tous droits réservés</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Confirmation d'inscription - Licence Korfball ${saison}

Bonjour ${prenomJoueur} ${nomJoueur},

Votre inscription pour une licence de korfball a bien été enregistrée pour la saison ${saison}.

IMPORTANT: Conservez précieusement votre numéro de licence ci-dessous.
Il vous permettra de suivre l'état de votre demande et de renouveler votre licence.

Votre numéro de licence : ${numeroLicence}

Suivez votre demande : ${trackingUrl}

Prochaines étapes :
1. Votre demande est actuellement en cours de traitement
2. Un administrateur va vérifier vos informations
3. Vous serez notifié par email une fois votre licence validée
4. Vous pourrez alors procéder au paiement

Besoin d'aide ?
Utilisez votre numéro de licence avec votre date de naissance et votre téléphone pour consulter l'état de votre licence à tout moment sur notre site.

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} Fédération de Korfball - Tous droits réservés
  `.trim();

  return { subject, html, text };
}

/**
 * Envoie l'email de confirmation d'inscription
 */
export async function sendInscriptionConfirmationEmail(
  email: string,
  nomJoueur: string,
  prenomJoueur: string,
  numeroLicence: string,
  saison: string
): Promise<EmailResult> {
  const emailContent = generateInscriptionEmail(nomJoueur, prenomJoueur, numeroLicence, saison);

  return sendEmail({
    to: email,
    ...emailContent,
  });
}
