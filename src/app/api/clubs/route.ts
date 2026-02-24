import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { handleApiError } from '../../../lib/http';

/**
 * GET /api/clubs
 * Récupère tous les clubs
 * 
 * @query search - Recherche par nom, ville ou pays
 * @returns Liste des clubs avec id, nom, ville, pays
 * 
 * Sécurité:
 * - Public (pas d'authentification requise)
 * - Rate limiting recommandé au niveau middleware
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let clubs;

    if (search) {
      // Recherche par nom, ville ou pays
      clubs = await prisma.club.findMany({
        where: {
          OR: [
            { nom: { contains: search, mode: 'insensitive' } },
            { ville: { contains: search, mode: 'insensitive' } },
            { pays: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          nom: 'asc',
        },
        select: {
          id: true,
          nom: true,
          ville: true,
          pays: true,
        },
      });
    } else {
      // Retourner tous les clubs, triés par nom
      clubs = await prisma.club.findMany({
        orderBy: {
          nom: 'asc',
        },
        select: {
          id: true,
          nom: true,
          ville: true,
          pays: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: clubs,
      count: clubs.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/clubs
 * Créer un nouveau club (ADMIN uniquement)
 * 
 * @body { nom, ville?, pays? }
 * @returns Club créé
 */
export async function POST(req: Request) {
  try {
    // TODO: Ajouter vérification auth admin
    // const user = verifyAuth(req);
    // requireAdmin(user);

    const body = await req.json();

    // Validation basique
    if (!body.nom) {
      return NextResponse.json(
        { message: 'Le nom du club est requis' },
        { status: 400 }
      );
    }

    if (!body.ville) {
      return NextResponse.json(
        { message: 'La ville du club est requise' },
        { status: 400 }
      );
    }

    if (!body.pays) {
      return NextResponse.json(
        { message: 'Le pays du club est requis' },
        { status: 400 }
      );
    }

    const club = await prisma.club.create({
      data: {
        nom: body.nom,
        ville: body.ville,
        pays: body.pays,
      },
      select: {
        id: true,
        nom: true,
        ville: true,
        pays: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: club,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

