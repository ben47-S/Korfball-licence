-- CreateEnum
CREATE TYPE "TypeLicence" AS ENUM ('NOUVEAU', 'RENOUVELLEMENT');

-- CreateEnum
CREATE TYPE "StatutLicence" AS ENUM ('BROUILLON', 'SOUMISE', 'VALIDEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'VALIDE', 'ECHOUE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "LienResponsable" AS ENUM ('PERE', 'MERE', 'TUTEUR');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Joueur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "lieuNaissance" TEXT,
    "nationalite" TEXT,
    "sexe" TEXT,
    "photo" TEXT,
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Joueur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsable" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "lien" "LienResponsable" NOT NULL,
    "joueurId" INTEGER NOT NULL,

    CONSTRAINT "Responsable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT,
    "pays" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Saison" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "inscriptionDebut" TIMESTAMP(3) NOT NULL,
    "inscriptionFin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Saison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Licence" (
    "id" SERIAL NOT NULL,
    "joueurId" INTEGER NOT NULL,
    "saisonId" INTEGER NOT NULL,
    "clubPrecedentId" INTEGER,
    "clubActuelId" INTEGER,
    "numeroLicence" INTEGER,
    "type" "TypeLicence" NOT NULL,
    "statut" "StatutLicence" NOT NULL DEFAULT 'BROUILLON',
    "dateValidation" TIMESTAMP(3),
    "commentaireAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Licence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CINETPAY',
    "transactionId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "licenceId" INTEGER NOT NULL,
    "paymentUrl" TEXT,
    "rawResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Saison_code_key" ON "Saison"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Licence_numeroLicence_key" ON "Licence"("numeroLicence");

-- CreateIndex
CREATE UNIQUE INDEX "Licence_joueurId_saisonId_key" ON "Licence"("joueurId", "saisonId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_transactionId_key" ON "Paiement"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_reference_key" ON "Paiement"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_licenceId_key" ON "Paiement"("licenceId");

-- AddForeignKey
ALTER TABLE "Responsable" ADD CONSTRAINT "Responsable_joueurId_fkey" FOREIGN KEY ("joueurId") REFERENCES "Joueur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licence" ADD CONSTRAINT "Licence_joueurId_fkey" FOREIGN KEY ("joueurId") REFERENCES "Joueur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licence" ADD CONSTRAINT "Licence_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licence" ADD CONSTRAINT "Licence_clubPrecedentId_fkey" FOREIGN KEY ("clubPrecedentId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licence" ADD CONSTRAINT "Licence_clubActuelId_fkey" FOREIGN KEY ("clubActuelId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_licenceId_fkey" FOREIGN KEY ("licenceId") REFERENCES "Licence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
