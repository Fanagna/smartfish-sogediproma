# 🧹 STRATÉGIE DE SUPPRESSION — SmartFish SOGEDIPROMA

**Objectif :** Supprimer intelligemment le code mort, les doublons et les fonctionnalités redondantes, avec rollback possible.

---

## ✅ ÉTAT ACTUEL — Nettoyage effectué

**Date :** Juin 2026

Les fichiers suivants ont été marqués pour suppression dans `cleanup.js` (mise à jour) :

| # | Élément | Statut |
|---|---------|--------|
| 1 | **Dossier `mobile/`** | ✅ À supprimer (app abandonnée, 9 fichiers) |
| 2 | **`server/src/config/gemini.js`** | ✅ À supprimer (jamais importé) |
| 3 | **`server/src/services/maintenanceIAService.js`** | ✅ À supprimer (jamais importé) |
| 4 | **`server/src/controllers/iaController.js`** | ✅ À supprimer (fichier vide) |
| 5 | **`client/src/services/captureService.js`** | ✅ À supprimer (déprécié, lance Error) |
| 6 | **`client/src/services/flotteService.js`** | ✅ À supprimer (déprécié, lance Error) |
| 7 | **`client/src/services/exportService.js`** | ❌ Conservé — utilisé par DashboardExport.jsx (`getExportStats`) |

### Procédure d'exécution
```bash
# 1. Voir ce qui sera supprimé (simulation)
node cleanup.js --dry-run

# 2. Exécuter la suppression
node cleanup.js --force
```

---

## 📋 SCRIPT DE NETTOYAGE

Le fichier `cleanup.js` a été mis à jour pour inclure tous les fichiers ci-dessus. Exécutez `node cleanup.js --dry-run` pour prévisualiser, puis `node cleanup.js --force` pour supprimer.

---

## ⚠️ NOTES SUPPLÉMENTAIRES

1. **`exportService.js`** est conservé car il exporte `getExportStats()` qui est importé par `DashboardExport.jsx`. La route API correspondante existe : `GET /stats/export`.
2. **`captureService.js`** et **`flotteService.js`** sont déjà neutralisés : ils lancent une erreur à l'import avec un message redirigeant vers le bon fichier.
3. **`iaController.js`** contient déjà seulement un commentaire indiquant qu'il est déprécié.

---

*Stratégie mise à jour par Buffy — Audit Système Senior SmartFish SOGEDIPROMA*
