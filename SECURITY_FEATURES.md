# Fonctionnalités de Sécurité

Ce document détaille toutes les mesures de sécurité implémentées dans l'API d'inscription.

## Vue d'ensemble

L'API d'inscription intègre plusieurs couches de sécurité pour protéger contre les abus et garantir l'intégrité des données :

1. **Rate Limiting** - Limite les tentatives d'inscription par IP
2. **CAPTCHA** - Détecte et bloque les bots
3. **Validation** - Validation stricte des données avec Zod
4. **Isolation des données** - Retourne uniquement l'accessKey

## 1. Rate Limiting

### Implémentation

- **Fichier**: `src/lib/rate-limiter.ts`
- **Limite par défaut**: 5 inscriptions par heure par IP
- **Stockage**: En mémoire (Map JavaScript)

### Configuration

```typescript
export const INSCRIPTION_RATE_LIMIT = {
  maxRequests: 5,        // Nombre maximum de requêtes
  windowMs: 60 * 60 * 1000, // Fenêtre de temps (1 heure)
};
```

### Headers de réponse

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1642089600000
```

### Erreur 429 - Trop de requêtes

```json
{
  "message": "Trop de tentatives d'inscription. Réessayez dans 45 minutes.",
  "retryAfter": 2700
}
```

### Amélioration pour la production

Pour un environnement haute disponibilité, considérer **Redis** ou **Upstash Rate Limit** :

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
});
```

### Détection de l'IP

Le rate limiter détecte l'IP via les headers suivants (dans l'ordre) :

1. `x-forwarded-for` (proxies, load balancers)
2. `x-real-ip` (Nginx)
3. Fallback: `"unknown"`

### Contournement possible

- **VPN/Proxy** : Un utilisateur peut changer d'IP
- **Solution** : Combiner avec CAPTCHA et validation email

## 2. Google reCAPTCHA v3

### Implémentation

- **Fichier**: `src/lib/captcha.ts`
- **Version**: reCAPTCHA v3 (sans interaction utilisateur)
- **Score minimum**: 0.5 (configurable)

### Configuration

```bash
# .env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="votre-cle-publique"
RECAPTCHA_SECRET_KEY="votre-cle-secrete"
```

### Inscription

