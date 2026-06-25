# 🔗 AUDIT DE COHÉRENCE DES ROUTES API — SmartFish SOGEDIPROMA

**Analyse :** Cross-référence systématique entre les routes backend et les appels frontend

---

## ✅ CORRESPONDANCES PARFAITES (30/30 endpoints)

| Route Backend | Service Frontend | Statut |
|---------------|------------------|--------|
| `POST /auth/register` | `authService.register()` | ✅ |
| `POST /auth/login` | `authService.login()` | ✅ |
| `GET /auth/me` | `authService.getMe()` | ✅ |
| `GET/POST/PUT/DEL /flotte/*` | `bateauService.*` | ✅ |
| `GET/POST/PUT/DEL /captures/*` | `capturesService.*` | ✅ |
| `GET /captures/stats` | `capturesService.getCapturesStats()` | ✅ |
| `GET /captures/stats/mensuelles` | `capturesService.getStatsMensuelles()` | ✅ |
| `GET /stocks` | `stockService.getCurrentStock()` | ✅ |
| `GET /stocks/intelligence/*` | `stockService.*` | ✅ |
| `GET/POST/DEL /ventes/*` | `venteService.*` | ✅ |
| `GET/POST/DEL /achats/*` | `achatService.*` | ✅ |
| `GET /achats/fournisseurs` | `achatService.getFournisseurs()` | ✅ |
| `GET/POST /exportations/*` | `exportationService.*` | ✅ |
| `PATCH /exportations/:id/statut` | `exportationService.updateExportationStatut()` | ✅ |
| `GET/POST/PUT/DEL /clients/*` | `clientService.*` | ✅ |
| `GET/POST /anomalies/*` | `anomalieService.*` | ✅ |
| `GET/POST /ia/*` (16 routes) | `iaService.*` | ✅ |
| `GET /ia/analyse-global` | `dashboardService.getIAInsights()` | ✅ |
| `GET /stats` | `dashboardService.getDashboardStats()` | ✅ |
| `GET /stats/commercial` | `commercialService.getCommercialStats()` | ✅ |
| `GET /stats/durabilite` | `durabiliteService.getDurabiliteStats()` | ✅ |
| `GET /stats/export` | `exportService.getExportStats()` | ✅ |
| `GET /stats/operationnel` | `operationnelService.getOperationnelStats()` | ✅ |
| `GET /stats/activities` | Appel inline dans `Dashboard.jsx` | ✅ |
| `GET/POST/PUT/DEL /ordres-mission/*` | `ordreMissionService.*` | ✅ |
| `GET/PATCH /notifications/*` | `notificationService.*` | ✅ |
| `GET /meteo` | `meteoMadagascar.js` → `api.get('/meteo')` | ✅ |

---

## 🟡 ROUTES BACKEND ORPHELINES (existent mais jamais appelées par le frontend)

| Route | Méthode | Description | Recommandation |
|-------|---------|-------------|----------------|
| `PATCH /auth/me` | Mise à jour profil | Permet de changer son profil utilisateur | ⚠️ Frontend devrait appeler cette route (profil utilisateur) |
| `GET /users` | Liste utilisateurs (admin) | Gestion des utilisateurs | 🤷 Admin uniquement, peut-être justifié |
| `GET /users/:id` | Détail utilisateur | | 🤷 Admin uniquement |
| `POST /users` | Création utilisateur | | 🤷 Admin uniquement |
| `PUT /users/:id` | Modification utilisateur | | 🤷 Admin uniquement |
| `DELETE /users/:id` | Suppression utilisateur | | 🤷 Admin uniquement |
| `POST /captures/import` | Import CSV captures | Import en masse de captures | 🟡 Route non sécurisée (pas de validation) + jamais appelée |
| `GET /stocks/:id` | Détail stock | | 🟡 Fonctionnellement utile mais pas exposé |
| `POST /stocks` | Création stock | | 🟡 Pas de service frontend associé |
| `PUT /stocks/:id` | Modification stock | | 🟡 Pas de service frontend associé |
| `PATCH /stocks/seuils` | Mise à jour seuils | | 🟡 Pas de service frontend associé |
| `DELETE /stocks/:id` | Suppression stock | | 🟡 Pas de service frontend associé |
| `GET /ia/recommandations` | Recommandations globales | Différent de `/ia/analyse-global` | 🟡 Endpoint IA jamais appelé |
| `POST /ia/anomalies/check` | Détection anomalies IA | Différent de `/anomalies` (CRUD) | 🟡 Endpoint IA jamais appelé |
| `GET /stats/executif-avance` | Dashboard DG avancé | Dashboard exécutif détaillé | 🟡 Dashboard existe mais route non appelée directement |
| `POST /meteo/refresh` | Rafraîchir météo | Force le rechargement | 🟡 Pas d'action utilisateur pour rafraîchir |

---

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. Routes orphelines majeures (probablement utiles)

| Route | Impact |
|-------|--------|
| **`PATCH /auth/me`** | Impossible de modifier son profil depuis l'UI |
| **`GET /stocks/:id`, `POST /stocks`, `PUT /stocks/:id`, `DELETE /stocks/:id`** | Aucun CRUD stock depuis le frontend |
| **`PATCH /stocks/seuils`** | Impossible de modifier les seuils d'alerte depuis l'UI |
| **`GET /ia/recommandations`** | Module de recommandations générales jamais exposé |
| **`GET /stats/activities`** | Timeline d'activités — appelé inline dans Dashboard.jsx mais pas via service |

### 2. Duplication de services frontend (déjà identifié dans l'audit)

| Duplication | Fichiers |
|-------------|----------|
| **`/flotte` CRUD** | `bateauService.js` ET `flotteService.js` (identiques) |
| **`getPredictionsMaintenance()`** | `iaService.js` ET `bateauService.js` (même appel) |

### 3. Routes orphelines mineures (probablement admin uniquement)

| Route | Justification |
|-------|---------------|
| `GET/POST/PUT/DEL /users/*` | Admin uniquement — peut ne pas être exposé intentionnellement |
| `POST /captures/import` | Import CSV — probablement prévu pour un outil externe |
| `POST /meteo/refresh` | Fonctionnel mais pas exposé — le cache s'auto-rafraîchit toutes les heures |

---

## 📊 RÉSUMÉ

| Métrique | Valeur |
|----------|--------|
| Routes backend totales | ~65 |
| Routes appelées par le frontend | ~50 |
| Routes orphelines | 15 (dont 7 probablement légitimes admin) |
| Routes orphelines problématiques | 7 |
| Taux de couverture frontend → backend | ~77% |
| Doublons de services | 2 paires de fichiers |

---

*Rapport généré par Buffy — Audit de cohérence API SmartFish SOGEDIPROMA*
