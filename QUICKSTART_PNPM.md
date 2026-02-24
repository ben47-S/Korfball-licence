# Guide de démarrage rapide (pnpm)

Ce guide vous permet de démarrer rapidement avec le système d'inscription de licences en utilisant **pnpm**.

## 📋 Prérequis

- Node.js 20+ installé
- pnpm installé (`npm install -g pnpm`)
- PostgreSQL installé et en cours d'exécution

## 🚀 Installation (5 minutes)

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configurer l'environnement

Copier le fichier d'exemple :

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```bash
# Base de données (obligatoire)
DATABASE_URL="postgresql://user:password@localhost:5432/korfball"

# JWT (obligatoire)
JWT_SECRET="votre-secret-super-securise"

# Email (optionnel en dev)
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="noreply@korfball.com"

# CAPTCHA (optionnel en dev - clés de test fournies)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
RECAPTCHA_SECRET_KEY="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialiser la base de données

```bash
# Appliquer les migrations
pnpm prisma migrate dev

# Seed les données initiales (optionnel)
pnpm prisma db seed
```

### 4. Lancer le serveur de développement

```bash
pnpm dev
```

L'application est maintenant accessible sur `http://localhost:3000` 🎉

## 🧪 Tester l'API

### Test basique avec curl

```bash
curl -X POST http://localhost:3000/api/inscriptions \
  -H "Content-Type: application/json" \
  -H "x-recaptcha-token: test-token" \
  -d '{
    "type": "NOUVEAU",
    "saisonId": "VOTRE-SAISON-ID",
    "joueur": {
      "nom": "Martin",
      "prenom": "Lucas",
      "email": "lucas@test.com",
      "dateNaissance": "2010-05-20",
      "nationalite": "Française",
      "sexe": "M"
    },
    "responsables": [{
      "nom": "Martin",
      "prenom": "Sophie",
      "email": "sophie@test.com",
      "lien": "MERE"
    }]
  }'
```

### Réponse attendue

```json
{
  "success": true,
  "message": "Inscription réussie !",
  "accessKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "emailSent": false
}
```

## 📝 Créer une saison de test

Avant de tester, créer une saison active :

```bash
pnpm prisma studio
```

Ou via SQL :

```sql
INSERT INTO "Saison" (id, code, debut, fin, "inscriptionDebut", "inscriptionFin")
VALUES (
  gen_random_uuid(),
  '2024-2025',
  '2024-09-01',
  '2025-06-30',
  '2024-06-01',
  '2024-09-30'
);
```

## 🔧 Modes de développement

### Mode minimal (sans email ni CAPTCHA)

```bash
# .env
DATABASE_URL="..."
JWT_SECRET="..."
# Ne pas définir RESEND_API_KEY ni RECAPTCHA_SECRET_KEY
```

- Les emails seront loggés dans la console
- Le CAPTCHA sera bypassé automatiquement

### Mode complet (avec email et CAPTCHA)

1. **Configurer Resend** :
   - Créer un compte sur https://resend.com
   - Copier l'API key
   - Ajouter dans `.env` : `RESEND_API_KEY="re_xxxxx"`

2. **Configurer reCAPTCHA** :
   - Créer un compte sur https://www.google.com/recaptcha/admin
   - Choisir reCAPTCHA v3
   - Copier les clés dans `.env`

## 🧪 Tests

```bash
# Tous les tests
pnpm test

# Tests unitaires uniquement
pnpm test:unit

# Tests d'intégration uniquement
pnpm test:integration

# Tests avec couverture
pnpm test:coverage

# Tests en mode watch
pnpm test:watch
```

## 🗄️ Commandes Prisma avec pnpm

```bash
# Générer le client Prisma
pnpm prisma generate

# Créer une migration
pnpm prisma migrate dev --name nom_migration

# Appliquer les migrations en production
pnpm prisma migrate deploy

# Ouvrir Prisma Studio
pnpm prisma studio

# Reset complet de la base
pnpm prisma migrate reset

# Voir le statut des migrations
pnpm prisma migrate status

# Seed la base de données
pnpm prisma db seed
```

## 🚀 Développement

```bash
# Lancer le serveur de développement
pnpm dev

# Build pour la production
pnpm build

# Lancer en production
pnpm start

# Linter le code
pnpm lint

# Fixer automatiquement les erreurs de lint
pnpm lint:fix
```

## 🛟 Aide rapide

### Erreur : "Prisma Client not generated"

```bash
pnpm prisma generate
```

### Erreur : "Database connection failed"

Vérifier que PostgreSQL est lancé :

```bash
# macOS/Linux
sudo service postgresql status

# Windows
# Vérifier dans Services
```

### Reset complet de la base

```bash
pnpm prisma migrate reset
pnpm prisma db seed
```

### Rate limiting trop strict en dev

Modifier dans `src/lib/rate-limiter.ts` :

```typescript
export const INSCRIPTION_RATE_LIMIT = {
  maxRequests: 100,  // Au lieu de 5
  windowMs: 60 * 1000, // 1 minute au lieu d'1 heure
};
```

### Nettoyer complètement le projet

```bash
# Supprimer node_modules et le lock file
rm -rf node_modules pnpm-lock.yaml

# Réinstaller
pnpm install

# Regénérer Prisma
pnpm prisma generate
```

## 📖 Documentation complète

- **API** : [INSCRIPTION_API.md](./INSCRIPTION_API.md)
- **Sécurité** : [SECURITY_FEATURES.md](./SECURITY_FEATURES.md)
- **Tests** : [TESTING.md](./TESTING.md)
- **Commandes pnpm** : [COMMANDS_PNPM.md](./COMMANDS_PNPM.md)
- **Endpoints** : [endpoints.md](./endpoints.md)

## 🔥 Commandes rapides pnpm

```bash
# Tout nettoyer et réinstaller
rm -rf node_modules .next coverage && pnpm install && pnpm prisma generate

# Reset complet avec seed
pnpm prisma migrate reset --force && pnpm prisma db seed

# Build + Test + Start
pnpm build && pnpm test && pnpm start

# Ajouter une dépendance
pnpm add nom-package

# Ajouter une dépendance de dev
pnpm add -D nom-package

# Mettre à jour les dépendances
pnpm update

# Voir les dépendances obsolètes
pnpm outdated
```

## 🆘 Support

En cas de problème :

1. Vérifier les logs dans la console
2. Consulter la documentation
3. Créer une issue GitHub

## ✅ Checklist de démarrage

- [ ] pnpm installé (`npm install -g pnpm`)
- [ ] Node.js 20+ installé
- [ ] PostgreSQL installé et en cours d'exécution
- [ ] Dépendances installées (`pnpm install`)
- [ ] Fichier `.env` configuré
- [ ] Migrations appliquées (`pnpm prisma migrate dev`)
- [ ] Saison créée dans la base
- [ ] Serveur lancé (`pnpm dev`)
- [ ] Test API réussi (curl ou Postman)

Vous êtes prêt avec pnpm ! 🚀
