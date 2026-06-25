# ─── SMARTFISH SOGEDIPROMA — Déploiement ───

Ce guide explique comment déployer la plateforme SMARTFISH en production.

> ⚠️ **Architecture** : Le projet est composé de **2 parties** :
> - **Frontend** (client/) → React + Vite → **Vercel** (ou Netlify)
> - **Backend** (server/) → Express + Prisma + Socket.io → **Railway / Render / Fly.io**

---

## 1️⃣ Déploiement du Frontend sur Vercel

### Prérequis
- Un compte [Vercel](https://vercel.com)
- Le projet pushé sur GitHub / GitLab / Bitbucket

### Étapes

1. **Connectez Vercel à votre dépôt GitHub**
   - Aller sur [vercel.com/new](https://vercel.com/new)
   - Importer le dépôt `smartfish-sogediproma`
   - Vercel détectera automatiquement la configuration `vercel.json`

2. **Configuration automatique**
   - Les fichiers `vercel.json` (racine + client/) sont déjà configurés :
     - Build : `cd client && npm install && npm run build`
     - Output : `client/dist`
     - Rewrites SPA : toutes les routes → `/index.html`

3. **Variables d'environnement**
   - Dans le dashboard Vercel → votre projet → **Settings → Environment Variables**
   - Ajoutez :
     ```
     VITE_API_URL=https://votre-backend.railway.app/api
     VITE_SOCKET_URL=https://votre-backend.railway.app
     ```

4. **Déployez !**
   - Vercel déploiera automatiquement à chaque push sur `main`
   - ⚡ Le frontend sera accessible sur `https://smartfish.vercel.app`

---

## 2️⃣ Déploiement du Backend (Express + Prisma + Socket.io)

> ⚠️ **Important** : Le backend utilise **WebSocket (Socket.io)** et **Cron jobs (node-cron)**.
> Ces fonctionnalités ne sont **pas supportées** par Vercel Serverless Functions.
> Vous devez déployer le backend sur un service qui supporte les processus longs.

### Option A : Railway (recommandé ✅)

1. Créez un compte sur [Railway](https://railway.app)
2. Créez un nouveau projet → **Deploy from GitHub repo**
3. Sélectionnez `smartfish-sogediproma` et le répertoire `server/`
4. Railway détectera automatiquement le `package.json` et la commande `npm start`

**Variables d'environnement Railway :**
```
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=votre-secret-tres-long-et-securise
GEMINI_API_KEY=votre-cle-gemini
CLIENT_URL=https://smartfish.vercel.app
NODE_ENV=production
```

**Base de données :**
- Railway propose PostgreSQL intégré → **New → Database → PostgreSQL**
- Copiez l'URL de connexion (`DATABASE_URL`) dans les variables d'environnement
- Exécutez les migrations via Railway CLI ou dashboard :
  ```bash
  npx prisma migrate deploy
  ```

### Option B : Render

1. Créez un compte sur [Render](https://render.com)
2. **New → Web Service** → Connectez votre GitHub
3. Configurez :
   - **Name** : `smartfish-api`
   - **Root Directory** : `server`
   - **Build Command** : `npm install && npx prisma generate`
   - **Start Command** : `node src/index.js`
4. **Environment Variables** : identiques à celles ci-dessus
5. Ajoutez une **PostgreSQL database** via Render Dashboard

### Option C : Fly.io

```bash
flyctl launch --name smartfish-api
flyctl secrets set DATABASE_URL=... JWT_SECRET=... GEMINI_API_KEY=... CLIENT_URL=...
flyctl deploy
```

---

## 3️⃣ Configuration Prisma / Base de données

Après avoir déployé le backend et créé la base de données :

```bash
# Exécuter les migrations
npx prisma migrate deploy

# (Optionnel) Seed les données de test
node prisma/seed.js

# (Optionnel) Seed les données du module Stock Intelligent
node prisma/seedStockIntelligence.js
```

---

## 4️⃣ Vérification finale

1. **Backend** : `https://smartfish-api.railway.app/api/health` → `{ status: "OK" }`
2. **Frontend** : `https://smartfish.vercel.app` → page de connexion
3. **Variables d'environnement frontend** vérifiées :
   - `VITE_API_URL` pointe bien vers le backend (ex: `https://smartfish-api.railway.app/api`)
   - `VITE_SOCKET_URL` pointe vers le backend socket (ex: `https://smartfish-api.railway.app`)

---

## 🔧 Dépannage

| Problème | Solution |
|----------|----------|
| "404 Not Found" sur les routes | Vérifier que `vercel.json` avec rewrites SPA est bien présent |
| Socket.io ne se connecte pas | Vérifier `VITE_SOCKET_URL` et que le backend supporte WebSockets |
| Prisma "Can't reach database" | Vérifier `DATABASE_URL` dans les variables d'environnement |
| CORS errors | Vérifier `CLIENT_URL` dans le backend — doit correspondre à l'URL Vercel |
| Build Vercel échoue | Vérifier les logs de build dans le dashboard Vercel |

---

## 📦 Structure de déploiement

```
smartfish-sogediproma/
├── vercel.json          ← Configuration build monorepo Vercel
├── client/
│   ├── vercel.json      ← Rewrites SPA pour React Router
│   ├── .env.example     ← Variables d'environnement client
│   ├── Dockerfile       ← Alternative déploiement Docker
│   ├── nginx.conf       ← Alternative déploiement Nginx
│   └── src/...
├── server/
│   ├── Dockerfile       ← Alternative déploiement Docker
│   └── src/...
└── ...
```
