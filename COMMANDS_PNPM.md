# Commandes utiles (pnpm)

Référence rapide de toutes les commandes disponibles pour le projet avec **pnpm**.

## 📦 Installation

```bash
# Installer pnpm globalement (si pas encore fait)
npm install -g pnpm

# Installer toutes les dépendances
pnpm install

# Installation rapide (sans générer le lockfile)
pnpm install --frozen-lockfile
```

## 🗄️ Base de données (Prisma)

```bash
# Générer le client Prisma
pnpm prisma generate

# Créer une migration
pnpm prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
pnpm prisma migrate deploy

# Ouvrir Prisma Studio (interface graphique)
pnpm prisma studio

# Seed la base de données
pnpm prisma db seed

# Reset complet de la base
pnpm prisma migrate reset

# Reset sans confirmation
pnpm prisma migrate reset --force

# Voir le statut des migrations
pnpm prisma migrate status

# Formater le schema.prisma
pnpm prisma format

# Valider le schéma
pnpm prisma validate
```

## 🚀 Développement

```bash
# Lancer le serveur de développement
pnpm dev

# Lancer sur un port spécifique
PORT=3001 pnpm dev

# Build pour la production
pnpm build

# Lancer en production
pnpm start

# Linter le code
pnpm lint

# Fixer automatiquement les erreurs de lint
pnpm lint:fix
```

## 🧪 Tests

```bash
# Exécuter tous les tests
pnpm test

# Tests en mode watch (re-exécute automatiquement)
pnpm test:watch

# Tests unitaires uniquement
pnpm test:unit

# Tests d'intégration uniquement
pnpm test:integration

# Tests avec rapport de couverture
pnpm test:coverage

# Ouvrir le rapport de couverture dans le navigateur
open coverage/lcov-report/index.html
```

## 🔍 Debugging

```bash
# Lancer en mode debug (avec inspect)
node --inspect-brk node_modules/.bin/next dev

# Puis ouvrir chrome://inspect dans Chrome
```

## 🧹 Maintenance

```bash
# Nettoyer les node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Nettoyer le cache Next.js
rm -rf .next

# Nettoyer tout (base incluse)
rm -rf node_modules .next coverage prisma/dev.db pnpm-lock.yaml
pnpm install
pnpm prisma generate

# Nettoyer le cache pnpm
pnpm store prune

# Vérifier l'intégrité des dépendances
pnpm audit
```

## 📊 Prisma Studio

```bash
# Interface graphique pour gérer la base
pnpm prisma studio
# Accessible sur http://localhost:5555
```

## 🔐 Générer des secrets

```bash
# Générer un JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Générer un UUID
node -e "console.log(require('crypto').randomUUID())"
```

## 🌐 API Testing (curl)

### Créer une inscription

```bash
curl -X POST http://localhost:3000/api/inscriptions \
  -H "Content-Type: application/json" \
  -H "x-recaptcha-token: test-token" \
  -d '{
    "type": "NOUVEAU",
    "saisonId": "VOTRE-UUID-SAISON",
    "joueur": {
      "nom": "Test",
      "prenom": "User",
      "email": "test@example.com",
      "dateNaissance": "2010-01-01",
      "nationalite": "Française",
      "sexe": "M"
    },
    "responsables": [{
      "nom": "Parent",
      "prenom": "Test",
      "telephone": "0612345678",
      "lien": "PERE"
    }]
  }'
```

### Récupérer une licence

```bash
curl "http://localhost:3000/api/inscriptions?accessKey=VOTRE-ACCESS-KEY"
```

### Vérifier le statut

```bash
curl "http://localhost:3000/api/inscriptions/statut?accessKey=VOTRE-ACCESS-KEY"
```

## 📝 Git

```bash
# Vérifier le statut
git status

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Description du commit"

# Push
git push origin main

# Voir l'historique
git log --oneline

# Créer une branche
git checkout -b feature/nom-feature

# Fusionner une branche
git checkout main
git merge feature/nom-feature
```

## 🚢 Déploiement

### Vercel

```bash
# Installer Vercel CLI
pnpm add -g vercel

# Se connecter
vercel login

# Déployer en production
vercel --prod

# Déployer en preview
vercel
```

### Docker

```bash
# Build l'image
docker build -t korfball-api .

# Lancer le container
docker run -p 3000:3000 --env-file .env korfball-api

# Voir les containers en cours
docker ps

# Voir les logs
docker logs <container-id>

# Arrêter un container
docker stop <container-id>
```

## 🔧 Variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables
nano .env
# ou
code .env
```

## 📈 Monitoring

```bash
# Voir les logs en temps réel (en production avec PM2)
pm2 logs

# Redémarrer l'application
pm2 restart korfball-api

# Voir le statut
pm2 status

# Monitorer les performances
pm2 monit
```

## 🔎 Trouver et remplacer

```bash
# Trouver tous les fichiers contenant un texte
grep -r "texte_à_chercher" src/

