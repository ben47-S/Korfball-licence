# Guide de Testing

Ce document explique comment exécuter et écrire des tests pour l'API d'inscription.

## Installation des dépendances

```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-node
```

Ou si vous utilisez yarn :

```bash
yarn add -D jest @types/jest ts-jest jest-environment-node
```

## Configuration

Les fichiers de configuration sont déjà créés :

- `jest.config.js` : Configuration principale de Jest
- `jest.setup.js` : Setup exécuté avant chaque test
- `__tests__/` : Dossier contenant tous les tests

## Structure des tests

```
__tests__/
├── unit/                      # Tests unitaires
│   ├── validators/
│   │   └── inscription.schema.test.ts
│   └── lib/
│       ├── rate-limiter.test.ts
│       ├── email.test.ts
│       └── captcha.test.ts
└── integration/               # Tests d'intégration
    └── api/
        └── inscriptions.test.ts
```

## Commandes disponibles

### Exécuter tous les tests

```bash
npm test
```

### Exécuter les tests en mode watch

```bash
npm run test:watch
```

### Exécuter uniquement les tests unitaires

```bash
npm run test:unit
```

### Exécuter uniquement les tests d'intégration

```bash
npm run test:integration
```

### Générer le rapport de couverture

```bash
npm run test:coverage
```

Le rapport sera généré dans `coverage/lcov-report/index.html`

## Tests unitaires

### 1. Tests de validation Zod

**Fichier**: `__tests__/unit/validators/inscription.schema.test.ts`

**Ce qui est testé** :
- Validation des données correctes
- Rejet des données invalides
- Validation croisée (RENOUVELLEMENT + clubPrecedentId)
- Validation de l'âge (mineur = responsables obligatoires)
- Validation des formats (email, UUID, dates)

**Exemple** :

```typescript
it('devrait valider des données correctes', () => {
  const result = inscriptionLicenceSchema.safeParse(validData);
  expect(result.success).toBe(true);
});

it('devrait rejeter un mineur sans responsables', () => {
  const data = {
    ...validData,
    joueur: { ...validData.joueur, dateNaissance: '2010-05-20' },
    responsables: undefined,
  };
  const result = inscriptionLicenceSchema.safeParse(data);
  expect(result.success).toBe(false);
});
```

### 2. Tests du Rate Limiter

**Fichier**: `__tests__/unit/lib/rate-limiter.test.ts`

**Ce qui est testé** :
- Autorisation des premières requêtes
- Blocage après la limite (5 requêtes)
- Réinitialisation après la fenêtre de temps
- Extraction de l'IP depuis les headers

**Exemple** :

```typescript
it('devrait bloquer après 5 requêtes', () => {
  const mockRequest = new Request('http://localhost:3000', {
    headers: { 'x-forwarded-for': 'test-ip' },
  });

  // Faire 5 requêtes
  for (let i = 0; i < 5; i++) {
    checkInscriptionRateLimit(mockRequest);
  }

  // La 6ème devrait être bloquée
  const result = checkInscriptionRateLimit(mockRequest);
  expect(result.allowed).toBe(false);
});
```

### 3. Tests du service Email

**Fichier**: `__tests__/unit/lib/email.test.ts`

