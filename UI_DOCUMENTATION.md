# Documentation de l'Interface Utilisateur

Guide complet de l'interface utilisateur du système d'inscription de licences.

## 🎨 Vue d'ensemble

L'interface utilisateur est construite avec :
- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4** (styling)
- **TypeScript** (type-safety)
- **Google reCAPTCHA v3** (sécurité)

## 📁 Structure des fichiers

```
src/
├── app/
│   ├── layout.tsx                    # Layout principal avec navigation
│   ├── page.tsx                      # Page d'accueil
│   └── inscription/
│       ├── page.tsx                  # Formulaire d'inscription (3 étapes)
│       ├── succes/
│       │   └── page.tsx              # Page de succès avec accessKey
│       └── suivi/
│           └── page.tsx              # Suivi de licence par accessKey
├── components/
│   └── ui/
│       ├── Button.tsx                # Bouton réutilisable
│       ├── Input.tsx                 # Input avec label et erreurs
│       ├── Select.tsx                # Select avec options
│       ├── Alert.tsx                 # Alertes (success, error, warning, info)
│       └── Card.tsx                  # Carte conteneur
└── hooks/
    └── useRecaptcha.ts               # Hook pour Google reCAPTCHA v3
```

## 🚀 Pages

### 1. Page d'accueil (`/`)

**Fichier** : `src/app/page.tsx`

**Description** : Page d'atterrissage avec présentation du service.

**Sections** :
- Hero avec titre et CTA
- 3 fonctionnalités principales (Simple, Sécurisé, Suivi)
- Processus en 4 étapes
- Call-to-action final

**Navigation** :
- Bouton "Nouvelle inscription" → `/inscription`
- Bouton "Suivre ma licence" → `/inscription/suivi`

### 2. Formulaire d'inscription (`/inscription`)

**Fichier** : `src/app/inscription/page.tsx`

**Description** : Formulaire en 3 étapes pour créer une inscription.

**Étapes** :

#### Étape 1 : Type et saison
- Type de licence (NOUVEAU / RENOUVELLEMENT)
- ID Saison (UUID)
- ID Club précédent (si RENOUVELLEMENT)
- ID Club actuel (optionnel)

#### Étape 2 : Informations du joueur
- Nom et prénom (requis)
- Date de naissance (requis)
- Sexe (requis)
- Email (optionnel, pour confirmation)
- Téléphone (optionnel)
- Lieu de naissance (optionnel)
- Nationalité (optionnel)

**Calcul automatique de l'âge** : Affiche si le joueur est mineur ou majeur.

#### Étape 3 : Responsables légaux
- Liste des responsables ajoutés
- Formulaire pour ajouter un responsable :
  - Nom et prénom (requis)
  - Téléphone (optionnel)
  - Email (optionnel)
  - Lien (PERE / MERE / TUTEUR) (requis)
- Maximum 3 responsables
- **Obligatoire pour les mineurs (< 18 ans)**

**Validation** :
- Validation étape par étape
- Messages d'erreur clairs
- Boutons désactivés si validation échoue

**Soumission** :
- Intégration reCAPTCHA v3 automatique
- Loading state pendant l'envoi
- Redirection vers `/inscription/succes` en cas de succès

### 3. Page de succès (`/inscription/succes`)

**Fichier** : `src/app/inscription/succes/page.tsx`

**Description** : Confirmation d'inscription avec l'accessKey.

**Contenu** :
- Icône de succès
- Message de confirmation
- **AccessKey** affiché en grand avec bouton "Copier"
- Avertissement sur l'importance de conserver la clé
- Prochaines étapes (4 points)
- Boutons d'action :
  - "Suivre ma demande" → `/inscription/suivi?accessKey=xxx`
  - "Retour à l'accueil" → `/`

### 4. Suivi de licence (`/inscription/suivi`)

**Fichier** : `src/app/inscription/suivi/page.tsx`

**Description** : Consulter l'état d'une licence avec l'accessKey.

**Fonctionnalités** :
- Input pour saisir l'accessKey
- Chargement automatique si accessKey dans l'URL
- Bouton "Rechercher ma licence"
- Affichage complet de la licence :
  - Statut avec badge coloré (BROUILLON, SOUMISE, VALIDEE, REJETEE)
  - Informations du joueur
  - Détails de la licence (saison, numéro, club, dates)
  - Messages contextuels selon le statut
  - Bouton "Procéder au paiement" si licence validée

