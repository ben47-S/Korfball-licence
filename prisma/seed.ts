import 'dotenv/config';
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { 
  Role, 
  TypeLicence, 
  StatutLicence, 
  LienResponsable, 
  StatutPaiement 
} from "../generated/prisma/enums";

// Utilise l'adapter PrismaPg comme dans prisma.ts
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Début du seeding...");

  // 1. Création d'un Utilisateur (Admin)
  const admin = await prisma.user.upsert({
    where: { email: "admin@federation.ci" },
    update: {},
    create: {
      nom: "Bakayoko",
      prenom: "Moussa",
      email: "admin@federation.ci",
      role: Role.ADMIN,
      telephone: "+2250102030405",
    },
  });

  // 2. Création d'une Saison
  const saison = await prisma.saison.upsert({
    where: { code: "2024-2025" },
    update: {},
    create: {
      code: "2024-2025",
      debut: new Date("2024-09-01"),
      fin: new Date("2025-06-30"),
      inscriptionDebut: new Date("2024-08-01"),
      inscriptionFin: new Date("2024-12-31"),
    },
  });

  // 3. Création d'un Club
  const club = await prisma.club.create({
    data: {
      nom: "ASEC Mimosas",
      ville: "Abidjan",
      pays: "Côte d'Ivoire",
    },
  });

  // 4. Création d'un Joueur avec Responsable et Licence
  const joueur = await prisma.joueur.create({
    data: {
      nom: "Kouassi",
      prenom: "Jean",
      telephone: "+2250102030405",
      dateNaissance: new Date("2010-05-15"),
      lieuNaissance: "Bouaké",
      nationalite: "Ivoirienne",
      sexe: "M",
      numeroLicence: "FIK-2024-100245", // Format: FIK-YYYY-XXXXXX
      responsables: {
        create: {
          nom: "Kouassi",
          prenom: "Marc",
          telephone: "+2250102030406",
          lien: LienResponsable.PERE,
        },
      },
      licences: {
        create: {
          saisonId: saison.id,
          clubActuelId: club.id,
          type: TypeLicence.NOUVEAU,
          statut: StatutLicence.VALIDEE,
          paiement: {
            create: {
              transactionId: "TRX-998877",
              reference: "REF-INT-001",
              montant: 5000,
              statut: StatutPaiement.VALIDE,
              paidAt: new Date(),
            },
          },
        },
      },
    },
  });

  console.log({
    admin: admin.email,
    saison: saison.code,
    club: club.nom,
    joueur: `${joueur.prenom} ${joueur.nom}`
  });
  
  console.log("Seeding terminé avec succès !");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });