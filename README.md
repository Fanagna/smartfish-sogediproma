# 🐟 SmartFish Sogediproma

**Application de gestion intelligente de flotte de pêche** — Plateforme complète avec tableau de bord, gestion des captures/stocks/ventes/exportations, et 15 modules IA powered by Google Gemini.

---

## 📋 Table des matières

- [Architecture](#-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation Rapide](#-installation-rapide)
- [Installation Manuelle](#-installation-manuelle)
- [Docker](#-docker)
- [Variables d'environnement](#-variables-denvironnement)
- [API](#-api)
- [Modules IA](#-modules-ia)
- [Captures d'écran](#-captures-décran)
- [Structure du projet](#-structure-du-projet)
- [Technologies](#-technologies)
- [Licence](#-licence)

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend    │     │     API      │     │  Base de     │
│  React + Vite │ ←──→│   Express    │ ←──→│  données     │
│  Tailwind CSS │     │   Prisma     │     │  PostgreSQL  │
│  Recharts     │     │   Gemini IA  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │ Google      │
                     │ Gemini 1.5  │
                     │ Flash/Pro   │
                     └─────────────┘
```

---

## ✨ Fonctionnalités

### 📊 Dashboards (7 pages)
| Dashboard | Description |
|-----------|-------------|
| **Dashboard général** | Vue d'ensemble des KPIs principaux |
| **Dashboard Exécutif** | CA, captures, rentabilité, exports — Graphiques Recharts |
| **Dashboard IA** | Insights IA1, KPIs intelligents, risques, opportunités |
| **Dashboard Opérationnel** | Activités bateaux, captures temps réel, alertes |
| **Dashboard Commercial** | Ventes locales, clients, prévisions |
| **Dashboard Export** | Revenus export, destinations |
| **Dashboard Durabilité** | Radar performance, heatmap espèces, zones sensibles |

### 📋 Pages Métier (8 pages)
| Page | Action |
|------|--------|
| **Flotte** | CRUD bateaux, carburant, maintenance |
| **Captures** | CRUD, filtres, import CSV |
| **Stocks** | CRUD, alertes seuil, analyse FIFO |
| **Achats** | CRUD fournisseurs, mise à jour stock auto |
| **Ventes** | Panier, facture TVA, déduction stock |
| **Exportations** | CRUD, statut, sélecteur stock |
| **Clients** | CRUD, types clients, stats |
| **Anomalies** | Filtres urgence/statut, prise en charge |

### 🤖 Modules IA (15 agents Gemini)
| IA | Module | Description |
|----|--------|-------------|
| **IA1** | Analyse Globale | Insights et KPIs intelligents sur toute l'activité |
| **IA2** | Chatbot Exécutif | Assistant conversationnel avec contexte complet |
| **IA3** | Prédictions Captures | Prévisions 7 jours avec probabilités |
| **IA4** | Maintenance Prédictive | Risques panne par bateau |
| **IA5** | Prévisions Ventes | Demande future par espèce |
| **IA6** | Prévisions Export | Marchés prometteurs |
| **IA7** | Zones de Pêche | Carte interactive OpenStreetMap |
| **IA8** | Optimisation Flotte | Bateaux, zones, équipage, carburant |
| **IA9** | Anomalies Opérationnelles | Détection et enregistrement auto |
| **IA10** | Détection Fraude | Transactions suspectes |
| **IA11** | Prix Marché | Évolution prix, tendances |
| **IA12** | Analyse Risques | Financier, opérationnel, logistique |
| **IA13** | Rapports IA | Génération Markdown (journalier/hebdo/mensuel) |
| **IA14** | Recommandations DG | Actions stratégiques à long terme |
| **IA15** | Chatbot DG | Version exécutive du chatbot |

### 🗺️ Cartographie
- Carte **OpenStreetMap** interactive avec Leaflet
- Marqueurs de captures (couleur par espèce)
- Marqueurs de zones de pêche IA
- **Heatmap** de densité des captures
- Filtres par espèce et zone
- Mode plein écran

## 📦 Prérequis

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** ≥ 14 (ou Docker)
- **Clé API Google Gemini** (gratuite via [Google AI Studio](https://aistudio.google.com/))
- **Git** (optionnel)

---

## 🚀 Installation Rapide

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd smartfish-sogediproma

# 2. Lancer le script d'installation
chmod +x setup.sh
./setup.sh
```

Ou suivez les étapes manuelles ci-dessous.

---

## 🔧 Installation Manuelle

### 1. Base de données PostgreSQL

```bash
# Créer la base de données
createdb smartfish
# ou via psql
psql -U postgres -c "CREATE DATABASE smartfish;"
```

### 2. Configuration du serveur

```bash
cd server

# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Générer le client Prisma et pusher le schéma
npx prisma generate
npx prisma db push

# (Optionnel) Seed la base de données
npm run db:seed

# Démarrer le serveur
npm run dev
```

### 3. Configuration du client

```bash
cd client

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
```

Le client sera accessible sur **http://localhost:5173** et l'API sur **http://localhost:5000**.

### 4. Se connecter

Utilisez les identifiants créés par le seed, ou créez un compte via `/login`.

---

## 🐳 Docker

### Docker Compose (recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Arrêter et supprimer les volumes (réinitialisation complète)
docker-compose down -v
```

### Services Docker

| Service | Port | Description |
|---------|------|-------------|
| **postgres** | 5432 | Base de données PostgreSQL 16 |
| **server** | 5000 | API Express + Prisma |
| **client** | 5173 | Frontend React + Vite (Nginx) |

**Variables d'environnement Docker** : Créez un fichier `.env` à la racine :

```env
JWT_SECRET=votre-secret-jwt
GEMINI_API_KEY=votre-cle-gemini
```

---

## 🔐 Variables d'environnement

### Serveur (`server/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Base de données
DATABASE_URL=postgresql://smartfish:smartfish123@localhost:5432/smartfish

# Authentification
JWT_SECRET=smartfish-jwt-secret-change-in-production

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Client URL (CORS)
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Se connecter |
| `GET` | `/api/auth/me` | Profil utilisateur (auth) |

### Flotte

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/flotte` | Liste des bateaux |
| `GET` | `/api/flotte/:id` | Détail d'un bateau |
| `POST` | `/api/flotte` | Créer un bateau (ADMIN/CAPITAINE) |
| `PUT` | `/api/flotte/:id` | Modifier un bateau |
| `DELETE` | `/api/flotte/:id` | Supprimer un bateau |
| `POST` | `/api/flotte/:id/carburant/utiliser` | Utiliser du carburant |
| `POST` | `/api/flotte/:id/carburant/remplir` | Remplir le carburant |

### Captures

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/captures` | Liste des captures (filtres: espece, bateauId, date) |
| `GET` | `/api/captures/stats` | Statistiques 30 jours |
| `GET` | `/api/captures/stats/mensuelles` | Statistiques mensuelles |
| `GET` | `/api/captures/:id` | Détail d'une capture |
| `POST` | `/api/captures` | Créer une capture |
| `PUT` | `/api/captures/:id` | Modifier une capture |
| `DELETE` | `/api/captures/:id` | Supprimer une capture |
| `POST` | `/api/captures/import` | Import CSV de captures |

### Stocks

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/stocks` | Liste des stocks |
| `GET` | `/api/stocks/:id` | Détail d'un stock |
| `POST` | `/api/stocks` | Créer un stock |
| `PUT` | `/api/stocks/:id` | Modifier un stock |
| `DELETE` | `/api/stocks/:id` | Supprimer un stock |
| `GET` | `/api/stocks/intelligence/rupture` | Stocks en rupture imminente |
| `GET` | `/api/stocks/intelligence/surstock` | Stocks en surstock |
| `POST` | `/api/stocks/intelligence/recommendation` | Recommandation d'achat IA |
| `GET` | `/api/stocks/intelligence/rotation` | Analyse FIFO |
| `GET` | `/api/stocks/intelligence/critiques` | Alertes critiques |

### Ventes & Achats

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/ventes` | Liste des ventes |
| `POST` | `/api/ventes` | Créer une vente |
| `GET` | `/api/ventes/:id` | Détail d'une vente |
| `PUT` | `/api/ventes/:id` | Modifier une vente |
| `DELETE` | `/api/ventes/:id` | Supprimer une vente |
| `GET` | `/api/achats` | Liste des achats |
| `POST` | `/api/achats` | Créer un achat |

### Exportations & Clients

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/exportations` | Liste des exportations |
| `POST` | `/api/exportations` | Créer une exportation |
| `GET` | `/api/clients` | Liste des clients |
| `POST` | `/api/clients` | Créer un client |

### IA (Intelligence Artificielle)

| Méthode | Endpoint | Agent | Description |
|---------|----------|-------|-------------|
| `GET` | `/api/ia/predictions` | IA3/IA11 | Prédictions captures et stocks |
| `GET` | `/api/ia/zones` | IA7 | Zones de pêche recommandées |
| `GET` | `/api/ia/recommandations` | — | Recommandations générales |
| `GET` | `/api/ia/flotte/maintenance/predict` | IA4 | Maintenance prédictive |
| `GET` | `/api/ia/ventes/predict` | IA5 | Prévisions ventes |
| `GET` | `/api/ia/exportations/predict` | IA6 | Prévisions export |
| `GET` | `/api/ia/analyse-globale` | IA1 | Analyse globale de l'activité |
| `POST` | `/api/ia/chat` | IA2/IA15 | Chat assistant exécutif |
| `GET` | `/api/ia/flotte/optimiser` | IA8 | Optimisation flotte |
| `GET` | `/api/ia/recommandations-strategiques` | IA14 | Recommandations DG |
| `POST` | `/api/ia/anomalies-operationnelles/detecter` | IA9 | Détection anomalies |
| `POST` | `/api/ia/fraude/detecter` | IA10 | Détection fraude |
| `GET` | `/api/ia/risques/analyser` | IA12 | Analyse risques |
| `POST` | `/api/ia/rapports/generer?type=` | IA13 | Génération rapports |

### Anomalies & Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/anomalies` | Liste des anomalies |
| `POST` | `/api/anomalies` | Créer une anomalie |
| `PUT` | `/api/anomalies/:id` | Modifier une anomalie |
| `GET` | `/api/stats/commercial` | Stats commerciales |
| `GET` | `/api/stats/durabilite` | Stats durabilité |

### Health

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/health` | Health check |

---

## 🤖 Modules IA

SmartFish intègre **15 agents IA** alimentés par **Google Gemini 1.5 Flash** qui analysent les données en temps réel et fournissent des insights exploitables.

### Comment ça marche ?

1. Le frontend envoie une requête à un endpoint `/ia/*`
2. Le backend récupère les dernières données (captures, stocks, bateaux...)
3. Un **prompt structuré** est envoyé à Gemini avec les données
4. Gemini répond en **JSON** que le backend valide et retourne
5. Les décisions sont **journalisées** dans la table `DecisionLog`

### Configuration Gemini

```env
GEMINI_API_KEY=your-api-key-here
```

Obtenez votre clé gratuitement sur [Google AI Studio](https://aistudio.google.com/).

> 💡 **Note** : Sans clé Gemini, les pages IA afficheront une erreur. Les fonctionnalités métier (CRUD) restent accessibles.

---

## 🖼️ Captures d'écran

## Aperçus de l'application

| Login | Dashboard |
|-------|-----------|
| ![Login](/screenshots/login.svg) | ![Dashboard](/screenshots/dashboard.svg) |

| Cartographie | Stock Intelligence IA |
|--------------|----------------------|
| ![Cartographie](/screenshots/cartographie.svg) | ![Stock IA](/screenshots/stock-ia.svg) |

> 💡 **Note :** Les captures d'écran sont au format SVG vectoriel. Ouvrez-les dans votre navigateur pour une vue interactive. Des captures PNG réelles peuvent être générées en lançant l'application et en utilisant les outils développeur du navigateur (Print → PDF ou screenshot).

---

## 📁 Structure du projet

```
smartfish-sogediproma/
├── client/                     # Frontend React + Vite
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── charts/         # Graphiques + Carte Leaflet
│   │   │   ├── layout/         # Sidebar, Header, Layout
│   │   │   └── ui/             # Card, Button, Modal, Spinner
│   │   ├── pages/              # Pages métier + IA (14)
│   │   │   ├── ia/             # 14 pages IA
│   │   │   └── ...             # 8 pages métier
│   │   ├── services/           # 7 services API
│   │   ├── hooks/              # useAuth
│   │   ├── stores/             # Zustand (auth)
│   │   └── utils/              # Constantes
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                     # Backend Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # 17 modèles
│   │   └── seed.js             # Données de démo
│   ├── src/
│   │   ├── controllers/        # 15 contrôleurs
│   │   ├── routes/             # 12 fichiers de routes
│   │   ├── services/           # 8 services métier
│   │   ├── middlewares/        # auth, error, validate
│   │   ├── config/             # database, gemini
│   │   └── utils/              # logger
│   ├── tests/                  # Tests unitaires
│   └── Dockerfile
│
├── docker-compose.yml
├── setup.sh
└── README.md
```

---

## 🛠️ Technologies

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.3 | UI Framework |
| Vite | 5.3 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| Recharts | 2.12 | Graphiques |
| React Router | 6.23 | Routage |
| React Query | 5.40 | Data fetching |
| Zustand | 4.5 | State management |
| React Hook Form | 7.52 | Formulaires |
| Leaflet | 1.9 | Cartes OpenStreetMap |
| react-leaflet | 4.2 | React wrapper Leaflet |
| Axios | 1.7 | HTTP client |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js | 20 | Runtime |
| Express | 4.19 | Framework HTTP |
| Prisma | 5.12 | ORM PostgreSQL |
| PostgreSQL | 16 | Base de données |
| JSON Web Token | 9.0 | Authentification |
| bcryptjs | 2.4 | Hash mots de passe |
| Google Gemini | 0.11 | IA générative |
| node-cron | 3.0 | Tâches planifiées |

---

## 🧪 Tests

```bash
cd server
npm test
```

Les tests couvrent :
- **Auth** : inscription, connexion, JWT, rôles
- **Captures** : CRUD, validation, filtres
- **IA** : endpoints mockés avec réponses simulées

---

## 📄 Licence

MIT © SmartFish Sogediproma

---

## 🙏 Remerciements

- [Google Gemini](https://deepmind.google/technologies/gemini/) pour l'IA générative
- [OpenStreetMap](https://www.openstreetmap.org/) pour les tuiles cartographiques
- [React Leaflet](https://react-leaflet.js.org/) pour l'intégration Leaflet
- [Recharts](https://recharts.org/) pour les graphiques
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [Prisma](https://www.prisma.io/) pour l'ORM
