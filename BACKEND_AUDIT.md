# 🔍 Audit Backend - Erreurs et Améliorations pour Usage Public

**Date** : 2026-01-14  
**Version** : 1.0.0  
**Objectif** : Liste exhaustive des problèmes critiques et améliorations prioritaires pour déployer en production publique

---

## 📋 Table des matières

1. [🔴 Erreurs Critiques](#erreurs-critiques)
2. [🟠 Problèmes Majeurs](#problèmes-majeurs)
3. [🟡 Améliorations Prioritaires](#améliorations-prioritaires)
4. [🔵 Optimisations Recommandées](#optimisations-recommandées)
5. [📊 Checklist Production](#checklist-production)

---

## 🔴 Erreurs Critiques

### 1. Rate Limiting Non-Distribué (CRITIQUE)

**Problème** : Le rate limiter utilise une `Map` en mémoire, ce qui ne fonctionne pas en environnement distribué (Vercel, Kubernetes, plusieurs instances).

**Impact** : 
- Chaque instance a son propre compteur
- Un attaquant peut contourner la limite en utilisant plusieurs instances
- Pas de protection efficace en production

**Fichier** : `src/lib/rate-limiter.ts`

**Solution** :
```typescript
// Option 1 : Upstash Redis (recommandé pour serverless)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
});

// Option 2 : Redis classique
import { Redis } from "ioredis";
const redis = new Redis(process.env.REDIS_URL);
```

**Priorité** : 🔴 CRITIQUE - À corriger avant production

---

### 2. Incohérence Type AuthUser.id vs User.id

**Problème** : 
- `AuthUser.id` est de type `number` dans `src/lib/auth.ts`
- `User.id` est de type `String @db.Uuid` dans Prisma

**Impact** :
- Risque d'erreurs de type lors de comparaisons
- Incompatibilité potentielle avec les routes admin
- Confusion pour les développeurs

**Fichiers** :
- `src/lib/auth.ts` (ligne 6)
- `prisma/schema.prisma` (ligne 52)

**Solution** :
```typescript
// src/lib/auth.ts
export type AuthUser = {
  id: string; // UUID au lieu de number
  role: 'ADMIN' | 'AGENT';
};
```

**Priorité** : 🔴 CRITIQUE - Bloque les routes admin

---

### 3. Validation UUID Manuelle au lieu de Zod

**Problème** : Validation UUID avec regex manuelle dans plusieurs endpoints au lieu d'utiliser Zod.

**Impact** :
- Code dupliqué
- Risque d'incohérence
- Moins maintenable

**Fichiers** :
- `src/app/api/inscriptions/route.ts` (lignes 128-134)
- `src/app/api/inscriptions/statut/route.ts` (lignes 31-37)

**Solution** :
```typescript
// Créer un schema réutilisable
import { z } from 'zod';

export const uuidSchema = z.string().uuid('Format UUID invalide');

// Utilisation
const accessKey = uuidSchema.parse(searchParams.get('accessKey'));
```

**Priorité** : 🟠 MAJEUR - Améliore la maintenabilité

---

### 4. Gestion d'Erreurs Email Non Structurée

**Problème** : Les erreurs d'email sont loggées avec `console.error` mais pas de retry mechanism ni de queue.

**Impact** :
- Emails perdus en cas d'erreur temporaire
- Pas de traçabilité structurée
- Difficile à monitorer

**Fichier** : `src/services/inscription.service.ts` (lignes 184-189)

**Solution** :
```typescript
// Option 1 : Queue simple avec retry
import { Queue } from 'bullmq';

const emailQueue = new Queue('emails', {
  connection: { host: process.env.REDIS_URL }
});

// Option 2 : Logging structuré + monitoring
import * as Sentry from '@sentry/nextjs';

if (!result.success) {
  Sentry.captureException(new Error('Email failed'), {
    extra: { email, accessKey, error: result.error }
  });
}
```

**Priorité** : 🟠 MAJEUR - Impact UX si emails perdus

---

### 5. Pas de Validation JWT_SECRET au Démarrage

**Problème** : `JWT_SECRET` est utilisé avec `!` (non-null assertion) sans vérification.

**Impact** :
- Erreur runtime si variable manquante
- Pas de message d'erreur clair au démarrage

**Fichier** : `src/lib/auth.ts` (ligne 3)

**Solution** :
```typescript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is required. Please set it in your environment variables.'
  );
}
```

**Priorité** : 🟠 MAJEUR - Erreur silencieuse possible

---

## 🟠 Problèmes Majeurs

### 6. Logging Non Structuré

**Problème** : Utilisation de `console.log/error/warn` partout au lieu d'un système de logging structuré.

**Impact** :
- Difficile à parser en production
- Pas de niveaux de log cohérents
- Pas d'intégration avec outils de monitoring

**Fichiers affectés** :
- `src/lib/captcha.ts` (6 occurrences)
- `src/lib/email.ts` (5 occurrences)
- `src/lib/http.ts` (1 occurrence)
- `src/services/inscription.service.ts` (2 occurrences)

**Solution** :
```typescript
// Créer src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'production' && {
    transport: {
      target: 'pino-pretty',
    },
  }),
});

// Utilisation
logger.error({ error, accessKey }, 'Email failed');
logger.warn({ score, minScore }, 'CAPTCHA score too low');
```

**Priorité** : 🟠 MAJEUR - Essentiel pour le monitoring

---

### 7. Pas de Health Check Endpoint

**Problème** : Aucun endpoint pour vérifier la santé de l'API (DB, Redis, etc.).

**Impact** :
- Impossible de monitorer la disponibilité
- Pas de readiness/liveness pour Kubernetes
- Difficile à déboguer en production

**Solution** :
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    timestamp: new Date().toISOString(),
  };

  const healthy = Object.values(checks).every(v => v === true);

  return NextResponse.json(checks, {
    status: healthy ? 200 : 503,
  });
}
```

**Priorité** : 🟠 MAJEUR - Standard pour production

---

### 8. Pas de Rate Limiting sur GET /api/inscriptions

**Problème** : Le rate limiting n'est appliqué que sur `POST /api/inscriptions`, pas sur `GET`.

**Impact** :
- Risque de scraping des licences
- Pas de protection contre les attaques par énumération

**Fichier** : `src/app/api/inscriptions/route.ts`

**Solution** :
```typescript
export async function GET(req: Request) {
  // Appliquer un rate limit plus permissif (ex: 100/heure)
  const rateLimitResult = checkInscriptionRateLimit(req, {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Trop de requêtes' },
      { status: 429 }
    );
  }

  // ... reste du code
}
```

**Priorité** : 🟠 MAJEUR - Sécurité

---

### 9. Pas de CORS Configuré Explicitement

**Problème** : Pas de configuration CORS explicite dans les routes API.

**Impact** :
- Risque de problèmes avec certains clients
- Pas de contrôle sur les origines autorisées

**Solution** :
```typescript
// src/lib/cors.ts
export function corsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '*') 
      ? origin || '*' 
      : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-recaptcha-token',
  };
}
```

**Priorité** : 🟡 MOYEN - Dépend du déploiement

---

### 10. Pas de Validation des Dates de Saison

**Problème** : La validation des dates de saison se fait dans le service mais pas dans le schema Zod.

**Impact** :
- Erreur métier retournée comme erreur serveur (500 au lieu de 400)
- Moins clair pour le client

**Fichier** : `src/services/inscription.service.ts` (lignes 32-43)

**Solution** :
```typescript
// Ajouter dans inscription.schema.ts
.refine(
  async (data) => {
    const saison = await prisma.saison.findUnique({ where: { id: data.saisonId } });
    if (!saison) return false;
    const maintenant = new Date();
    return maintenant >= saison.inscriptionDebut && maintenant <= saison.inscriptionFin;
  },
  {
    message: 'Les inscriptions pour cette saison ne sont pas ouvertes',
    path: ['saisonId'],
  }
)
```

**Priorité** : 🟡 MOYEN - Améliore l'UX

---

## 🟡 Améliorations Prioritaires

### 11. Duplication de Logique entre LicenceService et InscriptionService

**Problème** : `LicenceService.creerLicence` crée des licences en BROUILLON, tandis que `InscriptionService` crée directement en SOUMISE.

**Impact** :
- Confusion sur quel service utiliser
- Risque de duplication de code

**Fichiers** :
- `src/services/licence.service.ts`
- `src/services/inscription.service.ts`

**Solution** :
- Documenter clairement : `LicenceService` = Admin, `InscriptionService` = Public
- Ou fusionner avec un paramètre `statutInitial`

**Priorité** : 🟡 MOYEN - Clarification nécessaire

---

### 12. Pas de Pagination sur les Endpoints de Liste

**Problème** : Si des endpoints retournent des listes (ex: `/api/saisons`), pas de pagination.

**Impact** :
- Risque de surcharge si beaucoup de données
- Performance dégradée

**Solution** :
```typescript
// Ajouter pagination standard
const page = parseInt(searchParams.get('page') || '1');
const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
const skip = (page - 1) * limit;