# Remplacer dans tous les fichiers
find src/ -type f -name "*.ts" -exec sed -i '' 's/ancien/nouveau/g' {} +
```

## 💾 Backup & Restore

```bash
# Backup de la base PostgreSQL
pg_dump -U user -d korfball > backup.sql

# Restore
psql -U user -d korfball < backup.sql

# Backup avec timestamp
pg_dump -U user -d korfball > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🎨 Code Quality

```bash
# Formatter avec Prettier (si installé)
pnpm exec prettier --write "src/**/*.{ts,tsx,js,jsx}"

# Analyser le code
pnpm lint

# Vérifier les types TypeScript
pnpm exec tsc --noEmit
```

## 📦 Gestion des dépendances (pnpm)

```bash
# Ajouter une dépendance
pnpm add nom-package

# Ajouter une dépendance de dev
pnpm add -D nom-package

# Ajouter une dépendance globale
pnpm add -g nom-package

# Retirer une dépendance
pnpm remove nom-package

# Mettre à jour toutes les dépendances
pnpm update

# Mettre à jour une dépendance spécifique
pnpm update nom-package

# Mettre à jour à la dernière version
pnpm update nom-package --latest

# Voir les dépendances obsolètes
pnpm outdated

# Voir l'arbre des dépendances
pnpm list

# Voir l'arbre des dépendances (profondeur 1)
pnpm list --depth 1

# Auditer les vulnérabilités
pnpm audit

# Fixer automatiquement les vulnérabilités
pnpm audit --fix

# Voir l'utilisation du disque par pnpm
pnpm store status

# Nettoyer le store pnpm
pnpm store prune
```

## 🌍 Environnements

```bash
# Développement
NODE_ENV=development pnpm dev

# Test
NODE_ENV=test pnpm test

# Production
NODE_ENV=production pnpm start
```

## 📊 Performance

```bash
# Analyser la taille du bundle
pnpm build
pnpm exec next build --profile

# Analyser avec source-map-explorer (si installé)
pnpm add -g source-map-explorer
source-map-explorer '.next/static/**/*.js'
```

## 🔒 Sécurité

```bash
# Audit de sécurité
pnpm audit

# Audit avec rapport détaillé JSON
pnpm audit --json > security-audit.json

# Vérifier les certificats SSL
openssl s_client -connect domaine.com:443 -showcerts
```

## 🎯 Quick Shortcuts (pnpm)

```bash
# Tout nettoyer et réinstaller
rm -rf node_modules .next coverage pnpm-lock.yaml && pnpm install && pnpm prisma generate

# Reset complet avec seed
pnpm prisma migrate reset --force && pnpm prisma db seed

# Dev avec logs détaillés
DEBUG=* pnpm dev

# Build + Test + Start
pnpm build && pnpm test && pnpm start

# Installer et regénérer Prisma en une commande
pnpm install && pnpm prisma generate
```

## 📚 Documentation

```bash
# Générer la doc TypeScript (si configuré)
pnpm exec typedoc

# Lire la doc localement
open docs/index.html
```

## 💡 Tips pnpm

```bash
# Exécuter un script npm
pnpm run <script>

# Exécuter un binaire local
pnpm exec <command>

# Installer depuis un fichier package.json existant
pnpm install --frozen-lockfile

# Voir tous les scripts disponibles
pnpm run

# Utiliser une version spécifique de node avec pnpm
pnpm env use --global 20

# Voir la version de pnpm
pnpm --version

# Mettre à jour pnpm
pnpm add -g pnpm

# Voir la configuration pnpm
pnpm config list

# Définir une config pnpm
pnpm config set store-dir /path/to/store
```

## 🆘 Dépannage

### Port 3000 déjà utilisé

```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
PORT=3001 pnpm dev
```

### Problème de permissions

```bash
# Réparer les permissions (pnpm store)
sudo chown -R $USER:$USER ~/.local/share/pnpm
```

### Base de données verrouillée (SQLite)

```bash
# Fermer tous les processus utilisant la DB
rm prisma/dev.db-journal
```

### Cache corrompue

```bash
# Nettoyer tous les caches
rm -rf node_modules/.cache
rm -rf .next/cache
pnpm store prune
```

### Erreur "Peer dependencies"

```bash
# Installer en ignorant les peer dependencies
pnpm install --no-strict-peer-dependencies

# Ou les installer automatiquement
pnpm install --shamefully-hoist
```

### Problème avec le lockfile

```bash
# Supprimer et recréer le lockfile
rm pnpm-lock.yaml
pnpm install
```

## 🌟 Avantages de pnpm

- **Plus rapide** : Installation 2x plus rapide que npm
- **Moins d'espace disque** : Partage les dépendances entre projets
- **Strict** : Évite les dépendances fantômes
- **Déterministe** : Lockfile plus fiable
- **Monorepo friendly** : Excellent support des workspaces

## 📖 Ressources pnpm

- Documentation officielle : https://pnpm.io
- Migration depuis npm : https://pnpm.io/migration
- CLI Commands : https://pnpm.io/cli/add
- Configuration : https://pnpm.io/npmrc
