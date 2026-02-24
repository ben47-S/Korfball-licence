# 📦 Configuration pnpm - Guide complet

Ce projet utilise **pnpm** comme gestionnaire de packages pour des installations plus rapides et une meilleure gestion de l'espace disque.

## 🎯 Pourquoi pnpm ?

- ⚡ **2x plus rapide** que npm
- 💾 **Économise l'espace disque** (liens symboliques vers un store global)
- 🔒 **Plus sécurisé** (évite les dépendances fantômes)
- 📦 **Lockfile déterministe** (pnpm-lock.yaml)
- 🚀 **Parfait pour les monorepos**

## 📥 Installation de pnpm

### Installation globale

```bash
# Via npm (recommandé)
npm install -g pnpm

# Via Homebrew (macOS/Linux)
brew install pnpm

# Via Scoop (Windows)
scoop install pnpm

# Via Chocolatey (Windows)
choco install pnpm
```

### Vérifier l'installation

```bash
pnpm --version
# Devrait afficher 8.x ou supérieur
```

## 🚀 Setup du projet

### 1. Cloner et installer

```bash
# Cloner le repo
git clone <url-du-repo>
cd licencekorfball

# Installer toutes les dépendances
pnpm install
```

### 2. Configuration environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec vos valeurs
code .env  # ou nano .env
```

### 3. Base de données

```bash
# Générer le client Prisma
pnpm prisma generate

# Appliquer les migrations
pnpm prisma migrate dev

# (Optionnel) Seed les données de test
pnpm prisma db seed
```

### 4. Lancer le projet

```bash
# Mode développement
pnpm dev

# Build production
pnpm build

# Lancer en production
pnpm start
```

## 🧪 Tests avec pnpm

```bash
# Tous les tests
pnpm test

# Tests en mode watch
pnpm test:watch

# Tests unitaires uniquement
pnpm test:unit

# Tests d'intégration uniquement
pnpm test:integration

# Tests avec couverture
pnpm test:coverage
```

## 📦 Gestion des dépendances

### Ajouter une dépendance

```bash
# Dépendance de production
pnpm add nom-package

# Dépendance de développement
pnpm add -D nom-package

# Dépendance globale
pnpm add -g nom-package

# Version spécifique
pnpm add nom-package@1.2.3
```

### Retirer une dépendance

```bash
pnpm remove nom-package
```

### Mettre à jour

```bash
# Toutes les dépendances
pnpm update

# Une dépendance spécifique
pnpm update nom-package

# À la dernière version (ignore semver)
pnpm update nom-package --latest
```

### Lister

```bash
# Toutes les dépendances
pnpm list

# Dépendances obsolètes
pnpm outdated

# Audit de sécurité
pnpm audit
```

## 🔧 Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| **dev** | `pnpm dev` | Serveur de développement |
| **build** | `pnpm build` | Build production |
| **start** | `pnpm start` | Démarrer en production |
| **lint** | `pnpm lint` | Linter le code |
| **lint:fix** | `pnpm lint:fix` | Fix auto des erreurs |
| **test** | `pnpm test` | Tous les tests |
| **test:watch** | `pnpm test:watch` | Tests en mode watch |
| **test:unit** | `pnpm test:unit` | Tests unitaires |
| **test:integration** | `pnpm test:integration` | Tests d'intégration |
| **test:coverage** | `pnpm test:coverage` | Tests avec couverture |

### Scripts Prisma

| Script | Commande | Description |
|--------|----------|-------------|
| **Generate** | `pnpm prisma generate` | Générer le client |
| **Migrate** | `pnpm prisma migrate dev` | Créer une migration |
| **Deploy** | `pnpm prisma migrate deploy` | Appliquer en prod |
| **Studio** | `pnpm prisma studio` | Interface graphique |
| **Reset** | `pnpm prisma migrate reset` | Reset complet |
| **Seed** | `pnpm prisma db seed` | Seed la base |

## 🎨 Configuration pnpm

### Fichier .npmrc (optionnel)

Créer un fichier `.npmrc` à la racine pour personnaliser pnpm :

```ini
# Strict peer dependencies
strict-peer-dependencies=false

# Auto install peers
auto-install-peers=true

# Shamefully hoist (si problème avec Next.js)
shamefully-hoist=false

# Store directory (optionnel)
# store-dir=~/.pnpm-store

# Cache directory
# cache-dir=~/.pnpm-cache
```

### Commandes de configuration

```bash
# Voir toutes les configs
pnpm config list

