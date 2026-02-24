import prisma from '../lib/prisma';
import { StatutLicence, TypeLicence } from '../../generated/prisma/client';

export class LicenceService {
  // ===============================
  // Création licence (SOUMISE directement)
  // ===============================
  static async creerLicence(data: any) {
    return prisma.$transaction(async (tx) => {
      // 1. Créer joueur
      const joueur = await tx.joueur.create({
        data: {
          nom: data.joueur.nom,
          prenom: data.joueur.prenom,
          dateNaissance: new Date(data.joueur.dateNaissance),
          lieuNaissance: data.joueur.lieuNaissance,
          nationalite: data.joueur.nationalite,
          sexe: data.joueur.sexe,
          photo: data.joueur.photo || undefined, // Convertir chaîne vide en undefined
          signature: data.joueur.signature || undefined, // Convertir chaîne vide en undefined
          responsables: data.responsables
            ? {
                create: data.responsables,
              }
            : undefined,
        },
      });

      // 2. Créer licence directement en statut SOUMISE (en attente de validation/rejet admin)
      const licence = await tx.licence.create({
        data: {
          joueurId: joueur.id,
          saisonId: data.saisonId,
          type: data.type,
          statut: StatutLicence.SOUMISE,
          clubPrecedentId: data.clubPrecedentId,
          clubActuelId: data.clubActuelId,
        },
        include: {
          joueur: true,
        },
      });

      return licence;
    });
  }

  // ===============================
  // Soumettre licence
  // ===============================
  static async soumettreLicence(licenceId: string) {
    const licence = await prisma.licence.findUnique({
      where: { id: licenceId },
    });

    if (!licence) {
      throw new Error("Licence introuvable");
    }

    if (licence.statut !== StatutLicence.BROUILLON) {
      throw new Error("Licence non soumissible");
    }

    return prisma.licence.update({
      where: { id: licenceId },
      data: {
        statut: StatutLicence.SOUMISE,
      },
    });
  }

  // ===============================
  // Valider licence (ADMIN)
  // ===============================
  static async validerLicence(licenceId: string) {
    // 1. Récupérer la licence avec le joueur AVANT la transaction
    const licence = await prisma.licence.findUnique({
      where: { id: licenceId },
      include: { joueur: true },
    });

    if (!licence) {
      throw new Error('Licence introuvable');
    }

    // 2. Autoriser validation depuis SOUMISE ou EN_CORRECTION
    if (licence.statut !== StatutLicence.SOUMISE && licence.statut !== StatutLicence.EN_CORRECTION) {
      throw new Error('Seules les licences soumises ou en correction peuvent être validées');
    }

    // 3. Vérifier que le joueur a un numéro de licence
    // Pour les nouveaux joueurs, le numéro est assigné lors de la création
    // Pour les renouvellements, le joueur garde son numéro précédent
    if (!licence.joueur.numeroLicence) {
      throw new Error('Le joueur n\'a pas de numéro de licence. Le numéro devrait être assigné lors de la création de l\'inscription.');
    }

    // 4. Transaction : valider la licence
    return prisma.$transaction(async (tx) => {
      // Mettre à jour la licence et retourner avec le joueur (pour avoir le numéro de licence)
      return tx.licence.update({
        where: { id: licenceId },
        data: {
          statut: StatutLicence.VALIDEE,
          dateValidation: new Date(),
        },
        include: {
          joueur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              numeroLicence: true,
            },
          },
        },
      });
    });
  }

  // ===============================
  // Rejeter licence (ADMIN)
  // ===============================
  static async rejeterLicence(
    licenceId: string,
    commentaireAdmin: string
  ) {
    // Vérifier que le commentaire est valide
    if (!commentaireAdmin || commentaireAdmin.trim().length < 3) {
      throw new Error('Le commentaire de rejet doit contenir au moins 3 caractères');
    }

    return prisma.licence.update({
      where: { id: licenceId },
      data: {
        statut: StatutLicence.REJETEE,
        commentaireAdmin,
      },
    });
  }
}
