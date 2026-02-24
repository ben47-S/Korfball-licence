import prisma from '../lib/prisma';
import { StatutLicence, TypeLicence } from '../../generated/prisma/client';
import { InscriptionLicenceInput } from '../lib/validators/inscription.schema';
import { sendInscriptionConfirmationEmail } from '../lib/email';
import { formatDate } from '../lib/date-utils';
import { genererNumeroLicence } from '../lib/utils';

/**
 * Service métier pour gérer les inscriptions de licences
 * Gère la logique de saison, validation et création transactionnelle
 */
export class InscriptionService {
  /**
   * Crée une inscription de licence complète (statut SOUMISE directement)
   * La licence est créée en statut SOUMISE et est en attente de validation/rejet par l'admin
   * Retourne uniquement le numeroLicence pour des raisons de sécurité
   * Envoie un email de confirmation si l'email du joueur est fourni
   */
  static async creerInscription(data: InscriptionLicenceInput): Promise<{
    licenceId: string;
    joueurId: string;
    numeroLicence: string | null;
    emailSent: boolean;
  }> {
    // 1. Valider que la saison existe et que les inscriptions sont ouvertes
    const saison = await prisma.saison.findUnique({
      where: { id: data.saisonId },
    });

    if (!saison) {
      throw new Error('Saison introuvable');
    }

    const maintenant = new Date();
    if (maintenant < saison.inscriptionDebut) {
      throw new Error(
        `Les inscriptions pour la saison ${saison.code} ne sont pas encore ouvertes. ` +
        `Ouverture prévue le ${formatDate(saison.inscriptionDebut)}`
      );
    }

    if (maintenant > saison.inscriptionFin) {
      throw new Error(
        `Les inscriptions pour la saison ${saison.code} sont fermées depuis le ${formatDate(saison.inscriptionFin)}`
      );
    }

    // 2. Si RENOUVELLEMENT, récupérer la licence précédente par le numéro de licence
    let licencePrecedente = null;
    let joueurPrecedent = null;
    let joueurIdExistant: string | null = null;

    if (data.type === TypeLicence.RENOUVELLEMENT && data.numeroLicencePrecedent) {
      // Récupérer le joueur par son numéro de licence
      joueurPrecedent = await prisma.joueur.findUnique({
        where: { numeroLicence: data.numeroLicencePrecedent },
        include: {
          licences: {
            include: {
              saison: true,
              clubActuel: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!joueurPrecedent || joueurPrecedent.licences.length === 0) {
        throw new Error('Aucune licence précédente trouvée avec ce numéro de licence.');
      }

      // Prendre la licence la plus récente
      licencePrecedente = joueurPrecedent.licences[0];

      // Vérifier que la licence précédente est validée
      if (licencePrecedente.statut !== 'VALIDEE') {
        throw new Error('Votre licence précédente n\'est pas validée. Vous ne pouvez pas renouveler une licence non validée.');
      }

      // Vérifier que c'est bien une saison précédente (pas la même)
      if (licencePrecedente.saisonId === data.saisonId) {
        throw new Error('Vous ne pouvez pas renouveler une licence pour la même saison.');
      }

      // Vérifier la correspondance du joueur (nom, prénom, date de naissance)
      const dateNaissancePrecedente = new Date(joueurPrecedent.dateNaissance).toISOString().split('T')[0];
      const dateNaissanceActuelle = new Date(data.joueur.dateNaissance).toISOString().split('T')[0];

      if (
        joueurPrecedent.nom.toLowerCase().trim() !== data.joueur.nom.toLowerCase().trim() ||
        joueurPrecedent.prenom.toLowerCase().trim() !== data.joueur.prenom.toLowerCase().trim() ||
        dateNaissancePrecedente !== dateNaissanceActuelle
      ) {
        throw new Error(
          'Les informations du joueur ne correspondent pas à votre licence précédente. ' +
          'Vérifiez votre nom, prénom et date de naissance.'
        );
      }

      // Stocker l'ID du joueur existant
      joueurIdExistant = joueurPrecedent.id;

      // Utiliser le club actuel de la licence précédente si non fourni
      if (!data.clubPrecedentId && licencePrecedente.clubActuelId) {
        data.clubPrecedentId = licencePrecedente.clubActuelId;
      }
    }

    // 3. Normaliser les IDs des clubs (chaînes vides -> null)
    const clubPrecedentId = data.clubPrecedentId && data.clubPrecedentId.trim() !== '' ? data.clubPrecedentId : null;
    const clubActuelId = data.clubActuelId && data.clubActuelId.trim() !== '' ? data.clubActuelId : null;
    
    // Vérifier que les clubs existent si fournis (pour éviter P2028)
    if (clubPrecedentId) {
      const clubExists = await prisma.club.findUnique({ where: { id: clubPrecedentId } });
      if (!clubExists) {
        throw new Error('Club précédent introuvable');
      }
    }
    if (clubActuelId) {
      const clubExists = await prisma.club.findUnique({ where: { id: clubActuelId } });
      if (!clubExists) {
        throw new Error('Club actuel introuvable');
      }
    }

    // 4. Rechercher le joueur existant AVANT la transaction (pour réduire le travail dans la transaction)
    // Recherche par email (prioritaire) OU téléphone pour éviter les doublons
    let joueur;
    if (joueurIdExistant) {
      joueur = await prisma.joueur.findUnique({
        where: { id: joueurIdExistant },
      });
      if (!joueur) {
        throw new Error('Joueur introuvable');
      }
    } else {
      // Rechercher d'abord par email si fourni, sinon par téléphone
      // Le téléphone est obligatoire donc on peut toujours chercher par téléphone
      if (data.joueur.email) {
        joueur = await prisma.joueur.findFirst({
          where: { email: data.joueur.email },
        });
      }
      
      // Si pas trouvé par email (ou email non fourni), chercher par téléphone
      if (!joueur) {
        joueur = await prisma.joueur.findFirst({
          where: { telephone: data.joueur.telephone },
        });
      }
    }

    // 5. Générer un numéro de licence pour les nouveaux joueurs AVANT la transaction
    let numeroLicenceGenere: string | null = null;
    if (data.type === TypeLicence.NOUVEAU && !joueur) {
      // Générer un numéro unique pour le nouveau joueur
      let tentative = 0;
      const maxTentatives = 10;
      
      do {
        numeroLicenceGenere = genererNumeroLicence();
        const joueurAvecNumero = await prisma.joueur.findUnique({
          where: { numeroLicence: numeroLicenceGenere },
          select: { id: true },
        });
        
        if (!joueurAvecNumero) {
          break; // Numéro unique trouvé
        }
        
        tentative++;
        if (tentative >= maxTentatives) {
          throw new Error('Impossible de générer un numéro de licence unique après plusieurs tentatives');
        }
      } while (true);
    }

    // 6. Créer l'inscription en transaction (uniquement les écritures)
    return prisma.$transaction(async (tx) => {
      // 6.1. Créer ou mettre à jour le joueur (sans responsables pour réduire la complexité)
      if (!joueur) {
        joueur = await tx.joueur.create({
          data: {
            nom: data.joueur.nom,
            prenom: data.joueur.prenom,
            email: data.joueur.email || null,
            telephone: data.joueur.telephone, // Obligatoire
            dateNaissance: new Date(data.joueur.dateNaissance),
            lieuNaissance: data.joueur.lieuNaissance, // Obligatoire
            nationalite: data.joueur.nationalite, // Obligatoire
            sexe: data.joueur.sexe, // Obligatoire
            photo: data.joueur.photo || null, // Optionnel
            signature: data.joueur.signature || null, // Optionnel
            pieceIdentite: data.joueur.pieceIdentite || null, // Obligatoire pour NOUVEAU
            certificatMedical: data.joueur.certificatMedical || null, // Obligatoire pour NOUVEAU
            numeroLicence: numeroLicenceGenere, // Assigner le numéro généré pour les nouveaux joueurs
          },
          select: { id: true },
        });
      } else {
        // Mettre à jour les infos du joueur existant (sans responsables pour réduire la complexité)
        joueur = await tx.joueur.update({
          where: { id: joueur.id },
          data: {
            nom: data.joueur.nom,
            prenom: data.joueur.prenom,
            email: data.joueur.email ?? joueur.email ?? null,
            telephone: data.joueur.telephone ?? joueur.telephone ?? null,
            // dateNaissance ne doit pas changer (identité du joueur)
            lieuNaissance: data.joueur.lieuNaissance ?? joueur.lieuNaissance ?? null,
            nationalite: data.joueur.nationalite ?? joueur.nationalite ?? null,
            sexe: data.joueur.sexe ?? joueur.sexe ?? null,
            photo: data.joueur.photo ?? joueur.photo ?? null,
            signature: data.joueur.signature ?? joueur.signature ?? null,
            pieceIdentite: data.joueur.pieceIdentite ?? joueur.pieceIdentite ?? null,
            certificatMedical: data.joueur.certificatMedical ?? joueur.certificatMedical ?? null,
          },
          select: { id: true },
        });
      }

      // 5.2. Créer la licence AVANT les responsables (pour réduire la complexité de la transaction)
      // La contrainte unique (joueurId, saisonId) empêchera les doublons
      const licence = await tx.licence.create({
        data: {
          joueurId: joueur.id,
          saisonId: data.saisonId,
          type: data.type,
          statut: StatutLicence.SOUMISE,
          clubPrecedentId,
          clubActuelId,
        },
        select: {
          id: true,
        },
      });

      // 5.3. Créer les responsables APRÈS la licence (séquentiellement pour réduire le travail dans la transaction)
      if (data.responsables && data.responsables.length > 0) {
        for (const resp of data.responsables) {
          await tx.responsable.create({
            data: {
              nom: resp.nom,
              prenom: resp.prenom,
              telephone: resp.telephone,
              email: resp.email || null,
              lien: resp.lien,
              joueurId: joueur.id,
            },
          });
        }
      }

      // 4.4. Récupérer le numéro de licence du joueur (pour l'email)
      const joueurComplet = await tx.joueur.findUnique({
        where: { id: joueur.id },
        select: { numeroLicence: true },
      });

      // 4.5. Envoyer l'email de confirmation (non bloquant) avec le numéro de licence
      let emailSent = false;
      if (data.joueur.email && joueurComplet?.numeroLicence) {
        try {
          const result = await sendInscriptionConfirmationEmail(
            data.joueur.email,
            data.joueur.nom,
            data.joueur.prenom,
            joueurComplet.numeroLicence,
            saison.code
          );
          emailSent = result.success;

          if (!result.success) {
            console.error('[INSCRIPTION] Erreur envoi email:', result.error);
          }
        } catch (error) {
          console.error('[INSCRIPTION] Erreur envoi email:', error);
          // Ne pas bloquer l'inscription si l'email échoue
        }
      }

      // 4.6. Retourner les informations nécessaires
      // Note: La licence est créée directement en SOUMISE et est en attente de validation/rejet admin
      // Pour les nouveaux joueurs, le numéro de licence est déjà assigné
      return {
        licenceId: licence.id,
        joueurId: joueur.id,
        numeroLicence: joueurComplet?.numeroLicence || null,
        emailSent,
      };
    });
  }



  /**
   * Récupérer une licence par numéro de licence, date de naissance et téléphone
   * Vérifie que les informations correspondent pour sécuriser l'accès
   *
   * @param numeroLicence - Numéro de licence au format FIK-YYYY-XXXXXX
   * @param dateNaissance - Date de naissance au format YYYY-MM-DD
   * @param telephone - Numéro de téléphone (normalisé automatiquement)
   * @param filterBySeason - Si true, filtre par saison en cours uniquement. Si false, cherche dans toutes les saisons
   *
   * Cas d'usage:
   * - filterBySeason = true (défaut) : Page de SUIVI → cherche licence de la saison en cours
   * - filterBySeason = false : Page de RENOUVELLEMENT → cherche dans toutes les saisons
   */
  static async getLicenceByCredentials(
    numeroLicence: string,
    dateNaissance: string,
    telephone: string,
    filterBySeason: boolean = true
  ) {
    // Normaliser le téléphone (enlever les espaces, garder seulement les chiffres après +225)
    const telephoneNormalise = telephone.replace(/\s/g, '').replace(/^\+225/, '');

    // Configuration du filtre de saison
    let saisonFilter: { saisonId: string } | undefined = undefined;

    if (filterBySeason) {
      // Récupérer la saison en cours pour filtrer
      const saisonEnCours = await prisma.saison.findFirst({
        where: { enCours: true },
        select: { id: true },
      });

      if (!saisonEnCours) {
        throw new Error('Aucune saison en cours. Veuillez contacter l\'administration.');
      }

      saisonFilter = { saisonId: saisonEnCours.id };
    }
    // Si filterBySeason = false, saisonFilter reste undefined (pas de filtrage)

    // Trouver le joueur par son numéro de licence
    const joueur = await prisma.joueur.findUnique({
      where: { numeroLicence },
      include: {
        licences: {
          where: saisonFilter, // Filtre conditionnel par saison
          include: {
            saison: true,
            clubActuel: true,
            clubPrecedent: true,
            paiement: {
              select: {
                id: true,
                montant: true,
                statut: true,
                devise: true,
                reference: true,
                createdAt: true,
                paidAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc', // Licence la plus récente en premier
          },
        },
        responsables: true,
      },
    });

    if (!joueur) {
      throw new Error('Aucune licence trouvée avec ce numéro de licence');
    }

    // Vérifier la date de naissance (comparer seulement la date, pas l'heure)
    const dateNaissanceJoueur = new Date(joueur.dateNaissance);
    const dateNaissanceFournie = new Date(dateNaissance);
    const datesCorrespondent =
      dateNaissanceJoueur.getFullYear() === dateNaissanceFournie.getFullYear() &&
      dateNaissanceJoueur.getMonth() === dateNaissanceFournie.getMonth() &&
      dateNaissanceJoueur.getDate() === dateNaissanceFournie.getDate();

    if (!datesCorrespondent) {
      throw new Error('Les informations fournies ne correspondent pas à cette licence');
    }

    // Vérifier le téléphone (normaliser aussi le téléphone du joueur)
    const telephoneJoueur = joueur.telephone.replace(/\s/g, '').replace(/^\+225/, '');
    if (telephoneNormalise !== telephoneJoueur) {
      throw new Error('Les informations fournies ne correspondent pas à cette licence');
    }

    // Vérifier qu'il y a au moins une licence
    if (joueur.licences.length === 0) {
      if (filterBySeason) {
        // Cas SUIVI : licence non trouvée pour la saison en cours
        throw new Error('Aucune licence trouvée pour la saison en cours. Veuillez faire une demande de renouvellement.');
      } else {
        // Cas RENOUVELLEMENT : aucune licence dans tout l'historique
        throw new Error('Aucune licence trouvée avec ces informations. Vous devez d\'abord créer une nouvelle licence.');
      }
    }

    // Prendre la licence la plus récente de la saison en cours
    const licence = joueur.licences[0];

    // Retourner la licence complète
    return {
      ...licence,
      joueur: {
        id: joueur.id,
        nom: joueur.nom,
        prenom: joueur.prenom,
        email: joueur.email,
        telephone: joueur.telephone,
        dateNaissance: joueur.dateNaissance,
        lieuNaissance: joueur.lieuNaissance,
        nationalite: joueur.nationalite,
        sexe: joueur.sexe,
        photo: joueur.photo,
        signature: joueur.signature,
        pieceIdentite: joueur.pieceIdentite,
        certificatMedical: joueur.certificatMedical,
        numeroLicence: joueur.numeroLicence,
        responsables: joueur.responsables,
      },
      numeroLicence: joueur.numeroLicence,
    };
  }

  /**
   * Récupérer une licence par numéro de licence
   * Trouve le joueur par son numéro de licence, puis récupère sa licence la plus récente
   * @deprecated Utiliser getLicenceByCredentials à la place pour plus de sécurité
   */
  static async getLicenceByNumeroLicence(numeroLicence: string) {
    // Trouver le joueur par son numéro de licence
    const joueur = await prisma.joueur.findUnique({
      where: { numeroLicence },
      include: {
        licences: {
          include: {
            saison: true,
            clubActuel: true,
            clubPrecedent: true,
            paiement: {
              select: {
                id: true,
                montant: true,
                statut: true,
                devise: true,
                reference: true,
                createdAt: true,
                paidAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc', // Licence la plus récente en premier
          },
        },
        responsables: true,
      },
    });

    if (!joueur) {
      throw new Error('Aucune licence trouvée avec ce numéro de licence');
    }

    if (joueur.licences.length === 0) {
      throw new Error('Aucune licence trouvée pour ce numéro de licence');
    }

    // Prendre la licence la plus récente
    const licence = joueur.licences[0];

    // Retourner la licence complète
    return {
      ...licence,
      joueur: {
        id: joueur.id,
        nom: joueur.nom,
        prenom: joueur.prenom,
        email: joueur.email,
        telephone: joueur.telephone,
        dateNaissance: joueur.dateNaissance,
        lieuNaissance: joueur.lieuNaissance,
        nationalite: joueur.nationalite,
        sexe: joueur.sexe,
        photo: joueur.photo,
        signature: joueur.signature,
        pieceIdentite: joueur.pieceIdentite,
        certificatMedical: joueur.certificatMedical,
        numeroLicence: joueur.numeroLicence,
        responsables: joueur.responsables,
      },
      numeroLicence: joueur.numeroLicence,
    };
  }

  /**
   * Modifier une inscription existante (REJETEE → EN_CORRECTION)
   * Permet à l'utilisateur de corriger et resoumettre sa demande
   */
  static async modifierInscription(
    licenceId: string,
    data: InscriptionLicenceInput
  ): Promise<{
    licenceId: string;
    joueurId: string;
    numeroLicence: string | null;
    emailSent: boolean;
  }> {
    // 1. Vérifications préliminaires AVANT la transaction (pour gagner du temps)
    const licenceExistante = await prisma.licence.findUnique({
      where: { id: licenceId },
      select: {
        id: true,
        statut: true,
        joueurId: true,
        saisonId: true,
      },
    });

    if (!licenceExistante) {
      throw new Error('Licence introuvable');
    }

    if (licenceExistante.statut !== StatutLicence.REJETEE) {
      throw new Error('Seules les licences rejetées peuvent être modifiées');
    }

    // 2. Vérifier que la saison est ouverte AVANT la transaction
    const saison = await prisma.saison.findUnique({
      where: { id: data.saisonId },
      select: { inscriptionDebut: true, inscriptionFin: true, code: true },
    });

    if (!saison) {
      throw new Error('Saison introuvable');
    }

    const maintenant = new Date();
    if (maintenant < saison.inscriptionDebut) {
      throw new Error(
        `Les inscriptions pour la saison ${saison.code} ne sont pas encore ouvertes. ` +
        `Ouverture prévue le ${formatDate(saison.inscriptionDebut)}`
      );
    }
    if (maintenant > saison.inscriptionFin) {
      throw new Error(
        `Les inscriptions pour la saison ${saison.code} sont fermées depuis le ${formatDate(saison.inscriptionFin)}`
      );
    }

    // 3. Effectuer les modifications en transaction (uniquement les écritures)
    const result = await prisma.$transaction(
      async (tx) => {
        // 3.1. Mettre à jour les informations du joueur
        const joueur = await tx.joueur.update({
          where: { id: licenceExistante.joueurId },
          data: {
            nom: data.joueur.nom,
            prenom: data.joueur.prenom,
            email: data.joueur.email || null,
            telephone: data.joueur.telephone,
            dateNaissance: new Date(data.joueur.dateNaissance),
            lieuNaissance: data.joueur.lieuNaissance,
            nationalite: data.joueur.nationalite,
            sexe: data.joueur.sexe,
            photo: data.joueur.photo || null,
            signature: data.joueur.signature || null,
            pieceIdentite: data.joueur.pieceIdentite || null,
            certificatMedical: data.joueur.certificatMedical || null,
          },
          select: {
            id: true,
            numeroLicence: true,
            email: true,
            nom: true,
            prenom: true,
          },
        });

        // 3.2. Mettre à jour les responsables (supprimer les anciens, créer les nouveaux)
        await tx.responsable.deleteMany({
          where: { joueurId: joueur.id },
        });

        if (data.responsables && data.responsables.length > 0) {
          await tx.responsable.createMany({
            data: data.responsables.map((resp) => ({
              nom: resp.nom,
              prenom: resp.prenom,
              telephone: resp.telephone,
              email: resp.email || null,
              lien: resp.lien,
              joueurId: joueur.id,
            })),
          });
        }

        // 3.3. Mettre à jour la licence (statut REJETEE → EN_CORRECTION)
        await tx.licence.update({
          where: { id: licenceId },
          data: {
            statut: StatutLicence.EN_CORRECTION,
            type: data.type,
            clubPrecedentId: data.clubPrecedentId || null,
            clubActuelId: data.clubActuelId || null,
            commentaireAdmin: null, // Effacer l'ancien commentaire de rejet
          },
        });

        // Retourner les données nécessaires
        return {
          licenceId: licenceExistante.id,
          joueurId: joueur.id,
          numeroLicence: joueur.numeroLicence,
          email: joueur.email,
          nom: joueur.nom,
          prenom: joueur.prenom,
          saisonCode: saison.code,
        };
      },
      {
        maxWait: 10000, // Attendre max 10s pour obtenir le verrou
        timeout: 30000, // Timeout de 30s pour la transaction
      }
    );

    // 7. Envoyer l'email APRÈS la transaction (opération externe)
    let emailSent = false;
    if (result.email) {
      try {
        await sendInscriptionConfirmationEmail(
          result.email,
          result.nom,
          result.prenom,
          result.numeroLicence || 'En attente',
          result.saisonCode
        );
        emailSent = true;
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }
    }

    return {
      licenceId: result.licenceId,
      joueurId: result.joueurId,
      numeroLicence: result.numeroLicence,
      emailSent,
    };
  }

}
