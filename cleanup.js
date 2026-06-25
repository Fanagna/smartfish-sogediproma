#!/usr/bin/env node

/**
 * 🧹 SMARTFISH SOGEDIPROMA — Script de nettoyage automatique
 * 
 * Exécute les suppressions identifiées dans CLEANUP_STRATEGY.md
 * Usage: node cleanup.js [--dry-run] [--force]
 * 
 * --dry-run : Simule les suppressions sans rien effacer
 * --force   : Exécute les suppressions (demande confirmation)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration: fichiers/dossiers à supprimer
// Vérifiés: aucun fichier du projet n'importe ces éléments
const FILES_TO_REMOVE = [
  // LOT 1 — Suppression immédiate (risque nul, vérifié)
  'mobile',                          // Dossier app mobile abandonnée (9 fichiers)
  'server/src/config/gemini.js',     // Doublon: jamais importé (instance dans iaService.js)
  'server/src/services/maintenanceIAService.js', // Jamais importé
  'server/src/controllers/iaController.js',       // Fichier vide/déprécié
  'client/src/services/captureService.js',       // Déprécié (lance Error). Doublon de capturesService.js
  'client/src/services/flotteService.js',        // Déprécié (lance Error). Doublon de bateauService.js
];

/**
 * Vérifie que le projet a un repo git (pour rollback)
 */
function hasGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return fs.existsSync('.git');
  } catch {
    return false;
  }
}

/**
 * Vérifie que le dossier cible est bien le projet SmartFish
 */
function isProjectRoot() {
  return fs.existsSync('server/package.json') && 
         fs.existsSync('client/package.json');
}

/**
 * Supprime un fichier ou dossier avec journalisation
 */
function removePath(targetPath, dryRun) {
  const fullPath = path.resolve(targetPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  [SKIP] ${targetPath} — n'existe pas`);
    return false;
  }

  if (dryRun) {
    const stat = fs.statSync(fullPath);
    const size = stat.isDirectory() 
      ? `${countFiles(fullPath)} fichiers` 
      : `${(stat.size / 1024).toFixed(1)} KB`;
    console.log(`📋 [DRY-RUN] Supprimerait: ${targetPath} (${size})`);
    return true;
  }

  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    console.log(`✅ [SUPPRIMÉ] ${targetPath}`);
    return true;
  } catch (err) {
    console.error(`❌ [ERREUR] ${targetPath}: ${err.message}`);
    return false;
  }
}

/**
 * Compte les fichiers dans un dossier (récursif)
 */
function countFiles(dirPath) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(fullPath);
      } else {
        count++;
      }
    }
  } catch {}
  return count;
}

/**
 * Compte les lignes dans un fichier
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * Sauvegarde les infos de rollback
 */
function saveRollbackInfo(deletedFiles) {
  const info = {
    date: new Date().toISOString(),
    deletedFiles,
    gitCommit: '',
  };

  try {
    info.gitCommit = execSync('git rev-parse HEAD').toString().trim();
  } catch {}

  fs.writeFileSync(
    path.resolve(__dirname, '.cleanup-backup.json'),
    JSON.stringify(info, null, 2)
  );
  console.log(`\n📝 Informations de rollback sauvegardées dans .cleanup-backup.json`);
}

/**
 * Affiche le résumé
 */
function printSummary(stats) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DU NETTOYAGE');
  console.log('='.repeat(50));
  console.log(`   Fichiers supprimés : ${stats.deleted}`);
  console.log(`   Fichiers ignorés   : ${stats.skipped}`);
  console.log(`   Erreurs           : ${stats.errors}`);
  console.log(`   Lignes supprimées : ~${stats.linesDeleted}`);
  console.log('='.repeat(50));
  console.log(`   Rollback: ${stats.hasGit ? '✅ git disponible' : '⚠️  Pas de git'}`);
  if (stats.hasGit) {
    console.log(`   Commande: git checkout -- mobile/ <autres_fichiers>`);
  }
  console.log('='.repeat(50));
}

/**
 * MAIN
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const hasGit = hasGitRepo();

  console.log('🧹 SMARTFISH SOGEDIPROMA — Script de nettoyage\n');

  // Vérifier le dossier
  if (!isProjectRoot()) {
    console.error('❌ ERREUR: Vous devez exécuter ce script depuis la racine du projet SmartFish');
    console.error('   Dossier attendu: /smartfish-sogediproma');
    process.exit(1);
  }

  // Mode dry-run
  if (dryRun) {
    console.log('📋 MODE DRY-RUN — Aucune suppression réelle\n');
  }

  // Vérifier git
  if (!hasGit) {
    console.warn('⚠️  ATTENTION: Pas de repo git détecté — rollback impossible!\n');
    if (!force && !dryRun) {
      console.error('   Utilisez --force pour forcer la suppression sans git');
      process.exit(1);
    }
  }

  // Demander confirmation
  if (!dryRun && !force) {
    console.log('⚠️  Cette action va supprimer définitivement des fichiers.');
    console.log('   Utilisez --dry-run pour voir ce qui sera supprimé.');
    console.log('   Utilisez --force pour exécuter la suppression.\n');
    process.exit(0);
  }

  // Exécution
  const stats = { deleted: 0, skipped: 0, errors: 0, linesDeleted: 0, hasGit };

  console.log('Fichiers à supprimer:\n');

  for (const filePath of FILES_TO_REMOVE) {
    const lines = countLines(filePath);
    const removed = removePath(filePath, dryRun);
    
    if (removed) {
      if (!dryRun) {
        stats.deleted++;
        stats.linesDeleted += lines;
      } else {
        stats.deleted++;
        stats.linesDeleted += lines;
      }
    } else {
      stats.skipped++;
    }
  }

  if (!dryRun) {
    saveRollbackInfo(FILES_TO_REMOVE.filter(f => fs.existsSync(path.resolve(f))));
  }

  printSummary(stats);
  
  if (!dryRun) {
    console.log('\n✅ Nettoyage terminé!');
    console.log('   Prochaine étape recommandée: exécuter les migrations Prisma si nécessaire');
    console.log('   Puis: npm install pour mettre à jour les dépendances');
  } else {
    console.log('\n💡 Pour exécuter: node cleanup.js --force');
    console.log('   Assurez-vous d\'avoir un commit récent: git add . && git commit -m "avant nettoyage"');
  }
}

main().catch(console.error);
