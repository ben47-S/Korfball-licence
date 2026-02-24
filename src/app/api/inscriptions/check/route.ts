import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/http';

/**
 * GET /api/inscriptions/check?joueurId=xxx&saisonId=xxx
 * Vérifier si une licence existe déjà pour un joueur et une saison
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const joueurId = searchParams.get('joueurId');
    const saisonId = searchParams.get('saisonId');

    if (!joueurId || !saisonId) {
      return NextResponse.json(
        { message: 'Paramètres joueurId et saisonId requis' },
        { status: 400 }
      );
    }

    const licenceExistante = await prisma.licence.findFirst({
      where: {
        saisonId,
        joueurId,
      },
      select: {
        id: true,
        statut: true,
        type: true,
      },
    });

    return NextResponse.json({
      exists: !!licenceExistante,
      licence: licenceExistante,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

