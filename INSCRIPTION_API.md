# API d'Inscription - Documentation Complète

## Vue d'ensemble

L'API d'inscription permet de créer des licences de korfball pour une saison donnée. Elle gère automatiquement :

- La validation des données (Zod)
- La période d'inscription (selon la saison)
- La création/mise à jour des joueurs
- La gestion des responsables (pour les mineurs)
- La distinction NOUVEAU vs RENOUVELLEMENT
- La sécurité par accessKey

## Architecture

```
┌─────────────────┐
│   Client/Form   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Server Actions (optionnel)     │
│  inscription.actions.ts          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  API Routes (public)             │
│  /api/inscriptions               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Validators (Zod)                │
│  inscription.schema.ts           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Business Logic                  │
│  inscription.service.ts          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Database (Prisma)               │
│  PostgreSQL                      │
└─────────────────────────────────┘
```

## Endpoints

### 1. Créer une inscription

**POST** `/api/inscriptions`

Crée une nouvelle inscription de licence avec le statut **SOUMISE** (directement prête pour validation admin).

#### Authentification
- **Public** (pas d'authentification requise)
- Rate limiting recommandé (ex: 5 inscriptions/heure/IP)

#### Body

```typescript
{
  // Type de licence (obligatoire)
  type: "NOUVEAU" | "RENOUVELLEMENT",

  // ID de la saison (obligatoire)
  saisonId: string, // UUID

  // Données du joueur (obligatoire)
  joueur: {
    nom: string,              // min 2 chars
    prenom: string,           // min 2 chars
    email?: string,           // optionnel, email valide
    telephone?: string,       // optionnel
    dateNaissance: string,    // ISO 8601 (ex: "2005-03-15")
    lieuNaissance?: string,
    nationalite?: string,     // min 2 chars
    sexe?: "M" | "F" | "Autre",
    photo?: string,           // URL
    signature?: string        // base64 ou URL
  },

  // Responsables (obligatoire pour mineurs < 18 ans)
  responsables?: [
    {
      nom: string,
      prenom: string,
      telephone?: string,     // min 8 chars
      email?: string,
      lien: "PERE" | "MERE" | "TUTEUR"
    }
  ],

  // Club précédent (obligatoire si RENOUVELLEMENT)
  clubPrecedentId?: string,   // UUID

  // Club actuel (optionnel)
  clubActuelId?: string       // UUID
}
```

#### Réponse succès (201)

```json
{
  "success": true,
  "message": "Inscription réussie pour la saison ! Conservez précieusement votre clé d'accès.",
  "accessKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

#### Erreurs possibles

**400 - Validation error**
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "joueur.email",
      "message": "Email invalide"
    }
  ]
}
```

**400 - Business logic errors**
```json
{
  "message": "Les inscriptions pour la saison 2024-2025 sont fermées depuis le 30/09/2024"
}
```

```json
{
  "message": "Le club précédent est obligatoire pour un renouvellement"
}
```

```json
{
  "message": "Au moins un responsable est requis pour les joueurs mineurs (< 18 ans)"
}
```

```json
{
  "message": "Une licence existe déjà pour ce joueur pour cette saison"
}
```

### 2. Récupérer une licence

**GET** `/api/inscriptions?accessKey={uuid}`

Récupère les informations complètes d'une licence avec toutes ses relations.

#### Authentification
- Protégé par **accessKey** (pas besoin de JWT)

#### Query Parameters
- `accessKey` (string, uuid) : Clé d'accès retournée lors de l'inscription

#### Réponse succès (200)

```json
{
  "id": "abc123...",
  "accessKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "type": "NOUVEAU",
  "statut": "SOUMISE",
  "numeroLicence": null,
  "dateValidation": null,
  "commentaireAdmin": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "joueur": {
    "id": "def456...",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@email.com",
    "dateNaissance": "2005-03-15T00:00:00Z",
    "responsables": [
      {
        "id": "ghi789...",
        "nom": "Dupont",
        "prenom": "Marie",
        "telephone": "+33612345678",
        "lien": "MERE"
      }
    ]
  },
  "saison": {
    "id": "jkl012...",
    "code": "2024-2025",
    "debut": "2024-09-01T00:00:00Z",
    "fin": "2025-06-30T00:00:00Z"
  },
  "clubActuel": {
    "id": "mno345...",
    "nom": "Korfball Paris",
    "ville": "Paris"
  },
  "clubPrecedent": null,
  "paiement": null
}
```

#### Erreurs possibles

**400 - Invalid accessKey**
```json
{
  "message": "Paramètre accessKey manquant"
}
```

**404 - Not found**
```json
{
  "message": "Licence introuvable avec cette clé d'accès"
}
```

### 3. Vérifier le statut

**GET** `/api/inscriptions/statut?accessKey={uuid}`

Version light pour vérifier rapidement le statut d'une licence sans charger toutes les relations.

#### Authentification
- Protégé par **accessKey**

#### Query Parameters
- `accessKey` (string, uuid)

#### Réponse succès (200)

```json
{
  "id": "abc123...",
  "statut": "VALIDEE",
  "numeroLicence": 2024001,
  "dateValidation": "2024-01-20T14:30:00Z",
  "commentaireAdmin": null
}
```

## Workflow d'inscription

```
┌─────────────────────────────────────────────────────────┐
│ 1. Utilisateur remplit le formulaire d'inscription      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 2. POST /api/inscriptions                               │
│    - Validation Zod                                      │
│    - Vérification période d'inscription                  │
│    - Création joueur + licence (SOUMISE)                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Retour accessKey au client                           │
│    ⚠️  À sauvegarder (email, QR code, etc.)             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Utilisateur peut consulter sa demande                │
│    GET /api/inscriptions?accessKey=xxx                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Admin valide/rejette la licence                      │
│    PATCH /api/licences (endpoints existants)            │
└─────────────────────────────────────────────────────────┘
```

## Règles métier

### Période d'inscription
- La saison doit exister
- La date actuelle doit être entre `inscriptionDebut` et `inscriptionFin`
- Erreur explicite si hors période

### Type de licence

#### NOUVEAU
- Premier joueur dans la fédération
- Aucun club précédent requis
- Club actuel recommandé

#### RENOUVELLEMENT
- Joueur déjà licencié les années précédentes
- **Club précédent obligatoire**
- Club actuel recommandé

### Joueur

#### Mineur (< 18 ans)
- Au moins 1 responsable obligatoire
- Maximum 3 responsables
- Lien requis (PERE, MERE, TUTEUR)

#### Majeur (≥ 18 ans)
- Responsables optionnels

### Détection de doublon
- Si un joueur avec le même email existe déjà pour cette saison
- Erreur : "Une licence existe déjà pour ce joueur pour cette saison"

## Sécurité

### AccessKey
- UUID v4 généré automatiquement par Prisma
- Unique pour chaque licence
- Permet l'accès sans authentification JWT
- **Ne jamais exposer d'autres données sensibles**

### Recommandations

1. **Rate limiting**
   - Limiter les inscriptions par IP/session
   - Ex: 5 inscriptions/heure/IP

2. **CAPTCHA**
   - Ajouter un CAPTCHA sur le formulaire d'inscription
   - Prévenir les bots

3. **Notification email**
   - Envoyer l'accessKey par email au joueur/responsable
   - Permet de retrouver sa demande

4. **QR Code**
   - Générer un QR code avec l'accessKey
   - Facilite la consultation sur mobile

5. **Validation côté serveur**
   - Ne jamais faire confiance aux données client
   - Toujours valider avec Zod côté serveur

## Utilisation dans Next.js

### Avec Server Actions (recommandé pour les forms)

```typescript
import { creerInscriptionAction } from '@/app/actions/inscription.actions';

async function handleSubmit(formData: FormData) {
  const result = await creerInscriptionAction({
    type: 'NOUVEAU',
    saisonId: '...',
    joueur: { /* ... */ },
    // ...
  });

  if (result.success) {
    // Sauvegarder l'accessKey
    console.log('AccessKey:', result.data.accessKey);
    // Rediriger ou afficher le message
  } else {
    // Gérer les erreurs
    console.error(result.error, result.fieldErrors);
  }
}
```

### Avec fetch API (REST)

```typescript
const response = await fetch('/api/inscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'NOUVEAU',
    saisonId: '...',
    joueur: { /* ... */ },
    // ...
  }),
});

const data = await response.json();

if (response.ok) {
  console.log('AccessKey:', data.accessKey);
} else {
  console.error(data.message, data.errors);
}
```

## Exemple complet

### Inscription d'un joueur mineur (NOUVEAU)

```json
POST /api/inscriptions

{
  "type": "NOUVEAU",
  "saisonId": "550e8400-e29b-41d4-a716-446655440000",
  "joueur": {
    "nom": "Martin",
    "prenom": "Lucas",
    "email": "lucas.martin@email.com",
    "telephone": "+33612345678",
    "dateNaissance": "2010-05-20",
    "lieuNaissance": "Lyon",
    "nationalite": "Française",
    "sexe": "M",
    "photo": "https://example.com/photo.jpg"
  },
  "responsables": [
    {
      "nom": "Martin",
      "prenom": "Sophie",
      "telephone": "+33698765432",
      "email": "sophie.martin@email.com",
      "lien": "MERE"
    },
    {
      "nom": "Martin",
      "prenom": "Pierre",
      "telephone": "+33687654321",
      "email": "pierre.martin@email.com",
      "lien": "PERE"
    }
  ],
  "clubActuelId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Inscription réussie pour la saison ! Conservez précieusement votre clé d'accès.",
  "accessKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

### Inscription d'un joueur majeur (RENOUVELLEMENT)

```json
POST /api/inscriptions

{
  "type": "RENOUVELLEMENT",
  "saisonId": "550e8400-e29b-41d4-a716-446655440000",
  "joueur": {
    "nom": "Dubois",
    "prenom": "Marie",
    "email": "marie.dubois@email.com",
    "telephone": "+33623456789",
    "dateNaissance": "1995-08-12",
    "nationalite": "Française",
    "sexe": "F"
  },
  "clubPrecedentId": "770e8400-e29b-41d4-a716-446655440002",
  "clubActuelId": "660e8400-e29b-41d4-a716-446655440001"
}
```

## Tests recommandés

### Tests unitaires
- Validation Zod (schéma)
- Service métier (InscriptionService)
- Server Actions

### Tests d'intégration
- API routes complètes
- Transactions Prisma

### Tests E2E
- Formulaire d'inscription complet
- Workflow utilisateur

## FAQ

**Q: Que faire si l'utilisateur perd son accessKey ?**
R: Implémenter un système de récupération par email (endpoint à créer).

**Q: Peut-on modifier une inscription après création ?**
R: Non, uniquement l'admin peut modifier via les endpoints existants. Créer une nouvelle inscription si nécessaire.

**Q: Combien de temps est valide l'accessKey ?**
R: L'accessKey est valide indéfiniment tant que la licence existe.

**Q: Peut-on supprimer une inscription ?**
R: Uniquement l'admin via les endpoints d'administration existants.

## Contact & Support

Pour toute question ou problème :
- GitHub Issues
- Documentation Prisma: https://www.prisma.io/docs
- Documentation Next.js: https://nextjs.org/docs
