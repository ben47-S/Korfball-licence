import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { handleApiError } from '../../../lib/http';

/**
 * GET /api/saisons
 * Récupère toutes les saisons ou la saison en cours
 * 
 * @query enCours - Si "true", retourne uniquement la saison en cours
 * @query active - Si "true", retourne uniquement les saisons avec inscriptions ouvertes (déprécié, utiliser enCours)
 * @returns Liste des saisons avec id, code, dates, enCours
 * 
 * Sécurité:
 * - Public (pas d'authentification requise)
 * - Rate limiting recommandé au niveau middleware
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enCoursOnly = searchParams.get('enCours') === 'true';
    const activeOnly = searchParams.get('active') === 'true';

    const maintenant = new Date();

    let saisons;

    if (enCoursOnly) {
      // Mettre à jour automatiquement le statut des saisons
      const toutesLesSaisons = await prisma.saison.findMany({
        select: {
          id: true,
          code: true,
          debut: true,
          fin: true,
          inscriptionDebut: true,
          inscriptionFin: true,
          enCours: true,
        },
      });
      
      // Mettre à jour automatiquement le statut enCours des saisons selon les dates
      for (const saison of toutesLesSaisons) {
        const dateDebutInscriptions = new Date(saison.inscriptionDebut);
        const dateFinSaison = new Date(saison.fin);
        const maintenant = new Date();
        
        // Si la date de début des inscriptions est arrivée ou passée
        // ET la date de fin de saison n'est pas encore passée
        // → Activer la saison (enCours = true)
        if (maintenant >= dateDebutInscriptions && maintenant <= dateFinSaison) {
          if (!saison.enCours) {
            // Désactiver toutes les autres saisons en cours
            await prisma.saison.updateMany({
              where: {
                enCours: true,
              },
              data: {
                enCours: false,
              },
            });
            // Activer cette saison
            await prisma.saison.update({
              where: { id: saison.id },
              data: { enCours: true },
            });
          }
        }
        // Si la date de fin de saison est passée
        // → Désactiver la saison (enCours = false)
        else if (maintenant > dateFinSaison) {
          if (saison.enCours) {
            await prisma.saison.update({
              where: { id: saison.id },
              data: { enCours: false },
            });
          }
        }
      }
      
      // Retourner uniquement la saison en cours
      const saisonEnCours = await prisma.saison.findFirst({
        where: {
          enCours: true,
        },
        select: {
          id: true,
          code: true,
          debut: true,
          fin: true,
          inscriptionDebut: true,
          inscriptionFin: true,
          enCours: true,
        },
      });

      // Si les inscriptions ne sont pas encore ouvertes, ne pas retourner la saison
      if (saisonEnCours) {
        const dateDebutInscriptions = new Date(saisonEnCours.inscriptionDebut);
        const maintenant = new Date();
        
        if (maintenant < dateDebutInscriptions) {
          return NextResponse.json({
            success: true,
            data: [],
            count: 0,
            message: `Les inscriptions pour la saison ${saisonEnCours.code} ne sont pas encore ouvertes.`,
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: saisonEnCours ? [saisonEnCours] : [],
        count: saisonEnCours ? 1 : 0,
      });
    } else if (activeOnly) {
      // Retourner uniquement les saisons avec inscriptions ouvertes (déprécié)
      saisons = await prisma.saison.findMany({
        where: {
          inscriptionDebut: {
            lte: maintenant,
          },
          inscriptionFin: {
            gte: maintenant,
          },
        },
        orderBy: {
          code: 'desc', // Plus récentes en premier
        },
        select: {
          id: true,
          code: true,
          debut: true,
          fin: true,
          inscriptionDebut: true,
          inscriptionFin: true,
          enCours: true,
        },
      });
    } else {
      // Retourner toutes les saisons, triées par code (plus récentes en premier)
      saisons = await prisma.saison.findMany({
        orderBy: {
          code: 'desc',
        },
        select: {
          id: true,
          code: true,
          debut: true,
          fin: true,
          inscriptionDebut: true,
          inscriptionFin: true,
          enCours: true,
        },
      });
      
      // Mettre à jour automatiquement le statut enCours des saisons selon les dates
      for (const saison of saisons) {
        const dateDebutInscriptions = new Date(saison.inscriptionDebut);
        const dateFinSaison = new Date(saison.fin);
        const maintenant = new Date();
        
        // Si la date de début des inscriptions est arrivée ou passée
        // ET la date de fin de saison n'est pas encore passée
        // → Activer la saison (enCours = true)
        if (maintenant >= dateDebutInscriptions && maintenant <= dateFinSaison) {
          if (!saison.enCours) {
            // Désactiver toutes les autres saisons en cours
            await prisma.saison.updateMany({
              where: {
                enCours: true,
              },
              data: {
                enCours: false,
              },
            });
            // Activer cette saison
            await prisma.saison.update({
              where: { id: saison.id },
              data: { enCours: true },
            });
          }
        }
        // Si la date de fin de saison est passée
        // → Désactiver la saison (enCours = false)
        else if (maintenant > dateFinSaison) {
          if (saison.enCours) {
            await prisma.saison.update({
              where: { id: saison.id },
              data: { enCours: false },
            });
          }
        }
      }
      
      // Recharger les saisons après les mises à jour
      saisons = await prisma.saison.findMany({
        orderBy: {
          code: 'desc',
        },
        select: {
          id: true,
          code: true,
          debut: true,
          fin: true,
          inscriptionDebut: true,
          inscriptionFin: true,
          enCours: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: saisons,
      count: saisons.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/saisons
 * Créer une nouvelle saison (ADMIN uniquement)
 * 
 * @body { code, debut, fin, inscriptionDebut, inscriptionFin }
 * @returns Saison créée
 */
