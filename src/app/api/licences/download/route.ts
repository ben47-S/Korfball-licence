import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/http';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { getFirebaseStorageBucket } from '@/lib/firebase';

/**
 * GET /api/licences/download?numeroLicence=xxx&dateNaissance=xxx&telephone=xxx
 * 
 * 1. Génère le PDF avec PDFKit
 * 2. Upload dans Firebase Storage
 * 3. Génère une URL signée
 * 4. Redirige vers l'URL Firebase
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const numeroLicence = searchParams.get('numeroLicence');
    const dateNaissance = searchParams.get('dateNaissance');
    const telephone = searchParams.get('telephone');

    // Vérifier que tous les paramètres sont fournis
    if (!numeroLicence || !dateNaissance || !telephone) {
      return NextResponse.json(
        { message: 'Les paramètres numeroLicence, dateNaissance et telephone sont requis' },
        { status: 400 }
      );
    }

    // Valider le format du numéro de licence
    if (!/^FIK-\d{4}-\d{6}$/.test(numeroLicence)) {
      return NextResponse.json(
        { message: 'Format de numéro de licence invalide. Format attendu: FIK-YYYY-XXXXXX' },
        { status: 400 }
      );
    }

    // Utiliser le service pour récupérer la licence avec vérification des identifiants
    const { InscriptionService } = await import('@/services/inscription.service');
    const licenceData = await InscriptionService.getLicenceByCredentials(
      numeroLicence,
      dateNaissance,
      telephone
    );

    // Récupérer la licence complète avec toutes les relations nécessaires pour le PDF
    const licence = await prisma.licence.findUnique({
      where: { id: licenceData.id },
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

    if (!licence) {
      return NextResponse.json(
        { message: 'Licence introuvable' },
        { status: 404 }
      );
    }

    if (licence.statut !== 'VALIDEE') {
      return NextResponse.json(
        { message: 'La licence doit être validée pour être téléchargée' },
        { status: 400 }
      );
    }

    if (!licence.paiement || licence.paiement.statut !== 'VALIDE') {
      return NextResponse.json(
        { message: 'Le paiement doit être effectué pour télécharger la licence' },
        { status: 400 }
      );
    }

    // Vérifier si le PDF existe déjà dans Firebase Storage
    const bucket = getFirebaseStorageBucket();
    const file = bucket.file(`pdfs/${licence.id}.pdf`);
    const [exists] = await file.exists();

    // Si le PDF n'existe pas, le générer et l'uploader
    if (!exists) {
      const pdfBuffer = await generateLicencePDF(licence);
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
        },
      });
    }

    // Générer une URL signée (valide 1 heure)
    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600 * 1000, // 1 heure
    });

    // Rediriger vers l'URL Firebase
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Génère le PDF de la licence avec PDFKit
 */
