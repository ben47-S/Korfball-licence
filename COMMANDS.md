# Commandes utiles

Référence rapide de toutes les commandes disponibles pour le projet.

## 📦 Installation

```bash
# Installer toutes les dépendances
npm install

# Ou avec yarn
yarn install
```

## 🗄️ Base de données

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations
npx prisma migrate deploy

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Seed la base de données
npx prisma db seed

# Reset complet de la base
npx prisma migrate reset

# Voir le statut des migrations
npx prisma migrate status
```

## 🚀 Développement

```bash
# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Lancer en production
npm start

# Linter le code
npm run lint

# Fixer automatiquement les erreurs de lint
npm run lint:fix
```

## 🧪 Tests

```bash
# Exécuter tous les tests
npm test

# Tests en mode watch (re-exécute automatiquement)
npm run test:watch

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests avec rapport de couverture
npm run test:coverage

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
rm -rf node_modules package-lock.json
npm install

# Nettoyer le cache Next.js
rm -rf .next

# Nettoyer tout (base incluse)
rm -rf node_modules .next coverage prisma/dev.db
npm install
```

## 📊 Prisma Studio

```bash
# Interface graphique pour gérer la base
npx prisma studio
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
npm install -g vercel

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
npx prettier --write "src/**/*.{ts,tsx,js,jsx}"

# Analyser le code
npm run lint

# Vérifier les types TypeScript
npx tsc --noEmit
```

## 📦 Gestion des dépendances

```bash
# Voir les dépendances obsolètes
npm outdated

# Mettre à jour toutes les dépendances
npm update

# Mettre à jour une dépendance spécifique
npm install package@latest

# Voir l'arbre des dépendances
npm list

# Auditer les vulnérabilités
npm audit

# Fixer automatiquement les vulnérabilités
npm audit fix
```

## 🌍 Environnements

```bash
# Développement
NODE_ENV=development npm run dev

# Test
NODE_ENV=test npm test

# Production
NODE_ENV=production npm start
```

## 📊 Performance

```bash
# Analyser la taille du bundle
npm run build
npx next build --profile

# Analyser avec source-map-explorer
npm install -g source-map-explorer
source-map-explorer '.next/static/**/*.js'
```

## 🔒 Sécurité

```bash
# Audit de sécurité
npm audit

# Audit avec rapport détaillé
npm audit --json > security-audit.json

# Vérifier les certificats SSL
openssl s_client -connect domaine.com:443 -showcerts
```

## 🎯 Quick Shortcuts

```bash
# Tout nettoyer et réinstaller
rm -rf node_modules .next coverage && npm install && npx prisma generate

# Reset complet avec seed
npx prisma migrate reset --force && npx prisma db seed

# Dev avec logs détaillés
DEBUG=* npm run dev

# Build + Test + Start
npm run build && npm test && npm start
```

## 📚 Documentation

```bash
# Générer la doc TypeScript (si configuré)
npx typedoc

# Lire la doc localement
open docs/index.html
```

## 💡 Tips

- Utiliser `npm run` pour voir tous les scripts disponibles
- Ajouter `--help` après une commande pour voir les options
- Utiliser `npx` pour exécuter des packages sans les installer globalement
- Créer des alias dans `.bashrc` ou `.zshrc` pour les commandes fréquentes

## 🆘 Dépannage

### Port 3000 déjà utilisé

```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
PORT=3001 npm run dev
```

### Problème de permissions

```bash
# Réparer les permissions npm
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER node_modules
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
npm cache clean --force
```
