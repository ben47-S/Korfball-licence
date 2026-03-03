import { InscriptionArbitreInput } from '../lib/validators/arbitre.schema';
import { InscriptionLicenceInput } from '../lib/validators/inscription.schema';
import { InscriptionService } from './inscription.service';

/**
 * Service métier pour gérer les inscriptions d'arbitres
 * Mappe les données d'arbitre vers le format joueur pour utiliser la même table
 */
export class ArbitreService {
  /**
   * Crée une inscription de licence pour un arbitre
   * Transforme les données arbitre en format joueur pour utiliser le service d'inscription existant
   */
  static async creerInscriptionArbitre(data: InscriptionArbitreInput): Promise<{
    licenceId: string;
    joueurId: string;
    numeroLicence: string | null;
    emailSent: boolean;
  }> {
    // Mapper les données arbitre vers le format joueur
    const inscriptionData: InscriptionLicenceInput = {
      type: data.type,
      saisonId: data.saisonId,
      joueur: {
        nom: data.arbitre.nom,
        prenom: data.arbitre.prenom,
        email: data.arbitre.email || '',
        telephone: data.arbitre.telephone,
        dateNaissance: data.arbitre.dateNaissance,
        lieuNaissance: '', // Valeur par défaut pour les arbitres (champ non demandé dans le formulaire)
        nationalite: data.arbitre.nationalite,
        sexe: data.arbitre.sexe,
        photo: data.arbitre.photo || '',
        signature: data.arbitre.signature || '',
        pieceIdentite: data.arbitre.pieceIdentite || '',
        certificatMedical: data.arbitre.certificatMedical || '',
      },
      // Les arbitres n'ont pas de responsables (adultes)
      responsables: undefined,
      numeroLicencePrecedent: data.numeroLicencePrecedent,
      clubPrecedentId: data.clubPrecedentId,
      clubActuelId: data.clubActuelId,
    };

    // Utiliser le service d'inscription existant
    return InscriptionService.creerInscription(inscriptionData);
  }

  /**
   * Récupérer une licence ARBITRE par numéro de licence, date de naissance et téléphone
   * SÉCURITÉ: Ne retourne QUE les licences d'ARBITRES (lieuNaissance vide)
   * Si une licence de joueur est recherchée ici, elle ne sera pas trouvée
   */
  static async getLicenceArbitreByCredentials(
    numeroLicence: string,
    dateNaissance: string,
    telephone: string,
    filterBySeason: boolean = true
  ) {
    // Importer prisma depuis le service d'inscription
    const prisma = (await import('../lib/prisma')).default;

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

    // Trouver l'arbitre par son numéro de licence
    const arbitre = await prisma.joueur.findUnique({
      where: { numeroLicence },
      include: {
        licences: {
          where: saisonFilter,
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
            createdAt: 'desc',
          },
        },
        responsables: true,
      },
    });

    if (!arbitre) {
      throw new Error('Aucune licence trouvée avec ce numéro de licence');
    }

    // SÉCURITÉ: Vérifier que c'est bien un ARBITRE (lieuNaissance vide)
    // Si c'est un joueur (lieuNaissance rempli), on fait comme si la licence n'existe pas
    if (arbitre.lieuNaissance && arbitre.lieuNaissance.trim() !== '') {
      throw new Error('Aucune licence trouvée avec ce numéro de licence');
    }

    // Vérifier la date de naissance
    const dateNaissanceArbitre = new Date(arbitre.dateNaissance);
    const dateNaissanceFournie = new Date(dateNaissance);
    const datesCorrespondent =
      dateNaissanceArbitre.getFullYear() === dateNaissanceFournie.getFullYear() &&
      dateNaissanceArbitre.getMonth() === dateNaissanceFournie.getMonth() &&
      dateNaissanceArbitre.getDate() === dateNaissanceFournie.getDate();

    if (!datesCorrespondent) {
      throw new Error('Les informations fournies ne correspondent pas à cette licence');
    }

    // Vérifier le téléphone
    const telephoneArbitre = arbitre.telephone.replace(/\s/g, '').replace(/^\+225/, '');
    if (telephoneNormalise !== telephoneArbitre) {
      throw new Error('Les informations fournies ne correspondent pas à cette licence');
    }

    // Vérifier qu'il y a au moins une licence
    if (arbitre.licences.length === 0) {
      if (filterBySeason) {
        throw new Error('Aucune licence trouvée pour la saison en cours. Veuillez faire une demande de renouvellement.');
      } else {
        throw new Error('Aucune licence trouvée avec ces informations. Vous devez d\'abord créer une nouvelle licence.');
      }
    }

    // Prendre la licence la plus récente
    const licence = arbitre.licences[0];

    // Retourner la licence complète
    return {
      ...licence,
      joueur: {
        id: arbitre.id,
        nom: arbitre.nom,
        prenom: arbitre.prenom,
        email: arbitre.email,
        telephone: arbitre.telephone,
        dateNaissance: arbitre.dateNaissance,
        lieuNaissance: arbitre.lieuNaissance,
        nationalite: arbitre.nationalite,
        sexe: arbitre.sexe,
        photo: arbitre.photo,
        signature: arbitre.signature,
        pieceIdentite: arbitre.pieceIdentite,
        certificatMedical: arbitre.certificatMedical,
        numeroLicence: arbitre.numeroLicence,
        responsables: arbitre.responsables,
      },
      numeroLicence: arbitre.numeroLicence,
    };
  }
}