**Ce qui est testé** :
- Génération du contenu de l'email
- Validation des paramètres (email valide, champs requis)
- Mode développement (logging au lieu d'envoyer)
- Inclusion de l'accessKey et du lien de suivi

**Exemple** :

```typescript
it('devrait générer un email correct', () => {
  const result = generateInscriptionEmail(
    'Martin', 'Lucas', 'accessKey123', '2024-2025'
  );

  expect(result.subject).toContain('Confirmation d\'inscription');
  expect(result.html).toContain('Lucas Martin');
  expect(result.html).toContain('accessKey123');
});
```

### 4. Tests du CAPTCHA

**Fichier**: `__tests__/unit/lib/captcha.test.ts`

**Ce qui est testé** :
- Bypass en mode développement
- Validation du token avec l'API Google
- Rejet des scores trop bas
- Vérification de l'action
- Gestion des erreurs réseau

**Exemple** :

```typescript
it('devrait rejeter si le score est trop bas', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    json: async () => ({
      success: true,
      score: 0.2,
      action: 'inscription',
    }),
  });

  const result = await verifyCaptcha('token', 'inscription', 0.5);
  expect(result.success).toBe(false);
});
```

## Tests d'intégration

### Tests de l'endpoint POST /api/inscriptions

**Fichier**: `__tests__/integration/api/inscriptions.test.ts`

**Ce qui est testé** :
- Création d'inscription avec données valides
- Rejet de données invalides
- Rate limiting (5 requêtes max)
- Vérification CAPTCHA
- Envoi d'email de confirmation
- Headers de réponse (rate limiting, status codes)

**Exemple** :

```typescript
it('devrait créer une inscription avec des données valides', async () => {
  const request = new Request('http://localhost:3000/api/inscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': 'test-ip',
      'x-recaptcha-token': 'valid-token',
    },
    body: JSON.stringify(validData),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(201);
  expect(data.success).toBe(true);
  expect(data.accessKey).toBeDefined();
});
```

### Tests de l'endpoint GET /api/inscriptions

**Ce qui est testé** :
- Rejet sans accessKey
- Validation du format UUID
- Récupération de licence valide

## Mocking

### Prisma Client

Pour les tests unitaires, vous pouvez mocker Prisma :

```typescript
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    joueur: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    licence: {
      create: jest.fn(),
    },
    // ...
  },
}));
```

### Services externes

Les tests d'intégration mockent automatiquement :
- Service d'email (`sendInscriptionConfirmationEmail`)
- CAPTCHA (`verifyCaptcha`)

## Base de données de test

### Option 1 : SQLite en mémoire

```typescript
// jest.setup.js
process.env.DATABASE_URL = 'file:./test.db';
```

### Option 2 : PostgreSQL de test

```bash
# Créer une base de test
createdb korfball_test

# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/korfball_test"
```

### Réinitialiser la base entre les tests

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {
  // Nettoyer les tables
  await prisma.licence.deleteMany();
  await prisma.responsable.deleteMany();
  await prisma.joueur.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## Couverture de code

### Objectifs

Configuration actuelle dans `jest.config.js` :

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### Visualiser le rapport

Après `npm run test:coverage` :

```bash
open coverage/lcov-report/index.html
```

### Fichiers exclus de la couverture

- `src/**/*.d.ts` (fichiers de types TypeScript)
- `src/generated/**` (code généré par Prisma)
- `src/**/*.stories.{ts,tsx}` (Storybook)

## Bonnes pratiques

### 1. Organisation des tests

```typescript
describe('Module ou fonction', () => {
  // Setup global
  beforeAll(() => { /* ... */ });

  describe('Cas nominal', () => {
    it('devrait faire X', () => { /* ... */ });
  });

  describe('Cas d\'erreur', () => {
    it('devrait rejeter Y', () => { /* ... */ });
  });

  // Cleanup
  afterAll(() => { /* ... */ });
});
```

### 2. Nommage des tests

- Utiliser **"devrait"** pour décrire le comportement attendu
- Être **explicite** et **spécifique**
- Décrire le **résultat** plutôt que l'implémentation

✅ Bon :
```typescript
it('devrait rejeter un email invalide', () => { /* ... */ });
```

❌ Mauvais :
```typescript
it('teste l\'email', () => { /* ... */ });
```

### 3. Arrange-Act-Assert (AAA)

```typescript
it('devrait créer une inscription', () => {
  // Arrange - Préparer les données
  const data = { /* ... */ };

  // Act - Exécuter l'action
  const result = creerInscription(data);

  // Assert - Vérifier le résultat
  expect(result.accessKey).toBeDefined();
});
```

### 4. Tests isolés

- Chaque test doit être **indépendant**
- Ne pas dépendre de l'ordre d'exécution
- Nettoyer après chaque test

```typescript
afterEach(() => {
  jest.clearAllMocks();
  rateLimiter.reset('test-ip');
});
```

### 5. Mocking approprié

- **Ne pas mocker** ce que vous testez
- **Mocker** les dépendances externes (API, base de données, email)
- **Vérifier** que les mocks sont appelés correctement

```typescript
const mockSendEmail = jest.fn();
jest.mock('../lib/email', () => ({
  sendEmail: mockSendEmail,
}));

// ...

expect(mockSendEmail).toHaveBeenCalledWith(
  expect.objectContaining({
    to: 'user@example.com',
  })
);
```

## Debugging des tests

### Exécuter un seul test

```bash
npm test -- -t "nom du test"
```

### Mode debug

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Puis ouvrir Chrome DevTools : `chrome://inspect`

### Logs détaillés

```typescript
it('devrait faire quelque chose', () => {
  console.log('Debug:', result);
  expect(result).toBe(expected);
});
```

## CI/CD

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Vercel

Tests automatiques avant déploiement :

```json
{
  "buildCommand": "npm run build && npm test",
  "ignoreCommand": "git diff HEAD^ HEAD --quiet . ':!*.md'"
}
```

## Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Troubleshooting

### Erreur : "Cannot find module"

```bash
npm install
npm run build
```

### Tests trop lents

- Utiliser `--maxWorkers=50%` pour limiter les workers
- Mocker Prisma pour les tests unitaires
- Utiliser SQLite en mémoire pour les tests d'intégration

### Timeouts

```typescript
jest.setTimeout(10000); // 10 secondes
```

Ou pour un test spécifique :

```typescript
it('test long', async () => {
  // ...
}, 15000); // 15 secondes
```
