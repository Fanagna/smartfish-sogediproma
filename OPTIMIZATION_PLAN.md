# ⚡ PLAN D'OPTIMISATION — SmartFish SOGEDIPROMA

**Objectif :** Alléger, sécuriser et fiabiliser le projet

---

## PRIORITÉ 1 — 🔴 Actions immédiates (sécurité & stabilité)

### 1.1 Nettoyage du code mort mobile
- **Action :** Supprimer le dossier `mobile/` entier (~1200 lignes, 9 fichiers)
- **Gain :** -30% du code total du projet, élimination de 2 vulnérabilités potentielles
- **Risque :** Faible (confirmé "en test/abandonné" par l'équipe)
- **Commande :** `rm -rf mobile/`

### 1.2 Renforcement du rate limiter
- **Action :** Passer de 100 à 300 requêtes/15 min
- **Fichier :** `server/src/index.js`
- **Gain :** Élimination des blocages utilisateur en production

### 1.3 Validation des ENV au démarrage
- **Action :** Ajouter une vérification des variables d'env critiques au démarrage du serveur
- **Fichier :** `server/src/index.js`
- **Gain :** Démarrage fiable, alertes immédiates si config manquante

### 1.4 Ajout des index Prisma manquants
- **Action :** Ajouter des index sur `date` dans les tables Capture, Vente, Exportation, Anomalie
- **Fichier :** `server/prisma/schema.prisma`
- **Gain :** Requêtes stats 10-50x plus rapides à terme

---

## PRIORITÉ 2 — 🟠 Architecture & Qualité

### 2.1 Mutualisation des instances Gemini
- **Action :** Supprimer `server/src/config/gemini.js`, utiliser l'instance dans `iaService.js` comme source unique
- **Gain :** Cohérence, évite double init

### 2.2 Fusion des services frontend dupliqués
| Fichier à supprimer | Fusionner dans | Raison |
|---------------------|----------------|--------|
| `client/src/services/captureService.js` | `capturesService.js` | Doublon partiel |
| `client/src/services/flotteService.js` | `bateauService.js` | Doublon partiel |
| `client/src/services/exportService.js` | `exportationService.js` | Renommer en stats ou fusionner |
| `server/src/services/maintenanceIAService.js` | Supprimer | Jamais importé |

### 2.3 Refactoring du contrôleur IA
- **Action :** 
  1. Créer un helper `getIAContext()` qui charge TOUTES les données en une seule requête
  2. Mettre en cache le résultat (TTL: 5 minutes)
  3. Réduire le nombre d'appels Gemini (actuellement 16 endpoints distincts)
- **Gain :** -70% d'appels API Gemini, -80% de requêtes DB pour l'IA

### 2.4 Ajout d'une commande `npm test`
- **Action :** Ajouter `"test": "node --experimental-vm-modules node_modules/.bin/jest"` OU le runner adapté
- **Fichier :** `server/package.json` et `client/package.json`

---

## PRIORITÉ 3 — 🟡 Améliorations continues

### 3.1 Standardisation des endpoints API
- Uniformiser la pagination : `?page=1&limit=20` partout
- Uniformiser le format des erreurs : `{ error: string, code: string, details?: any }`
- Uniformiser les URLs API (français ou anglais, pas de mélange)

### 3.2 Logger professionnel
- Remplacer `console.log` par `winston` avec :
  - Sortie fichier + console selon `NODE_ENV`
  - Niveaux configurables (debug, info, warn, error)
  - Format JSON en production

### 3.3 Ajout d'une stratégie de purge DecisionLog
- **Action :** Garder les logs IA pendant 30 jours max, supprimer les plus anciens
- **Fichier :** `server/src/services/iaService.js`

### 3.4 Cache in-memory pour les métriques dashboard
- **Action :** Ajouter un cache TTL (30 secondes) pour les endpoints `/api/stats/*` qui sont sollicités à chaque re-render des dashboards

### 3.5 Ajout de la gestion du mode hors-ligne dans l'UI web
- **Alerter l'utilisateur :** Quand `fallback: true` est reçu dans les réponses IA, afficher une notification "📡 Mode dégradé — données basées sur des estimations"

---

## 📈 ESTIMATION DES GAINS

| Action | Temps | Gain estimé |
|--------|-------|-------------|
| Nettoyage mobile | 15 min | -1200 lignes, -30% du code |
| Rate limiter | 2 min | Élimination des blocages 429 |
| Fusion services | 30 min | -5 fichiers, -150 lignes |
| Refactoring IA | 4h | -70% coûts Gemini, -80% requêtes DB |
| Index DB | 15 min | Requêtes stats 10-50x + rapides |
| Logger | 1h | Debug production possible |
| Cache stats | 2h | Réduction charge serveur ~90% |
| **TOTAL** | **~8h** | **Projet 40% plus léger, 2x plus fiable** |

---

*Plan généré par Buffy — Audit Système Senior SmartFish SOGEDIPROMA*
