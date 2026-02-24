import { NextResponse } from 'next/server';
import { LicenceService } from '../../../services/licence.service';
import { creerLicenceSchema } from '../../../lib/validators/licence.schema';
import {soumettreLicenceSchema, validerLicenceSchema, rejeterLicenceSchema,} from '../../../lib/validators/licence.schema';
import { handleApiError } from '../../../lib/http';
import { verifyAuth } from '../../../lib/auth';
import { requireAdmin } from '../../../lib/guards';
import prisma from '../../../lib/prisma';

/**
 * GET /api/licences
 * Récupération de toutes les licences (ADMIN uniquement)
 * Supporte les filtres via query params:
 * - ?statut=SOUMISE : filtrer par statut
 * - ?saisonId=xxx : filtrer par ID de saison spécifique
 * - ?saisonId=EN_COURS : filtrer par saison en cours uniquement
 * - ?saisonId=ARCHIVES : filtrer par saisons passées (archivées)
 *
 * NOTE: Authentification temporairement désactivée pour le développement
 * TODO: Réactiver l'authentification en production
 */
export async function GET(req: Request) {
  try {
    // Authentification temporairement désactivée pour le développement
    // TODO: Décommenter en production
    // const user = verifyAuth(req);
    // requireAdmin(user);

    const { searchParams } = new URL(req.url);
    const statut = searchParams.get('statut');
    const saisonFilter = searchParams.get('saisonId');

    // Construire les conditions de filtre
    const where: any = {};

    // Filtre par statut
    if (statut) {
      where.statut = statut;
    }

    // Filtre par saison
    if (saisonFilter) {
      if (saisonFilter === 'EN_COURS') {
        // Filtrer par saison en cours
        const saisonEnCours = await prisma.saison.findFirst({
          where: { enCours: true },
          select: { id: true },
        });
        if (saisonEnCours) {
          where.saisonId = saisonEnCours.id;
        } else {
          // Aucune saison en cours, retourner un tableau vide
          return NextResponse.json({
            success: true,
            data: [],
          });
        }
      } else if (saisonFilter === 'ARCHIVES') {
        // Filtrer par saisons passées (non en cours)
        const saisonsArchivees = await prisma.saison.findMany({
          where: { enCours: false },
          select: { id: true },
        });
        if (saisonsArchivees.length > 0) {
          where.saisonId = {
            in: saisonsArchivees.map(s => s.id),
          };
        } else {
          // Aucune saison archivée, retourner un tableau vide
          return NextResponse.json({
            success: true,
            data: [],
          });
        }
      } else {
        // ID de saison spécifique
        where.saisonId = saisonFilter;
      }
    }

    const licences = await prisma.licence.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        joueur: {
          include: {
            responsables: true,
          },
        },
        saison: true,
        clubActuel: true,
        clubPrecedent: true,
        paiement: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: licences,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/licences
 * Création d'une licence (statut = BROUILLON)
 */
export async function POST(req: Request) {
  try {
    const data = creerLicenceSchema.parse(await req.json());

    const licence = await LicenceService.creerLicence(data);

    return NextResponse.json(licence, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/licences
 * Soumission d'une licence (BROUILLON → SOUMISE)
 * Nécessite une authentification ADMIN
 */
export async function PUT(req: Request) {
  try {
    // Vérifier l'authentification admin
    const user = verifyAuth(req);
    requireAdmin(user);

    const data = soumettreLicenceSchema.parse(await req.json());

    const licence = await LicenceService.soumettreLicence(data.licenceId);

    return NextResponse.json({
      success: true,
      message: 'Licence soumise avec succès',
      data: licence,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/licences
 * Validation ou rejet d'une licence (ADMIN uniquement)
 * 
 * NOTE: Authentification temporairement désactivée pour le développement
 * TODO: Réactiver l'authentification en production
 */
export async function PATCH(req: Request) {
  try {
    // Authentification temporairement désactivée pour le développement
    // TODO: Décommenter en production
    // const user = verifyAuth(req);
    // requireAdmin(user);

    const body = await req.json();

    // --- Validation ---
    if (body.action === 'validate') {
      const data = validerLicenceSchema.parse(body);

      const licence = await LicenceService.validerLicence(data.licenceId);

      return NextResponse.json(licence);
    }

    // --- Rejet ---
    const data = rejeterLicenceSchema.parse(body);

    const licence = await LicenceService.rejeterLicence(
      data.licenceId,
      data.commentaireAdmin
    );

    return NextResponse.json(licence);
  } catch (error) {
    return handleApiError(error);
  }
}
