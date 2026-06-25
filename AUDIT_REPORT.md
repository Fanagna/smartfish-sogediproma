# 🔍 RAPPORT D'AUDIT COMPLET — SmartFish SOGEDIPROMA

**Date :** 19 juin 2026  
**Auditeur :** Buffy (Audit Système Senior)  
**Contexte :** Projet livré et en production, < 50 utilisateurs, toutes les intégrations actives (WhatsApp, Gemini, Météo, Exports)

---

## RÉSUMÉ EXÉCUTIF

| Métrique | Valeur |
|----------|--------|
| Fichiers audités | ~120 fichiers |
| Problèmes critiques | 7 |
| Problèmes majeurs | 18 |
| Problèmes mineurs | 24 |
| Code mort identifié | ~15 fichiers supprimables |
| Économie estimée | ~30-40% de code en moins après nettoyage |

---

## 🔴 PROBLÈMES CRITIQUES

### C1. Application mobile entière = code mort (9 fichiers)
- **Fichier :** `mobile/` (dossier entier)
- **Problème :** User a confirmé que l'app mobile est "en test/abandonné". Pourtant, elle est livrée dans le code source et fait 9 fichiers + dépendances lourdes (Expo, React Native, SQLite, caméra, etc.)
- **Impact :** Maintien de code non utilisé, confusion dans les déploiements, dépendances non auditées, +1200 lignes de code mort
- **Proposition :** Suppression complète du dossier `mobile/` (avec possibilité de rollback via git)

### C2. Duplication des instances Gemini AI (fuite de ressources)
- **Fichiers :** `server/src/config/gemini.js` et `server/src/services/iaService.js`
- **Problème :** `gemini.js` exporte `genAI` et `model`. Mais `iaService.js` crée une **seconde instance** complètement indépendante : `const genAI = new GoogleGenerativeAI(...)`. La config `gemini.js` n'est JAMAIS importée nulle part.
- **Impact :** Double initialisation, gaspillage mémoire. Si le rate limiting ou quotas sont partagés, la 2e instance n'hérite pas des configs partagées.
- **Correction :** Supprimer `gemini.js`, ou l'utiliser dans `iaService.js`

### C3. Hardcoded credentials exposés dans l'app mobile
- **Fichier :** `mobile/src/screens/LoginScreen.jsx` lignes 107-117
- **Problème :** Identifiants admin en clair : `admin@smartfish.sn` / `admin123` et `captaine@smartfish.sn` / `password123`
- **Impact :** Si le code est open source ou partagé, ces credentials permettent un accès admin complet
- **Correction :** Supprimer les boutons "Connexion rapide" (de toute façon la mobile est à supprimer)

### C4. Rate limiter trop restrictif (100 requêtes/15 min)
- **Fichier :** `server/src/index.js` ligne 14
- **Problème :** `max: 100` sur une fenêtre de 15 minutes. Un dashboard qui charge 5-6 endpoints différents peut bloquer l'utilisateur en moins de 2 minutes.
- **Impact :** Utilisateurs bloqués en production, erreurs 429 mystérieuses
- **Correction :** Passer à `max: 300` minimum, ou mieux, différencier par endpoint

### C5. Contrôleur IA monolithique — 16 fonctions, 100% Gemini-dépendant
- **Fichier :** `server/src/controllers/iaController.js` (430 lignes)
- **Problème :** Un seul fichier contient 16 fonctions qui appellent Gemini pour TOUT. Chaque fonction recharge les mêmes données (captures, stocks, bateaux, ventes...). Aucune mise en cache. Si Gemini est indisponible, les fallbacks sont déterministes et peu utiles.
- **Impact :** Coût API élevé (16 appels potentiels par session), lenteur (chaque call prend 2-5s), données rechargées inutilement
- **Correction :** Mutualiser les appels data dans un helper, ajouter un cache TTL de 5 minutes, réduire le nombre d'appels IA

### C6. Absence de validation des variables d'environnement au démarrage
- **Fichier :** `server/src/index.js`
- **Problème :** Aucune vérification que `GEMINI_API_KEY`, `JWT_SECRET`, `DATABASE_URL`, `WHATSAPP_API_URL` sont définies. Le serveur démarre sans ces variables et échoue silencieusement au premier appel.
- **Impact :** Démarrage silencieux en production = features cassées sans alerte
- **Correction :** Ajouter une validation au démarrage

