import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/http';
import { StatutPaiement } from '../../../../../generated/prisma/enums';

/**
 * POST /api/licences/paiement
 * Marquer le paiement comme effectué (manuellement par l'admin)
 * 
 * Body: { licenceId: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { licenceId } = body;

    if (!licenceId) {
      return NextResponse.json(
        { message: 'licenceId est requis' },
        { status: 400 }
      );
    }

    // Vérifier que la licence existe et est validée
    const licence = await prisma.licence.findUnique({
      where: { id: licenceId },
      include: { paiement: true },
    });

    if (!licence) {
      return NextResponse.json(
        { message: 'Licence introuvable' },
        { status: 404 }
      );
    }

    if (licence.statut !== 'VALIDEE') {
      return NextResponse.json(
        { message: 'Seules les licences validées peuvent avoir un paiement enregistré' },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour le paiement
    let paiement;
    if (licence.paiement) {
      // Mettre à jour le paiement existant
      paiement = await prisma.paiement.update({
        where: { id: licence.paiement.id },
        data: {
          statut: StatutPaiement.VALIDE,
          paidAt: new Date(),
          // Pour un paiement manuel, on peut utiliser des valeurs par défaut
          provider: 'MANUEL',
          transactionId: `MANUAL-${Date.now()}`,
          reference: `REF-${licenceId}-${Date.now()}`,
          montant: 0, // À définir selon vos besoins
          devise: 'XOF', // À adapter selon vos besoins
        },
      });
    } else {
      // Créer un nouveau paiement
      paiement = await prisma.paiement.create({
        data: {
          licenceId: licenceId,
          statut: StatutPaiement.VALIDE,
          paidAt: new Date(),
          provider: 'MANUEL',
          transactionId: `MANUAL-${Date.now()}`,
          reference: `REF-${licenceId}-${Date.now()}`,
          montant: 0, // À définir selon vos besoins
          devise: 'XOF', // À adapter selon vos besoins
        },
      });
    }

    // Récupérer la licence mise à jour avec le paiement
    const licenceUpdated = await prisma.licence.findUnique({
      where: { id: licenceId },
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
    });

    return NextResponse.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: licenceUpdated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

