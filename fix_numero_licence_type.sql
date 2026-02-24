-- Script SQL pour changer le type de numeroLicence de INTEGER à TEXT
-- À exécuter manuellement dans votre base de données PostgreSQL

-- 1. Supprimer l'index unique existant
DROP INDEX IF EXISTS "Joueur_numeroLicence_key";

-- 2. Convertir les valeurs existantes au format FIK-YYYY-XXXXXX (6 chiffres)
-- Si un numéro existe, on le convertit au format FIK-année-numéro
UPDATE "Joueur"
SET "numeroLicence" = 'FIK-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD("numeroLicence"::text, 6, '0')
WHERE "numeroLicence" IS NOT NULL;

-- 3. Changer le type de colonne de INTEGER à TEXT
ALTER TABLE "Joueur" 
ALTER COLUMN "numeroLicence" TYPE TEXT USING "numeroLicence"::TEXT;

-- 4. Recréer l'index unique
CREATE UNIQUE INDEX "Joueur_numeroLicence_key" ON "Joueur"("numeroLicence") WHERE "numeroLicence" IS NOT NULL;