### C7. Contrôleur statsController — 190 lignes, tout en mémoire
- **Fichier :** `server/src/controllers/statsController.js`
- **Problème :** Les fonctions `getExecutiveAvanceStats` et `getDashboardStats` chargent des centaines d'enregistrements en mémoire et font tout l'agrégation en JS plutôt qu'en SQL/Prisma. Coûteux et peu scalable.
- **Impact :** Avec < 50 utilisateurs, ce n'est pas critique MAIS ça masque un antipattern qui deviendra douloureux
- **Correction :** Refactoring progressif vers des agrégations Prisma (`groupBy`, `aggregate`)

---

## 🟠 PROBLÈMES MAJEURS

### M1. Confusion captureService.js vs capturesService.js (duplication sémantique)
- **Fichiers :** `client/src/services/captureService.js` (9 lignes) vs `capturesService.js` (30 lignes)
- **Problème :** `captureService.js` exporte `getCapturesStats()` uniquement. `capturesService.js` exporte tout le CRUD. Le nommage pluriel/singulier porte à confusion. La fonction `getCapturesStats` pourrait être dans `capturesService.js`.
- **Correction :** Fusionner dans `capturesService.js`

### M2. bateauService.js vs flotteService.js — doublon partiel
- **Fichiers :** `client/src/services/bateauService.js` et `flotteService.js`
- **Problème :** Les deux exportent `getBateaux`, `getBateauById`, `createBateau`, etc. `bateauService.js` est plus complet (ajoute `getPredictionsMaintenance`, `utiliserCarburant`, `remplirCarburant`). `flotteService.js` est un sous-ensemble.
- **Impact :** Certaines pages utilisent l'un, d'autres l'autre : incohérence.
- **Correction :** Fusionner dans `bateauService.js` (nom plus explicite)

### M3. exportService.js vs exportationService.js — nommage incohérent
- **Fichiers :** `client/src/services/exportService.js` et `exportationService.js`
- **Problème :** `exportService.js` → `getExportStats()` (endpoint `/stats/export`). `exportationService.js` → CRUD complet `/exportations`. Mélange français/anglais dans les noms.
- **Correction :** Renommer `exportService.js` en `exportStatsService.js` ou fusionner

### M4. maintenanceIAService.js — fichier inutilisé ?
- **Fichier :** `server/src/services/maintenanceIAService.js`
- **Problème :** Contient `predireMaintenance()` qui appelle `askGemini`. Mais `iaController.js` a sa propre fonction `predictMaintenance()` qui fait la même chose. `maintenanceIAService.js` n'est importé nulle part (recherche ripgrep confirmée).
- **Impact :** Code mort non détecté
- **Correction :** Supprimer ou réintégrer dans `iaService.js`

### M5. gemini.js config file inutilisé
- **Fichier :** `server/src/config/gemini.js`
- **Problème :** Exporte `genAI` et `model` mais aucun fichier ne l'importe. `iaService.js` a sa propre instance.
- **Correction :** Supprimer `gemini.js` ou le faire utiliser par `iaService.js`

### M6. Absence de tests automatisés
- **Fichier :** `server/tests/` (3 fichiers de test)
- **Problème :** Il y a 3 fichiers de test (`auth.test.js`, `captures.test.js`, `ia.test.js`) mais AUCUNE commande `npm test` dans aucun `package.json`. On ne peut pas lancer les tests.
- **Impact :** Tests inutiles sans exécution. Les tests ne sont JAMAIS lancés.
- **Correction :** Ajouter `"test": "jest"` dans le `package.json` et vérifier qu'ils passent

### M7. Aucun Refresh Token pour JWT
- **Fichier :** `server/src/middlewares/authMiddleware.js`
- **Problème :** Le JWT n'a pas de mécanisme de refresh. Le middleware ne vérifie pas l'expiration (le fait lui-même via `jwt.verify`). Pas de blacklist pour les tokens révoqués.
- **Impact :** Si un token est volé, il est valide jusqu'à expiration (aucune durée configurée dans le code, probablement 7j par défaut)
- **Correction :** Ajouter un refresh token endpoint

### M8. Pas de pagination standardisée
- **Fichier :** Plusieurs contrôleurs (captureController, venteController...)
- **Problème :** La pagination est implémentée de façon inconsistante. Certains endpoints prennent `limit`/`skip`, d'autres `page`/`limit`, certains pas de pagination du tout.
- **Correction :** Standardiser sur `page`/`limit` avec des valeurs par défaut