**Badges de statut** :
- BROUILLON : gris
- SOUMISE : bleu (En cours de traitement)
- VALIDEE : vert
- REJETEE : rouge (avec commentaire admin)

## 🧩 Composants UI

### Button

**Fichier** : `src/components/ui/Button.tsx`

**Props** :
- `variant` : 'primary' | 'secondary' | 'outline' | 'danger'
- `size` : 'sm' | 'md' | 'lg'
- `isLoading` : boolean (affiche un spinner)
- Toutes les props HTML standard de `<button>`

**Usage** :
```tsx
<Button variant="primary" size="md" isLoading={false}>
  Valider
</Button>
```

### Input

**Fichier** : `src/components/ui/Input.tsx`

**Props** :
- `label` : string (label au-dessus de l'input)
- `error` : string (message d'erreur en rouge)
- `helperText` : string (texte d'aide en gris)
- `required` : boolean (affiche une astérisque rouge)
- Toutes les props HTML standard de `<input>`

**Usage** :
```tsx
<Input
  label="Nom"
  required
  value={nom}
  onChange={(e) => setNom(e.target.value)}
  error={errors.nom}
  helperText="Votre nom de famille"
/>
```

### Select

**Fichier** : `src/components/ui/Select.tsx`

**Props** :
- `label` : string
- `error` : string
- `helperText` : string
- `required` : boolean
- `options` : Array<{ value: string, label: string }>
- Toutes les props HTML standard de `<select>`

**Usage** :
```tsx
<Select
  label="Sexe"
  required
  value={sexe}
  onChange={(e) => setSexe(e.target.value)}
  options={[
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' },
  ]}
/>
```

### Alert

**Fichier** : `src/components/ui/Alert.tsx`

**Props** :
- `type` : 'success' | 'error' | 'warning' | 'info'
- `title` : string (optionnel)
- `children` : ReactNode (contenu de l'alerte)
- `onClose` : () => void (optionnel, affiche un bouton de fermeture)

**Usage** :
```tsx
<Alert type="success" title="Succès">
  Votre inscription a été enregistrée.
</Alert>

<Alert type="error">
  Une erreur est survenue.
</Alert>
```

### Card

**Fichier** : `src/components/ui/Card.tsx`

**Props** :
- `title` : string (optionnel)
- `description` : string (optionnel)
- `children` : ReactNode
- `className` : string (optionnel)

**Usage** :
```tsx
<Card title="Mon titre" description="Ma description">
  <p>Contenu de la carte</p>
</Card>
```

## 🔧 Hooks personnalisés

### useRecaptcha

**Fichier** : `src/hooks/useRecaptcha.ts`

**Description** : Hook pour intégrer Google reCAPTCHA v3.

**Retour** :
- `isLoaded` : boolean (true quand le script reCAPTCHA est chargé)
- `executeRecaptcha` : (action: string) => Promise<string | null>

**Usage** :
```tsx
const { isLoaded, executeRecaptcha } = useRecaptcha();

// Dans un handler
const handleSubmit = async () => {
  const token = await executeRecaptcha('inscription');
  // Envoyer le token dans le header x-recaptcha-token
};
```

**Configuration** :
- Nécessite `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` dans `.env`
- Charge automatiquement le script reCAPTCHA
- Bypass automatique en dev si la clé n'est pas configurée

## 🎨 Design System

### Palette de couleurs

- **Primary** : Indigo (indigo-600, indigo-700)
- **Success** : Vert (green-500, green-600)
- **Error** : Rouge (red-500, red-600)
- **Warning** : Jaune (yellow-500, yellow-600)
- **Info** : Bleu (blue-500, blue-600)
- **Neutral** : Gris (gray-50 à gray-900)

### Typographie

- **Titres principaux** : text-4xl / text-5xl / text-6xl, font-bold
- **Titres secondaires** : text-2xl / text-3xl, font-semibold
- **Sous-titres** : text-lg / text-xl, font-medium
- **Corps de texte** : text-base / text-sm
- **Helper text** : text-xs / text-sm, text-gray-600

### Espacements

- **Sections** : py-12 / py-20
- **Cards** : p-6 / p-8
- **Inputs/Buttons** : px-3 py-2 / px-4 py-2

### Bordures et ombres

- **Bordures** : border border-gray-200 / border-2
- **Radius** : rounded-lg / rounded-xl
- **Ombres** : shadow-sm / shadow-md / shadow-lg

## 📱 Responsive Design

Tous les composants sont responsives grâce à Tailwind CSS :

- **Mobile First** : Classes de base pour mobile
- **Breakpoints** :
  - `sm:` : ≥ 640px
  - `md:` : ≥ 768px
  - `lg:` : ≥ 1024px
  - `xl:` : ≥ 1280px

**Exemples** :
```tsx
// Grille responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Texte responsive
<h1 className="text-3xl md:text-4xl lg:text-5xl">

// Flex responsive
<div className="flex flex-col sm:flex-row gap-4">
```

## 🔒 Sécurité UI

### Rate Limiting
- 5 inscriptions maximum par heure par IP
- Message d'erreur avec temps restant avant de pouvoir réessayer
- Headers de rate limiting retournés

### CAPTCHA
- Google reCAPTCHA v3 intégré automatiquement
- Pas d'interaction utilisateur (invisible)
- Score minimum de 0.5 requis
- Bypass automatique en développement

### Validation côté client
- Validation des champs en temps réel
- Messages d'erreur clairs et en français
- Champs requis marqués avec une astérisque rouge
- Boutons désactivés si validation échoue

## 🚀 Optimisations

### Performance
- **Client Components** uniquement là où nécessaire (`'use client'`)
- **Suspense** pour le loading state
- **Images optimisées** avec Next.js Image (si ajoutées)
- **Code splitting** automatique avec Next.js

### SEO
- Metadata appropriés dans chaque page
- Langue française (`lang="fr"`)
- Balises sémantiques HTML5

### Accessibilité
- Labels associés aux inputs
- Textes alternatifs pour les icônes
- Contrastes de couleurs suffisants
- Navigation au clavier

## 🧪 Tester l'UI

### En développement

```bash
# Lancer le serveur de développement
pnpm dev

# Ouvrir dans le navigateur
open http://localhost:3000
```

### Pages à tester

1. **Page d'accueil** : http://localhost:3000
2. **Inscription** : http://localhost:3000/inscription
3. **Succès** : http://localhost:3000/inscription/succes?accessKey=test
4. **Suivi** : http://localhost:3000/inscription/suivi?accessKey=test

### Scénario de test complet

1. Accéder à la page d'accueil
2. Cliquer sur "Nouvelle inscription"
3. Remplir l'étape 1 (Type et saison)
4. Cliquer sur "Suivant"
5. Remplir l'étape 2 (Joueur) avec une date de naissance de mineur
6. Cliquer sur "Suivant"
7. Ajouter au moins 1 responsable
8. Cliquer sur "Valider l'inscription"
9. Vérifier la page de succès avec l'accessKey
10. Cliquer sur "Suivre ma demande"
11. Vérifier l'affichage de la licence

## 🎯 Améliorations futures possibles

### Court terme
- [ ] Toast notifications (react-hot-toast ou sonner)
- [ ] Loading skeletons pendant le chargement
- [ ] Animation des transitions entre les étapes
- [ ] Validation en temps réel avec debounce

### Moyen terme
- [ ] Dark mode
- [ ] Multi-langue (i18n)
- [ ] Impression de la licence en PDF
- [ ] QR Code avec l'accessKey

### Long terme
- [ ] Progressive Web App (PWA)
- [ ] Notifications push
- [ ] Chat support en ligne
- [ ] Upload de photos (signature, photo d'identité)

## 📚 Ressources

- **Next.js Documentation** : https://nextjs.org/docs
- **Tailwind CSS** : https://tailwindcss.com/docs
- **React** : https://react.dev
- **reCAPTCHA v3** : https://developers.google.com/recaptcha/docs/v3

## 🆘 Troubleshooting

### Erreur : "Cannot find module '@/components/...'"

Vérifier que `tsconfig.json` contient :
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erreur : "window is not defined"

Ajouter `'use client'` en haut du fichier pour le rendre client-side.

### reCAPTCHA ne se charge pas

Vérifier que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` est définie dans `.env`.
En développement, le CAPTCHA est automatiquement bypassé si la clé n'est pas configurée.

### Styles Tailwind ne s'appliquent pas

```bash
# Nettoyer le cache et rebuild
rm -rf .next
pnpm dev
```

---

**UI Documentation mise à jour** : 2026-01-14
**Version** : 1.0.0
**Status** : ✅ Production Ready
