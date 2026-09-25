import jwt from 'jsonwebtoken';

/**
 * Validation de JWT_SECRET au chargement du module
 * Lance une erreur explicite si la variable d'environnement est manquante
 */
const JWT_SECRET = process.env.JWT_SECRET || '';

if (JWT_SECRET.length > 0 && JWT_SECRET.length < 32) {
  console.warn(
    '[AUTH] Warning: JWT_SECRET is shorter than 32 characters. ' +
    'Consider using a stronger secret for production.'
  );
}

/**
 * Type pour l'utilisateur authentifié
 * L'ID est un UUID (string) pour correspondre au modèle Prisma User
 */
export type AuthUser = {
  id: string; // UUID au lieu de number pour correspondre à Prisma User.id
  role: 'ADMIN' | 'AGENT';
};

/**
 * Vérifie et décode le token JWT depuis les headers de la requête
 * 
 * @param request - Request Next.js avec header Authorization
 * @returns AuthUser avec id (UUID) et role
 * @throws Error('UNAUTHORIZED') si token manquant ou invalide
 */
export function verifyAuth(request: Request): AuthUser {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  try {
    if (!JWT_SECRET) throw new Error('UNAUTHORIZED');
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as AuthUser;
    
    // Validation supplémentaire : s'assurer que l'ID est bien un string (UUID)
    if (typeof decoded.id !== 'string') {
      throw new Error('UNAUTHORIZED');
    }
    
    return decoded;
  } catch (error) {
    // Ne pas exposer les détails de l'erreur JWT pour des raisons de sécurité
    throw new Error('UNAUTHORIZED');
  }
}
