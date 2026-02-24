import { AuthUser } from './auth';

export function requireAdmin(user: AuthUser) {
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
}
