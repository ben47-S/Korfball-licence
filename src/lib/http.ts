import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  // --- Erreurs de validation Zod ---
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: 'Validation error',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  // --- Erreurs Prisma ---
  if (error && typeof error === 'object' && 'code' in error) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      const meta = error.meta as { target?: string[] } | undefined;
      if (meta?.target?.includes('joueurId') && meta?.target?.includes('saisonId')) {
        return NextResponse.json(
          { message: 'Une licence existe déjà pour ce joueur pour cette saison' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: 'Cette ressource existe déjà' },
        { status: 409 }
      );
    }
  }

  // --- Erreurs métier / auth ---
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { message: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Erreurs de recherche de licence (404)
    if (
      error.message.includes('Aucune licence trouvée') ||
      error.message.includes('licence introuvable') ||
      error.message.includes('Les informations fournies ne correspondent pas')
    ) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }

    // Autres erreurs métier avec message explicite (400)
    if (
      error.message.includes('Saison introuvable') ||
      error.message.includes('Club introuvable') ||
      error.message.includes('Joueur introuvable') ||
      error.message.includes('inscriptions') ||
      error.message.includes('Aucune saison en cours')
    ) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
  }

  // --- Erreur inconnue ---
  console.error('[API ERROR]', error);

  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 }
  );
}
