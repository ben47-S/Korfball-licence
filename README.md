# 🏀 Licence Korfball

Application web de gestion des licences de korfball. Permet aux joueurs de demander des licences et aux administrateurs de les gérer.

## 🚀 Stack Technique

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Database**: Prisma ORM (PostgreSQL/SQLite)
- **Payment**: CinetPay (intégration en cours)

## 📋 Fonctionnalités

- ✅ Gestion des joueurs
- ✅ Gestion des licences (NOUVEAU / RENOUVELLEMENT)
- ✅ Gestion des clubs
- ✅ Gestion des saisons
- ✅ Gestion des paiements
- ✅ Interface d'administration

## 🛠️ Installation

### Prérequis
- Node.js >= 18
- pnpm (ou npm/yarn)

### Étapes

```bash
# 1. Cloner le repository
git clone <url-du-repo>
cd licencekorfball

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Puis éditer .env.local avec tes credentials

# 4. Générer le client Prisma
pnpm prisma generate

# 5. Exécuter les migrations
pnpm prisma migrate deploy

# 6. Seeder la base de données (optionnel)
pnpm prisma db seed

# 7. Lancer le serveur de développement
pnpm dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## 📁 Structure du projet

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── layout.tsx         # Layout global
│   ├── page.tsx           # Page d'accueil
│   ├── dashboard/         # Admin dashboard
│   ├── joueurs/           # Gestion joueurs
│   ├── licences/          # Gestion licences
│   └── api/               # Routes API
├── components/            # Composants React réutilisables
├── lib/                   # Utilitaires (Prisma, etc.)
├── types/                 # Types TypeScript
└── styles/                # Styles globaux
```

## 🗄️ Schéma de données

- **User**: Administrateurs et agents
- **Joueur**: Profils des joueurs
- **Responsable**: Parents/tuteurs des joueurs
- **Licence**: Demandes de licences
- **Club**: Clubs de korfball
- **Saison**: Périodes d'inscription
- **Paiement**: Transactions CinetPay

## 📝 Variables d'environnement

Voir `.env.example` pour la liste complète des variables requises.

## 🔄 Commandes utiles

```bash
pnpm dev              # Serveur de développement
pnpm build            # Build production
pnpm start            # Démarrer en production
pnpm lint             # Vérifier le code
pnpm lint:fix         # Corriger les erreurs de lint
```

## 📜 License

MIT