# Définir une config
pnpm config set store-dir /path/to/store

# Supprimer une config
pnpm config delete store-dir
```

## 🧹 Nettoyage

### Nettoyer le projet

```bash
# Supprimer node_modules et lockfile
rm -rf node_modules pnpm-lock.yaml

# Réinstaller
pnpm install
```

### Nettoyer le cache pnpm

```bash
# Nettoyer le store global
pnpm store prune

# Voir l'utilisation du store
pnpm store status
```

### Reset complet

```bash
# Tout supprimer
rm -rf node_modules .next coverage pnpm-lock.yaml

# Réinstaller et regénérer
pnpm install
pnpm prisma generate
```

## 🔄 Migration depuis npm/yarn

### Supprimer les anciens fichiers

```bash
# Supprimer package-lock.json ou yarn.lock
rm package-lock.json
# ou
rm yarn.lock

# Supprimer node_modules
rm -rf node_modules
```

### Installer avec pnpm

```bash
pnpm install
```

### Différences de commandes

| npm | yarn | pnpm |
|-----|------|------|
| `npm install` | `yarn` | `pnpm install` |
| `npm install pkg` | `yarn add pkg` | `pnpm add pkg` |
| `npm install -D pkg` | `yarn add -D pkg` | `pnpm add -D pkg` |
| `npm uninstall pkg` | `yarn remove pkg` | `pnpm remove pkg` |
| `npm update` | `yarn upgrade` | `pnpm update` |
| `npm run script` | `yarn script` | `pnpm script` |

## 🐛 Troubleshooting

### Problème : "Peer dependencies"

```bash
# Option 1 : Installer avec --no-strict-peer-dependencies
pnpm install --no-strict-peer-dependencies

# Option 2 : Ajouter dans .npmrc
echo "strict-peer-dependencies=false" >> .npmrc
pnpm install
```

### Problème : "Cannot find module"

```bash
# Regénérer node_modules
rm -rf node_modules
pnpm install

# Si le problème persiste, essayer shamefully-hoist
echo "shamefully-hoist=true" >> .npmrc
pnpm install
```

### Problème : Lockfile incompatible

```bash
# Supprimer et recréer le lockfile
rm pnpm-lock.yaml
pnpm install
```

### Problème : Build échoue

```bash
# Nettoyer complètement
rm -rf node_modules .next pnpm-lock.yaml
pnpm install
pnpm prisma generate
pnpm build
```

## 📊 Performance

### Comparer les temps d'installation

```bash
# Mesurer l'installation
time pnpm install

# Comparer avec npm (pour info)
rm -rf node_modules
time npm install
```

### Vérifier l'espace disque

```bash
# Voir la taille du store pnpm
du -sh ~/.pnpm-store
# ou
pnpm store status
```

## 🔐 Sécurité

### Audit des vulnérabilités

```bash
# Audit complet
pnpm audit

# Audit avec rapport JSON
pnpm audit --json > audit-report.json

# Fix automatique (si possible)
pnpm audit --fix
```

## 📚 Ressources

- **Documentation officielle** : https://pnpm.io
- **Migration depuis npm** : https://pnpm.io/migration
- **CLI Commands** : https://pnpm.io/cli/add
- **Configuration** : https://pnpm.io/npmrc
- **Workspaces** : https://pnpm.io/workspaces

## ✅ Checklist d'installation

- [ ] pnpm installé globalement (`npm install -g pnpm`)
- [ ] Dépendances installées (`pnpm install`)
- [ ] `.env` configuré (copie de `.env.example`)
- [ ] Prisma client généré (`pnpm prisma generate`)
- [ ] Migrations appliquées (`pnpm prisma migrate dev`)
- [ ] Tests passent (`pnpm test`)
- [ ] Serveur démarre (`pnpm dev`)

## 🎯 Commandes rapides

```bash
# Setup complet du projet
pnpm install && pnpm prisma generate && pnpm prisma migrate dev

# Reset complet
rm -rf node_modules .next pnpm-lock.yaml && pnpm install && pnpm prisma generate

# Tests complets
pnpm test:coverage

# Build et démarrer
pnpm build && pnpm start
```

---

**Version pnpm recommandée** : 8.x ou supérieur
**Date de mise à jour** : 2026-01-14

Pour plus de détails sur les commandes, voir **[COMMANDS_PNPM.md](./COMMANDS_PNPM.md)**.