async function generateLicencePDF(licence: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    // Charger la police TTF
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'roboto-regular.ttf');
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    }

    let yPosition = 50;

    // Titre
    doc.fontSize(20);
    doc.text('FICHE DE LICENCE', 50, yPosition, { align: 'center' });
    yPosition += 30;

    // Informations du joueur
    doc.fontSize(16);
    doc.text('INFORMATIONS DU JOUEUR', 50, yPosition);
    yPosition += 20;

    doc.fontSize(12);
    doc.text(`Nom: ${licence.joueur.nom}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Prénom: ${licence.joueur.prenom}`, 50, yPosition);
    yPosition += 15;

    if (licence.joueur.dateNaissance) {
      const dateNaissance = new Date(licence.joueur.dateNaissance);
      doc.text(`Date de naissance: ${dateNaissance.toLocaleDateString('fr-FR')}`, 50, yPosition);
      yPosition += 15;
    }

    if (licence.joueur.lieuNaissance) {
      doc.text(`Lieu de naissance: ${licence.joueur.lieuNaissance}`, 50, yPosition);
      yPosition += 15;
    }

    if (licence.joueur.nationalite) {
      doc.text(`Nationalité: ${licence.joueur.nationalite}`, 50, yPosition);
      yPosition += 15;
    }

    if (licence.joueur.sexe) {
      doc.text(`Sexe: ${licence.joueur.sexe}`, 50, yPosition);
      yPosition += 15;
    }

    if (licence.joueur.email) {
      doc.text(`Email: ${licence.joueur.email}`, 50, yPosition);
      yPosition += 15;
    }

    if (licence.joueur.telephone) {
      doc.text(`Téléphone: ${licence.joueur.telephone}`, 50, yPosition);
      yPosition += 15;
    }

    if (licence.joueur.numeroLicence) {
      doc.text(`Numéro de licence: ${licence.joueur.numeroLicence}`, 50, yPosition);
      yPosition += 15;
    }

    yPosition += 10;

    // Section CLUB
    doc.fontSize(16);
    doc.text('CLUB', 50, yPosition);
    yPosition += 20;

    doc.fontSize(12);
    doc.text('Club actuel:', 60, yPosition);
    yPosition += 15;

    if (licence.clubActuel) {
      doc.text(licence.clubActuel.nom, 60, yPosition);
      yPosition += 15;
      if (licence.clubActuel.ville) {
        doc.text(licence.clubActuel.ville, 60, yPosition);
        yPosition += 15;
      }
    } else {
      doc.text('Néant', 60, yPosition);
      yPosition += 15;
    }

    yPosition += 5;

    doc.text('Club précédent:', 60, yPosition);
    yPosition += 15;

    if (licence.clubPrecedent) {
      doc.text(licence.clubPrecedent.nom, 60, yPosition);
      yPosition += 15;
      if (licence.clubPrecedent.ville) {
        doc.text(licence.clubPrecedent.ville, 60, yPosition);
        yPosition += 15;
      }
    } else {
      doc.text('Néant', 60, yPosition);
      yPosition += 15;
    }

    yPosition += 10;

    // Photo et signature
    const imageSize = 80;
    if (licence.joueur.photo || licence.joueur.signature) {
      doc.fontSize(16);
      doc.text('PHOTO ET SIGNATURE', 50, yPosition);
      yPosition += 25;

      let currentX = 60;

      // Photo
      if (licence.joueur.photo) {
        try {
          const imageData = licence.joueur.photo;
          let imageBuffer: Buffer | null = null;

          if (imageData.startsWith('data:image')) {
            const base64Data = imageData.split(',')[1];
            if (base64Data) {
              imageBuffer = Buffer.from(base64Data, 'base64');
            }
          } else if (imageData.length > 0) {
            try {
              imageBuffer = Buffer.from(imageData, 'base64');
            } catch {
              imageBuffer = null;
            }
          }

          if (imageBuffer && imageBuffer.length > 0) {
            doc.image(imageBuffer, currentX, yPosition, {
              width: imageSize,
              height: imageSize,
              fit: [imageSize, imageSize],
            });
            doc.fontSize(10);
            doc.text('Photo', currentX, yPosition + imageSize + 5, {
              width: imageSize,
              align: 'center',
            });
            currentX += imageSize + 20;
          }
        } catch (error) {
          console.error('Erreur lors de l\'ajout de la photo:', error);
        }
      }

      // Signature
      if (licence.joueur.signature) {
        try {
          const imageData = licence.joueur.signature;
          let imageBuffer: Buffer | null = null;

          if (imageData.startsWith('data:image')) {
            const base64Data = imageData.split(',')[1];
            if (base64Data) {
              imageBuffer = Buffer.from(base64Data, 'base64');
            }
          } else if (imageData.length > 0) {
            try {
              imageBuffer = Buffer.from(imageData, 'base64');
            } catch {
              imageBuffer = null;
            }
          }

          if (imageBuffer && imageBuffer.length > 0) {
            doc.image(imageBuffer, currentX, yPosition, {
              width: imageSize,
              height: imageSize,
              fit: [imageSize, imageSize],
            });
            doc.fontSize(10);
            doc.text('Signature', currentX, yPosition + imageSize + 5, {
              width: imageSize,
              align: 'center',
            });
          }
        } catch (error) {
          console.error('Erreur lors de l\'ajout de la signature:', error);
        }
      }

      yPosition += imageSize + 20;
    }

    // Informations de la licence
    doc.fontSize(16);
    doc.text('DÉTAILS DE LA LICENCE', 50, yPosition);
    yPosition += 20;

    doc.fontSize(12);
    doc.text(`Saison: ${licence.saison.code}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Type: ${licence.type === 'NOUVEAU' ? 'Nouvelle licence' : 'Renouvellement'}`, 50, yPosition);
    yPosition += 15;

    if (licence.dateValidation) {
      const dateValidation = new Date(licence.dateValidation);
      doc.text(`Date de validation: ${dateValidation.toLocaleDateString('fr-FR')}`, 50, yPosition);
      yPosition += 15;
    }

    // Responsables
    if (licence.joueur.responsables && licence.joueur.responsables.length > 0) {
      yPosition += 10;
      doc.fontSize(16);
      doc.text('RESPONSABLES', 50, yPosition);
      yPosition += 20;

      doc.fontSize(12);
      for (const responsable of licence.joueur.responsables) {
        doc.text(`${responsable.lien}: ${responsable.prenom} ${responsable.nom}`, 60, yPosition);
        yPosition += 15;
        if (responsable.telephone) {
          doc.text(`Téléphone: ${responsable.telephone}`, 60, yPosition);
          yPosition += 15;
        }
        if (responsable.email) {
          doc.text(`Email: ${responsable.email}`, 60, yPosition);
          yPosition += 15;
        }
        yPosition += 5;
      }
    }

    doc.end();
  });
}