1. Créer un compte sur [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Choisir **reCAPTCHA v3**
3. Ajouter votre domaine
4. Copier les clés dans `.env`

### Utilisation côté client

```tsx
// Dans votre formulaire React
import { useEffect } from 'react';

function InscriptionForm() {
  useEffect(() => {
    // Charger le script reCAPTCHA
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    document.body.appendChild(script);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Générer le token CAPTCHA
    const token = await grecaptcha.execute(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      { action: 'inscription' }
    );

    // Envoyer avec le header
    const response = await fetch('/api/inscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recaptcha-token': token,
      },
      body: JSON.stringify(formData),
    });
  };
}
```

### Scores et seuils

```typescript
export const CAPTCHA_SCORES = {
  STRICT: 0.7,      // Actions très sensibles
  NORMAL: 0.5,      // Inscriptions
  PERMISSIVE: 0.3,  // Formulaires de contact
};
```

- **1.0** : Très certainement humain
- **0.5** : Comportement neutre (seuil recommandé)
- **0.0** : Très certainement un bot

### Mode développement

Sans `RECAPTCHA_SECRET_KEY` configurée, le CAPTCHA est **automatiquement bypassé** en développement :

```typescript
if (process.env.NODE_ENV === 'development' && !process.env.RECAPTCHA_SECRET_KEY) {
  console.warn('[CAPTCHA] Mode développement - CAPTCHA bypassé');
  return { success: true, score: 1.0 };
}
```

### Erreurs possibles

```json
{
  "message": "Token CAPTCHA manquant"
}
```

```json
{
  "message": "Score CAPTCHA trop bas - comportement suspect détecté"
}
```

```json
{
  "message": "Action CAPTCHA incorrecte"
}
```

## 3. Validation des données (Zod)

### Implémentation

- **Fichier**: `src/lib/validators/inscription.schema.ts`
- **Librairie**: Zod
- **Validation**: Côté serveur uniquement (jamais faire confiance au client)

### Règles de validation

#### Joueur

- `nom`: Min 2 caractères, max 100
- `prenom`: Min 2 caractères, max 100
- `email`: Format email valide (optionnel)
- `dateNaissance`: Date valide, dans le passé
- `telephone`: Min 8 caractères (optionnel)
- `sexe`: 'M', 'F', ou 'Autre' (optionnel)

#### Responsables (pour mineurs < 18 ans)

- Minimum 1, maximum 3
- `lien`: PERE, MERE, ou TUTEUR
- Champs similaires au joueur

#### Validation croisée

1. **RENOUVELLEMENT nécessite clubPrecedentId**
   ```typescript
   if (data.type === 'RENOUVELLEMENT' && !data.clubPrecedentId) {
     throw new Error('Club précédent obligatoire');
   }
   ```

2. **Mineur nécessite des responsables**
   ```typescript
   const age = calculateAge(data.joueur.dateNaissance);
   if (age < 18 && !data.responsables?.length) {
     throw new Error('Responsables obligatoires pour les mineurs');
   }
   ```

### Erreurs de validation

```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "joueur.email",
      "message": "Email invalide"
    },
    {
      "field": "responsables",
      "message": "Au moins un responsable est requis pour les joueurs mineurs"
    }
  ]
}
```

## 4. Isolation des données

### Principe

Ne **jamais exposer** plus de données que nécessaire dans les réponses API.

### Ce qui est retourné

```json
{
  "success": true,
  "message": "Inscription réussie !",
  "accessKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "emailSent": true
}
```

### Ce qui n'est PAS retourné

- ❌ ID de la licence
- ❌ ID du joueur
- ❌ Données complètes du joueur
- ❌ Informations de la base de données

### AccessKey

- **Format**: UUID v4
- **Génération**: Automatique par Prisma (`@default(uuid())`)
- **Unicité**: Index unique en base de données
- **Sécurité**:
  - Impossible à deviner (2^122 combinaisons)
  - Aucune information exploitable
  - Révocable en cas de compromission

### Consultation de la licence

L'utilisateur peut uniquement consulter sa licence avec l'accessKey :

```
GET /api/inscriptions?accessKey=xxx
```

Aucune autre donnée n'est nécessaire pour accéder à sa licence.

## 5. Transactions atomiques

### Implémentation

Toutes les opérations d'inscription utilisent des **transactions Prisma** :

```typescript
return prisma.$transaction(async (tx) => {
  // 1. Créer joueur
  const joueur = await tx.joueur.create({ ... });

  // 2. Créer responsables
  await tx.responsable.createMany({ ... });

  // 3. Créer licence
  const licence = await tx.licence.create({ ... });

  return { accessKey: licence.accessKey };
});
```

### Avantages

- **Atomicité** : Tout ou rien
- **Cohérence** : Pas de données partielles
- **Isolation** : Pas de conflit entre requêtes simultanées
- **Durabilité** : Rollback automatique en cas d'erreur

## 6. Notification Email

### Sécurité

- Email **non bloquant** : L'inscription réussit même si l'email échoue
- **Aucune donnée sensible** dans l'email (uniquement accessKey)
- **HTTPS obligatoire** pour Resend
- **Rate limiting** appliqué aussi sur les emails

### Contenu de l'email

- Nom du joueur
- Saison
- AccessKey
- Lien de suivi (avec accessKey en query param)

### Provider recommandé : Resend

- **Simple** : Intégration en 2 minutes
- **Fiable** : 99.9% uptime
- **Moderne** : API REST
- **Next.js-friendly** : Conçu pour les apps modernes

## 7. Protection contre les attaques courantes

### SQL Injection

✅ **Protégé** via Prisma ORM (requêtes paramétrées automatiques)

```typescript
// Sécurisé - Prisma gère l'échappement
await prisma.licence.findUnique({
  where: { accessKey: userInput }
});
```

### XSS (Cross-Site Scripting)

✅ **Protégé** :
- Validation Zod empêche l'injection de scripts
- Next.js échappe automatiquement les données en JSX
- Pas de `dangerouslySetInnerHTML` utilisé

### CSRF (Cross-Site Request Forgery)

✅ **Protégé** via :
- API REST sans cookies de session
- CAPTCHA vérifie l'origine
- Next.js CSRF protection activée par défaut

### DDoS (Distributed Denial of Service)

🔶 **Partiellement protégé** :
- Rate limiting limite les requêtes par IP
- CAPTCHA bloque les bots
- **Recommandation** : Utiliser Cloudflare ou Vercel en production

### Brute Force

✅ **Protégé** :
- Rate limiting (5 tentatives/heure)
- CAPTCHA détecte les tentatives automatisées
- AccessKey impossible à deviner (UUID)

## 8. Checklist de déploiement

### Variables d'environnement

- [ ] `DATABASE_URL` configurée (PostgreSQL en production)
- [ ] `JWT_SECRET` fort et unique (min 32 caractères)
- [ ] `RECAPTCHA_SECRET_KEY` configurée (vraies clés, pas de test)
- [ ] `RESEND_API_KEY` ou SMTP configuré
- [ ] `NEXT_PUBLIC_APP_URL` pointe vers le domaine de production
- [ ] `NODE_ENV=production`

### Sécurité

- [ ] HTTPS activé (Let's Encrypt, Cloudflare, etc.)
- [ ] Rate limiting vérifié en production
- [ ] CAPTCHA testé avec de vraies clés
- [ ] Emails de confirmation testés
- [ ] Logs de sécurité activés
- [ ] Monitoring configuré (Sentry, LogRocket, etc.)

### Base de données

- [ ] Migrations Prisma appliquées
- [ ] Indexes vérifiés (accessKey, email, joueurId+saisonId)
- [ ] Backups automatiques configurés
- [ ] Connection pooling configuré

### Performance

- [ ] CDN configuré (images, assets statiques)
- [ ] Redis pour rate limiting (optionnel mais recommandé)
- [ ] Caching des saisons actives
- [ ] Compression GZIP/Brotli activée

## 9. Monitoring et alertes

### Métriques à surveiller

1. **Rate limiting**
   - Nombre de requêtes bloquées
   - IPs les plus actives

2. **CAPTCHA**
   - Taux de réussite/échec
   - Scores moyens

3. **Inscriptions**
   - Nombre par heure/jour
   - Taux d'erreur
   - Temps de réponse moyen

4. **Emails**
   - Taux de délivrabilité
   - Erreurs d'envoi

### Alertes recommandées

- Rate limiting dépasse 100 requêtes/heure
- CAPTCHA score moyen < 0.3 (possibles bots)
- Taux d'erreur inscription > 10%
- Base de données inaccessible
- Service email indisponible

## 10. FAQ Sécurité

**Q: Peut-on bypasser le rate limiting avec un VPN ?**
R: Oui, mais combiné au CAPTCHA, c'est plus difficile. En production, considérer l'empreinte du navigateur (fingerprinting).

**Q: Le CAPTCHA peut-il être contourné ?**
R: reCAPTCHA v3 est très robuste, mais aucun système n'est parfait. Combiner avec rate limiting et validation email.

**Q: Que faire si un utilisateur perd son accessKey ?**
R: Implémenter un système de récupération par email (endpoint à créer).

**Q: Les accessKeys expirent-ils ?**
R: Non par défaut, mais vous pouvez ajouter un TTL si nécessaire.

**Q: Comment détecter les inscriptions frauduleuses ?**
R: Analyser les patterns (même IP, emails jetables, données similaires, scores CAPTCHA bas).

**Q: Redis est-il obligatoire ?**
R: Non en développement, mais fortement recommandé en production pour le rate limiting distribué.

## Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google reCAPTCHA](https://developers.google.com/recaptcha)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
