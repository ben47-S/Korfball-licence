import 'dotenv/config'
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Configuration de l'adaptateur PostgreSQL pour Prisma 7
const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Initialisation du client avec l'adaptateur
const prisma = new PrismaClient({ adapter });

// ==============================
// DATA SEEDS
// ==============================

const userData: Prisma.UserCreateInput[] = [
  {
    nom: "Admin",
    prenom: "System",
    email: "admin@korfball.com",
    telephone: "+33123456789",
    role: "ADMIN",
  },
  {
    nom: "Agent",
    prenom: "Test",
    email: "agent@korfball.com",
    telephone: "+33198765432",
    role: "AGENT",
  },
];

const clubData: Prisma.ClubCreateInput[] = [
  { nom: "ASK Korfball", ville: "Paris", pays: "France" },
  { nom: "KB Lyon", ville: "Lyon", pays: "France" },
  { nom: "Korfball Marseille", ville: "Marseille", pays: "France" },
];

const saisonData: Prisma.SaisonCreateInput[] = [
  {
    code: "2024-2025",
    debut: new Date("2024-09-01"),
    fin: new Date("2025-06-30"),
    inscriptionDebut: new Date("2024-08-01"),
    inscriptionFin: new Date("2024-09-30"),
  },
];

const joueurData: Prisma.JoueurCreateInput[] = [
  {
    nom: "Dupont",
    prenom: "Jean",
    dateNaissance: new Date("2005-03-15"),
    lieuNaissance: "Paris",
    nationalite: "Française",
    sexe: "M",
  },
  {
    nom: "Martin",
    prenom: "Marie",
    dateNaissance: new Date("2006-07-22"),
    lieuNaissance: "Lyon",
    nationalite: "Française",
    sexe: "F",
  },
];

// ==============================
// SEED FUNCTION
// ==============================

async function main() {
  try {
    console.log("🌱 Début du seeding PostgreSQL...");

    // 1. Users (upsert pour éviter les doublons sur l'email)
    for (const user of userData) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      });
    }
    console.log("✅ Utilisateurs traités");

    // 2. Clubs
    const clubs = await Promise.all(
      clubData.map((club) => prisma.club.create({ data: club }))
    );
    console.log(`✅ ${clubs.length} clubs créés`);

    // 3. Saisons
    const saisons = await Promise.all(
      saisonData.map((saison) => prisma.saison.create({ data: saison }))
    );
    console.log(`✅ Saisons créées`);

    // 4. Joueurs & Licences
    const saisonActuelle = saisons[0];
    for (let i = 0; i < joueurData.length; i++) {
      const joueur = await prisma.joueur.create({
        data: {
          ...joueurData[i],
          responsables: {
            create: [{ nom: joueurData[i].nom, prenom: "Parent", lien: "PERE" }]
          },
          licences: {
            create: {
              saisonId: saisonActuelle.id,
              clubActuelId: clubs[i % clubs.length].id,
              numeroLicence: 2024000 + i,
              type: "NOUVEAU",
              statut: "BROUILLON",
              paiement: {
                create: {
                  provider: "CINETPAY",
                  transactionId: `TXN_${Date.now()}_${i}`,
                  reference: `REF_${2024000 + i}`,
                  montant: 50000,
                  devise: "XOF",
                  statut: "EN_ATTENTE",
                }
              }
            }
          }
        }
      });
      console.log(`   ✓ Joueur & Licence créés: ${joueur.prenom}`);
    }

    console.log("\n✨ Seeding PostgreSQL terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end(); // Fermeture du pool de connexion pg
  }
}

main();