# Guide de démarrage rapide

Ce guide vous permet de démarrer rapidement avec le système d'inscription de licences.

## 📋 Prérequis

- Node.js 20+ installé
- PostgreSQL installé et en cours d'exécution
- npm ou yarn

## 🚀 Installation (5 minutes)

### 1. Installer les dépendances

```bash
npm install
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
npx prisma migrate dev

# Seed les données initiales (optionnel)
npx prisma db seed
```

### 4. Lancer le serveur de développement

```bash
npm run dev
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
npx prisma studio
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

## 📚 Prochaines étapes

### Développer le frontend

Créer un formulaire d'inscription React/Next.js :

```tsx
// src/app/inscription/page.tsx
'use client';

import { useState } from 'react';

export default function InscriptionPage() {
  const [formData, setFormData] = useState({ /* ... */ });
  const [accessKey, setAccessKey] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Générer le token CAPTCHA
    const token = await grecaptcha.execute(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      { action: 'inscription' }
    );

    const response = await fetch('/api/inscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recaptcha-token': token,
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success) {
      setAccessKey(data.accessKey);
      // Afficher le message de succès
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire d'inscription */}
    </form>
  );
}
```

### Tester

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tous les tests avec couverture
npm run test:coverage
```

### Déployer

#### Vercel (recommandé)

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel
```

Configurer les variables d'environnement dans Vercel Dashboard.

#### Docker

```bash
# Build
docker build -t korfball-api .

# Run
docker run -p 3000:3000 --env-file .env korfball-api
```

## 🛟 Aide rapide

### Erreur : "Prisma Client not generated"

```bash
npx prisma generate
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
npx prisma migrate reset
npx prisma db seed
```

### Rate limiting trop strict en dev

Modifier dans `src/lib/rate-limiter.ts` :

```typescript
export const INSCRIPTION_RATE_LIMIT = {
  maxRequests: 100,  // Au lieu de 5
  windowMs: 60 * 1000, // 1 minute au lieu d'1 heure
};
```

## 📖 Documentation complète

- **API** : [INSCRIPTION_API.md](./INSCRIPTION_API.md)
- **Sécurité** : [SECURITY_FEATURES.md](./SECURITY_FEATURES.md)
- **Tests** : [TESTING.md](./TESTING.md)
- **Endpoints** : [endpoints.md](./endpoints.md)

## 🆘 Support

En cas de problème :

1. Vérifier les logs dans la console
2. Consulter la documentation
3. Créer une issue GitHub

## ✅ Checklist de démarrage

- [ ] Node.js 20+ installé
- [ ] PostgreSQL installé et en cours d'exécution
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` configuré
- [ ] Migrations appliquées (`npx prisma migrate dev`)
- [ ] Saison créée dans la base
- [ ] Serveur lancé (`npm run dev`)
- [ ] Test API réussi (curl ou Postman)

Vous êtes prêt ! 🚀