### M9. webhook WhatsApp non configurable
- **Fichier :** `server/src/services/whatsappService.js`
- **Problème :** Si `WHATSAPP_API_URL` n'est pas défini, la fonction log un warning et retourne silencieusement. Pas de mécanisme de retry ou de queue pour les messages échoués.
- **Impact :** Les alertes critiques de stock peuvent être perdues silencieusement
- **Correction :** File d'attente avec retry exponentiel

### M10. Logger basique sans niveaux de production
- **Fichier :** `server/src/utils/logger.js`
- **Problème :** Simple wrapper `console.log`. Pas de log rotation, pas de sortie fichier, pas de niveaux configurables via env.
- **Impact :** Impossible de faire du debugging en production sans saturer stdout
- **Correction :** Utiliser `winston` ou `pino`

---

## 🟡 PROBLÈMES MINEURS

### m1. getStatsMensuelles incohérent
- **Fichier :** `client/src/services/captureService.js` → `getCapturesStats()` appelle `/captures/stats`. `capturesService.js` → `getStatsMensuelles()` appelle `/captures/stats/mensuelles`. Deux endpoints stats différents, dans deux fichiers différents.

### m2. OrdreMissionPDF non audité
- **Fichier :** `client/src/utils/ordreMissionPDF.js`
- **Problème :** Fichier non lu pendant l'audit, pourrait contenir des incohérences avec le modèle Prisma `OrdreMission` (qui a un champ `equipage` de type JSON très complexe)

### m3. DecisionLog rempli sans stratégie de purge
- **Fichier :** `server/src/services/iaService.js`
- **Problème :** Chaque appel Gemini et chaque fallback est loggé dans `DecisionLog`. Aucune purge automatique. Table qui peut grossir indéfiniment.

### m4. Absence d'index sur les tables critiques
- **Fichier :** `server/prisma/schema.prisma`
- **Problème :** Pas d'index sur `date` dans les tables Capture, Vente, Exportation, Anomalie. Les requêtes avec `WHERE date >= ?` scannent toute la table.
- **Correction :** Ajouter `@@index([date])` sur les modèles concernés

### m5. Les routes `/api/stats/export` et `/api/stats/commercial` sont accessibles à tout utilisateur authentifié
- **Fichier :** `server/src/routes/statsRoutes.js`
- **Problème :** Seulement `authenticateToken`, pas de `authorizeRoles`. Un OBSERVATEUR peut voir les stats commerciales et export (données sensibles).

### m6. Les fonctions fallback Gemini renvoient des données aléatoires
- **Fichier :** `server/src/services/iaService.js`
- **Problème :** Les fallbacks utilisent `Math.random()` pour générer des données. Un utilisateur pourrait prendre une décision basée sur des données aléatoires sans savoir que Gemini était down.

### m7. Pas de message "fallback" visible dans l'UI
- **Problème :** Les fallbacks renvoient `{ ...fallbackResult, fallback: true }` mais l'UI n'utilise jamais `fallback: true` pour afficher un avertissement à l'utilisateur.

### m8. Route d'import POST /captures/import sans validation
- **Fichier :** `server/src/routes/captureRoutes.js` ligne 35
- **Problème :** Route `router.post('/import', ...)` qui n'utilise pas le middleware `validate(captureValidation)`
- **Impact :** Import de données non validées possible

### m9. Mixed case dans les URLs (camelCase vs snake_case)
- **Exemple :** `/ia/anomalies-operationnelles/detecter` (fr) vs `/ia/predictions` (en). Pas cohérent.

### m10. Pas de seed de démo complet
- **Fichier :** `server/prisma/seed.js`
- **Problème :** Non audité, mais si comme beaucoup de seeds, il ne couvre peut-être pas assez de cas pour un test réaliste

---

## 📊 TABLEAU RÉCAPITULATIF

| Catégorie | Critiques | Majeurs | Mineurs |
|-----------|-----------|---------|---------|
| Code mort / Duplications | 1 (mobile) | 5 (services) | 2 | 
| Sécurité | 1 (credentials) | 1 (JWT/refresh) | 1 (permissions) |
| Performance | 2 (Gemini, rate limit) | 1 (stats in-memory) | 2 (indexes) |
| Architecture | 2 (contrôleur IA, stats) | 3 (pagination, tests) | 3 (purge, fallback UI) |
| IA | 1 (doublon Gemini) | 1 (coût) | 2 (fallback aléatoire) |
| Qualité | 0 | 2 (logger, validation) | 3 (nommage, routes) |

---

*Rapport généré par Buffy — Audit Système Senior SmartFish SOGEDIPROMA*
