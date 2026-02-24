/**
 * Rate Limiter simple basé sur IP
 * Limite le nombre de requêtes par IP dans une fenêtre de temps donnée
 *
 * Pour une solution production, considérer Redis ou Upstash Rate Limit
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

class RateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.requests = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Vérifie si une IP a dépassé la limite
   * @param ip - Adresse IP du client
   * @param limit - Nombre maximum de requêtes autorisées
   * @param windowMs - Fenêtre de temps en millisecondes
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(
    ip: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.requests.get(ip);

    // Première requête ou fenêtre expirée
    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.requests.set(ip, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    // Incrémenter le compteur
    entry.count++;
    this.requests.set(ip, entry);

    // Vérifier si la limite est dépassée
    if (entry.count > limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Réinitialise le compteur pour une IP
   */
  reset(ip: string): void {
    this.requests.delete(ip);
  }

  /**
   * Nettoie périodiquement les entrées expirées
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, entry] of this.requests.entries()) {
        if (now > entry.resetAt) {
          this.requests.delete(ip);
        }
      }
    }, 60000); // Nettoyage toutes les minutes
  }

  /**
   * Arrête le nettoyage automatique
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Instance singleton
const rateLimiter = new RateLimiter();

// Limites par défaut pour les inscriptions
export const INSCRIPTION_RATE_LIMIT = {
  maxRequests: 5, // 5 requêtes
  windowMs: 60 * 60 * 1000, // par heure
};

/**
 * Middleware de rate limiting pour les inscriptions
 * @param request - Request Next.js
 * @returns null si autorisé, NextResponse avec erreur 429 sinon
 */
export function checkInscriptionRateLimit(request: Request) {
  const ip = getClientIp(request);

  const result = rateLimiter.check(
    ip,
    INSCRIPTION_RATE_LIMIT.maxRequests,
    INSCRIPTION_RATE_LIMIT.windowMs
  );

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
    ip,
  };
}

/**
 * Récupère l'IP du client depuis les headers
 */
export function getClientIp(request: Request): string {
  // Vérifier les headers de proxy courants
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback (pas idéal en production)
  return 'unknown';
}

/**
 * Formate le temps restant en format lisible
 */
export function formatResetTime(resetAt: number): string {
  const now = Date.now();
  const diff = resetAt - now;

  if (diff <= 0) return 'maintenant';

  const minutes = Math.ceil(diff / 60000);

  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} heure${hours > 1 ? 's' : ''}`;
}

export default rateLimiter;