export async function POST(req: Request) {
  const body = await req.json();
  try {
    // TODO: Ajouter vérification auth admin
    // const user = verifyAuth(req);
    // requireAdmin(user);

    // Validation basique
    if (!body.debut || !body.fin || !body.inscriptionDebut || !body.inscriptionFin) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const debut = new Date(body.debut);
    const fin = new Date(body.fin);
    const inscriptionDebut = new Date(body.inscriptionDebut);
    const inscriptionFin = new Date(body.inscriptionFin);

    // Générer automatiquement le code de la saison à partir des années
    const anneeDebut = debut.getFullYear();
    const anneeFin = fin.getFullYear();
    const codeSaison = `${anneeDebut}-${anneeFin}`;

    // Vérifier que le code généré n'existe pas déjà
    const saisonExistante = await prisma.saison.findUnique({
      where: { code: codeSaison },
      select: { id: true, code: true },
    });

    if (saisonExistante) {
      return NextResponse.json(
        { message: `Une saison avec le code "${codeSaison}" existe déjà` },
        { status: 400 }
      );
    }

    // Validation 1: Vérifier que debut < fin
    if (debut >= fin) {
      return NextResponse.json(
        { message: 'La date de début de saison doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    // Validation 2: Vérifier que inscriptionDebut < inscriptionFin
    if (inscriptionDebut >= inscriptionFin) {
      return NextResponse.json(
        { message: 'La date de début d\'inscription doit être antérieure à la date de fin d\'inscription' },
        { status: 400 }
      );
    }

    // Validation 3: Vérifier que les dates d'inscription sont contenues dans la période de la saison
    if (inscriptionDebut < debut) {
      return NextResponse.json(
        { message: 'La date de début d\'inscription doit être égale ou postérieure à la date de début de saison' },
        { status: 400 }
      );
    }

    if (inscriptionFin > fin) {
      return NextResponse.json(
        { message: 'La date de fin d\'inscription doit être égale ou antérieure à la date de fin de saison' },
        { status: 400 }
      );
    }

    // Validation 4: Vérifier qu'il n'y a pas de chevauchement avec les saisons existantes
    // Récupérer toutes les saisons existantes
    const saisonsExistantes = await prisma.saison.findMany({
      orderBy: {
        fin: 'desc', // Plus récentes en premier
      },
      select: {
        id: true,
        code: true,
        debut: true,
        fin: true,
      },
    });

    if (saisonsExistantes.length > 0) {
      // Trouver la saison la plus récente (celle avec la date de fin la plus tardive)
      const saisonLaPlusRecente = saisonsExistantes[0];
      const finSaisonLaPlusRecente = new Date(saisonLaPlusRecente.fin);

      // La nouvelle saison doit commencer après la fin de la saison la plus récente
      if (debut <= finSaisonLaPlusRecente) {
        return NextResponse.json(
          { 
            message: `La nouvelle saison doit commencer après la fin de la saison la plus récente (${saisonLaPlusRecente.code} se termine le ${finSaisonLaPlusRecente.toLocaleDateString('fr-FR')})` 
          },
          { status: 400 }
        );
      }

      // Vérifier aussi qu'il n'y a pas de chevauchement avec d'autres saisons
      for (const saisonExistante of saisonsExistantes) {
        const debutExistante = new Date(saisonExistante.debut);
        const finExistante = new Date(saisonExistante.fin);

        // Vérifier si les périodes se chevauchent
        if (
          (debut >= debutExistante && debut <= finExistante) ||
          (fin >= debutExistante && fin <= finExistante) ||
          (debut <= debutExistante && fin >= finExistante)
        ) {
          return NextResponse.json(
            { 
              message: `La nouvelle saison chevauche avec la saison existante ${saisonExistante.code} (${debutExistante.toLocaleDateString('fr-FR')} - ${finExistante.toLocaleDateString('fr-FR')})` 
            },
            { status: 400 }
          );
        }
      }
    }

    const saison = await prisma.saison.create({
      data: {
        code: codeSaison,
        debut,
        fin,
        inscriptionDebut,
        inscriptionFin,
      },
      select: {
        id: true,
        code: true,
        debut: true,
        fin: true,
        inscriptionDebut: true,
        inscriptionFin: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: saison,
    }, { status: 201 });
  } catch (error: any) {
    // Gérer l'erreur de contrainte unique Prisma (au cas où la vérification précédente échoue)
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      // Essayer de reconstruire le code à partir des dates si disponible
      let codeGenere = 'inconnu';
      if (body.debut && body.fin) {
        const anneeDebut = new Date(body.debut).getFullYear();
        const anneeFin = new Date(body.fin).getFullYear();
        codeGenere = `${anneeDebut}-${anneeFin}`;
      }
      return NextResponse.json(
        { message: `Une saison avec le code "${codeGenere}" existe déjà` },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

/**
 * PATCH /api/saisons
 * Définir une saison comme étant en cours (ADMIN uniquement)
 * Désactive automatiquement les autres saisons en cours
 * 
 * @body { saisonId, enCours }
 * @returns Saison mise à jour
 */
export async function PATCH(req: Request) {
  try {
    // TODO: Ajouter vérification auth admin
    // const user = verifyAuth(req);
    // requireAdmin(user);

    const body = await req.json();

    if (!body.saisonId || typeof body.enCours !== 'boolean') {
      return NextResponse.json(
        { message: 'saisonId et enCours sont requis' },
        { status: 400 }
      );
    }

    // Si on définit une saison comme en cours, désactiver toutes les autres
    if (body.enCours === true) {
      await prisma.saison.updateMany({
        where: {
          enCours: true,
        },
        data: {
          enCours: false,
        },
      });
    }

    // Mettre à jour la saison
    const saison = await prisma.saison.update({
      where: { id: body.saisonId },
      data: {
        enCours: body.enCours,
      },
      select: {
        id: true,
        code: true,
        debut: true,
        fin: true,
        inscriptionDebut: true,
        inscriptionFin: true,
        enCours: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: saison,
      message: body.enCours 
        ? `La saison ${saison.code} est maintenant en cours`
        : `La saison ${saison.code} n'est plus en cours`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