return NextResponse.json({
  data: results,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
```

**Priorité** : 🟡 MOYEN - Si endpoints de liste existent

---

### 13. Pas de Cache pour les Saisons Actives

**Problème** : Les saisons sont récupérées depuis la DB à chaque requête.

**Impact** :
- Requêtes DB inutiles
- Latence accrue

**Solution** :
```typescript
// Cache simple en mémoire (ou Redis)
const saisonCache = new Map<string, { data: Saison; expires: number }>();

async function getSaisonCached(id: string) {
  const cached = saisonCache.get(id);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const saison = await prisma.saison.findUnique({ where: { id } });
  saisonCache.set(id, { data: saison, expires: Date.now() + 60000 }); // 1 min
  return saison;
}
```

**Priorité** : 🟡 MOYEN - Optimisation

---

### 14. Pas de Validation de Taille de Payload

**Problème** : Pas de limite sur la taille du body JSON.

**Impact** :
- Risque de DoS par payload volumineux
- Consommation mémoire excessive

**Solution** :
```typescript
// Middleware Next.js ou vérification dans route
const MAX_BODY_SIZE = 1024 * 100; // 100KB

const contentLength = req.headers.get('content-length');
if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
  return NextResponse.json(
    { message: 'Payload trop volumineux' },
    { status: 413 }
  );
}
```

**Priorité** : 🟡 MOYEN - Sécurité

---

### 15. Pas de Timeout sur les Requêtes Externes

**Problème** : Pas de timeout explicite sur les appels à Google reCAPTCHA et Resend.

**Impact** :
- Blocage potentiel si service externe lent
- Timeout par défaut peut être très long

**Fichiers** :
- `src/lib/captcha.ts` (ligne 53)
- `src/lib/email.ts` (ligne 47)

**Solution** :
```typescript
// Utiliser AbortController
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000); // 5s

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeout);
}
```

**Priorité** : 🟡 MOYEN - Robustesse

---

## 🔵 Optimisations Recommandées

### 16. Connection Pooling Prisma

**Problème** : Pas de configuration explicite du connection pooling.

**Impact** :
- Performance sous charge
- Risque de saturation de connexions DB

**Fichier** : `src/lib/prisma.ts`

**Solution** :
```typescript
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20',
    },
  },
});
```

**Priorité** : 🔵 OPTIMISATION

---

### 17. Index Manquants Potentiels

**Problème** : Vérifier que tous les champs utilisés dans `where` ont des index.

**Impact** :
- Performance dégradée sur grandes tables

**Vérifications nécessaires** :
- `Licence.accessKey` ✅ (unique)
- `Licence.joueurId + saisonId` ✅ (unique composite)
- `Joueur.email` ✅ (unique)
- `Responsable.joueurId` ? (foreign key, vérifier index)

**Solution** :
```prisma
// Ajouter dans schema.prisma si nécessaire
model Responsable {
  // ...
  @@index([joueurId]) // Si pas déjà indexé via FK
}
```

**Priorité** : 🔵 OPTIMISATION

---

### 18. Pas de Compression des Réponses

**Problème** : Pas de compression gzip/brotli configurée.

**Impact** :
- Bande passante inutile
- Latence accrue

**Solution** :
- Configurer au niveau du serveur (Nginx, Vercel le fait automatiquement)
- Ou utiliser middleware Next.js

**Priorité** : 🔵 OPTIMISATION

---

### 19. Pas de Monitoring des Métriques Métier

**Problème** : Pas de tracking des métriques importantes (inscriptions/jour, taux d'erreur, etc.).

**Impact** :
- Pas de visibilité sur l'usage
- Difficile de détecter les problèmes

**Solution** :
```typescript
// Intégrer avec un service de métriques (Datadog, Prometheus, etc.)
import { StatsD } from 'node-statsd';

