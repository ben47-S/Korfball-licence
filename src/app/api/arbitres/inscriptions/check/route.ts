import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/http';

/**
 * GET /api/arbitres/inscriptions/check?arbitreId=xxx&saisonId=xxx
 * Vérifier si une licence existe déjà pour un ARBITRE et une saison
 * SÉCURITÉ: Ne vérifie QUE les licences d'ARBITRES (lieuNaissance vide)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const arbitreId = searchParams.get('arbitreId');
    const saisonId = searchParams.get('saisonId');

    if (!arbitreId || !saisonId) {
      return NextResponse.json(
        { message: 'Paramètres arbitreId et saisonId requis' },
        { status: 400 }
      );
    }

    // Vérifier d'abord que c'est bien un arbitre (lieuNaissance vide)
    const arbitre = await prisma.joueur.findUnique({
      where: { id: arbitreId },
      select: { lieuNaissance: true },
    });

    // Si c'est un joueur (lieuNaissance rempli), retourner comme si aucune licence n'existait
    if (!arbitre || (arbitre.lieuNaissance && arbitre.lieuNaissance.trim() !== '')) {
      return NextResponse.json({
        exists: false,
        licence: null,
      });
    }

    const licenceExistante = await prisma.licence.findFirst({
      where: {
        saisonId,
        joueurId: arbitreId, // Les arbitres utilisent la même table Joueur
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
