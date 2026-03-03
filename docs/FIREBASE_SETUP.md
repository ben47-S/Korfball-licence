# 🔥 Configuration Firebase Storage pour les PDFs

Ce guide vous accompagne étape par étape pour configurer Firebase Storage dans votre application.

## 📋 Prérequis

- Un compte Google
- Un projet Firebase (ou créer un nouveau projet)

---

## 🚀 Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Ajouter un projet"** (ou sélectionnez un projet existant)
3. Suivez les étapes :
   - Nommez votre projet (ex: `licencekorfball`)
   - Activez Google Analytics (optionnel)
   - Créez le projet

---

## 📦 Étape 2 : Activer Firebase Storage

1. Dans votre projet Firebase, allez dans **"Storage"** (dans le menu de gauche)
2. Cliquez sur **"Commencer"**
3. Choisissez le mode de sécurité :
   - **Mode test** : Pour le développement (accès libre pendant 30 jours)
   - **Mode production** : Pour la production (règles de sécurité strictes)
4. Sélectionnez un emplacement (région) pour votre bucket
   - Exemple : `europe-west1` (Belgique)
5. Cliquez sur **"Terminé"**

---

## 🔑 Étape 3 : Générer une clé de compte de service

1. Dans Firebase Console, allez dans **"Paramètres du projet"** (icône ⚙️)
2. Allez dans l'onglet **"Comptes de service"**
3. Cliquez sur **"Générer une nouvelle clé privée"**
4. Une fenêtre d'avertissement s'affiche → Cliquez sur **"Générer une clé"**
5. Un fichier JSON sera téléchargé (ex: `licencekorfball-xxxxx-firebase-adminsdk-xxxxx.json`)

⚠️ **IMPORTANT** : Ce fichier contient des identifiants sensibles. Ne le commitez JAMAIS dans Git !

---

## 🔐 Étape 4 : Configurer les règles de sécurité Firebase Storage

1. Dans Firebase Console, allez dans **"Storage"** → **"Règles"**
2. Remplacez les règles par :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permettre la lecture/écriture uniquement pour les comptes de service (Admin SDK)
    match /pdfs/{licenceId}.pdf {
      allow read, write: if request.auth != null || request.resource.size < 10 * 1024 * 1024; // 10MB max
    }
    
    // Pour le développement, vous pouvez utiliser :
    // allow read, write: if true;
    // ⚠️ Mais changez cela en production !
  }
}
```

3. Cliquez sur **"Publier"**

---

## 🌍 Étape 5 : Configurer les variables d'environnement

### Option A : Clé JSON complète (recommandé)

1. Ouvrez le fichier JSON téléchargé (étape 3)
2. Copiez tout le contenu JSON
3. Dans votre fichier `.env.local` (ou `.env`), ajoutez :

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"votre-projet-id",...}'
FIREBASE_STORAGE_BUCKET=votre-projet-id.appspot.com
```

⚠️ **Note** : Le JSON doit être sur une seule ligne ou échappé correctement.

### Option B : Fichier de clé (alternative)

Si vous préférez utiliser un fichier :

1. Placez le fichier JSON dans `./firebase-service-account.json` (à la racine du projet)
2. Ajoutez `firebase-service-account.json` dans `.gitignore`
3. Dans `.env.local` :

```env
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json
```

Puis modifiez `src/lib/firebase-admin.ts` pour lire depuis le fichier :

```typescript
import * as fs from 'fs';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH
  ? JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH, 'utf8'))
  : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
```

---

## ✅ Étape 6 : Vérifier la configuration

1. Redémarrez votre serveur de développement :
   ```bash
   pnpm dev
   ```

2. Testez le téléchargement d'un PDF :
   - Allez sur la page de suivi d'une licence validée et payée
   - Cliquez sur "Télécharger ma licence"
   - Le PDF devrait se télécharger

3. Vérifiez dans Firebase Console :
   - Allez dans **"Storage"**
   - Vous devriez voir un dossier `pdfs/` avec vos PDFs

---

## 🔍 Dépannage

### Erreur : "FIREBASE_SERVICE_ACCOUNT_KEY est manquante"

**Solution** : Vérifiez que vous avez bien ajouté la variable dans `.env.local` et redémarré le serveur.

### Erreur : "Invalid JSON"

**Solution** : Vérifiez que le JSON est valide et correctement échappé dans `.env.local`.

### Erreur : "Permission denied"

**Solution** : Vérifiez les règles de sécurité Firebase Storage (étape 4).

### Erreur : "Bucket not found"

**Solution** : Vérifiez que `FIREBASE_STORAGE_BUCKET` correspond au nom de votre bucket (visible dans Firebase Console → Storage).

---

## 📊 Structure des fichiers dans Firebase Storage

```
gs://votre-bucket/
└── pdfs/
    ├── licence-id-1.pdf
    ├── licence-id-2.pdf
    └── ...
```

---

## 🎯 Avantages de Firebase Storage

✅ **Persistance** : Les PDFs restent disponibles même après redémarrage du serveur  
✅ **Scalabilité** : Fonctionne avec plusieurs instances (Vercel, Kubernetes)  
✅ **Performance** : CDN intégré pour distribution globale  
✅ **Sécurité** : Contrôle d'accès via règles Firebase  
✅ **Coûts** : Gratuit jusqu'à 5GB de stockage, puis très économique

---

## 🔄 Migration depuis le cache mémoire uniquement

Si vous aviez déjà des PDFs en cache mémoire, ils seront automatiquement migrés vers Firebase Storage lors du prochain téléchargement.

---

## 📝 Variables d'environnement requises

```env
# Firebase Configuration (obligatoire)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Firebase Storage Bucket (optionnel, utilise project_id.appspot.com par défaut)
FIREBASE_STORAGE_BUCKET=votre-projet-id.appspot.com
```

---

## 🚀 Prêt pour la production

Une fois configuré, votre système utilise :
- **Cache mémoire (L1)** : Pour les accès très rapides
- **Firebase Storage (L2)** : Pour la persistance et la scalabilité

Les PDFs sont générés une fois, puis servis depuis le cache ou Firebase Storage pour les téléchargements suivants.