const statsd = new StatsD();

statsd.increment('inscription.created');
statsd.timing('inscription.duration', duration);
statsd.gauge('inscription.rate_limit_hits', hits);
```

**Priorité** : 🔵 OPTIMISATION

---

### 20. Pas de Versioning d'API

**Problème** : Pas de versioning dans les routes API (`/api/v1/inscriptions`).

**Impact** :
- Difficile de faire évoluer l'API sans casser les clients
- Pas de rétrocompatibilité

**Solution** :
```typescript
// Restructurer : src/app/api/v1/inscriptions/route.ts
// Ajouter header X-API-Version
```

**Priorité** : 🔵 OPTIMISATION - Si API publique

---

## 📊 Checklist Production

### 🔴 Critiques (À faire avant déploiement)

- [ ] **Rate limiting distribué** (Redis/Upstash)
- [ ] **Corriger AuthUser.id** (UUID au lieu de number)
- [ ] **Health check endpoint** (`/api/health`)
- [ ] **Rate limiting GET** `/api/inscriptions`
- [ ] **Logging structuré** (Pino ou équivalent)
- [ ] **Validation JWT_SECRET** au démarrage

### 🟠 Majeurs (Recommandés avant production)

- [ ] **Validation UUID avec Zod** (réutilisable)
- [ ] **Retry mechanism pour emails** (queue ou retry)
- [ ] **Monitoring d'erreurs** (Sentry, LogRocket)
- [ ] **CORS configuré** explicitement
- [ ] **Timeout sur requêtes externes** (reCAPTCHA, Resend)

### 🟡 Moyens (Améliorer progressivement)

- [ ] **Cache saisons actives** (mémoire ou Redis)
- [ ] **Validation taille payload** (max 100KB)
- [ ] **Pagination** sur endpoints de liste
- [ ] **Documentation API** (OpenAPI/Swagger)
- [ ] **Tests de charge** (k6, Artillery)

### 🔵 Optimisations (Nice to have)

- [ ] **Connection pooling** Prisma optimisé
- [ ] **Index DB** vérifiés et optimisés
- [ ] **Compression** activée
- [ ] **Métriques métier** trackées
- [ ] **Versioning API** si nécessaire

---

## 🎯 Priorisation Recommandée

### Phase 1 - Avant Production (Semaine 1)
1. Rate limiting distribué
2. Corriger AuthUser.id
3. Health check endpoint
4. Logging structuré
5. Validation JWT_SECRET

### Phase 2 - Post-Lancement (Semaine 2-3)
6. Rate limiting GET
7. Validation UUID Zod
8. Retry emails
9. Monitoring (Sentry)
10. Timeout requêtes externes

### Phase 3 - Amélioration Continue (Mois 1-2)
11. Cache saisons
12. Validation payload
13. Documentation API
14. Tests de charge
15. Métriques métier

---

## 📝 Notes Finales

**Points Forts Actuels** :
- ✅ Architecture propre et séparée
- ✅ Validation Zod robuste
- ✅ Transactions atomiques
- ✅ Tests bien structurés
- ✅ Documentation complète

**Risques Principaux** :
- 🔴 Rate limiting non-distribué = vulnérabilité critique
- 🔴 AuthUser.id incohérent = bloque routes admin
- 🟠 Pas de monitoring = difficile à déboguer en prod

**Recommandation** : Corriger les 5 points critiques avant tout déploiement public, puis itérer sur les améliorations progressivement.

---

**Document créé le** : 2026-01-14  
**Dernière mise à jour** : 2026-01-14  
**Version** : 1.0.0

