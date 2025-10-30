#!/usr/bin/env node
/**
 * Script pour créer rapidement des fichiers de démonstration
 * Usage: node create-demo.js [nom-du-fichier] [type-erreur]
 */

const fs = require('fs');
const path = require('path');

// Types d'erreurs disponibles
const ERROR_TYPES = {
  '1': 'Acte mal fusionné : deux parties différentes ou une partie manquante (المستند مدمج بشكل سيئ: جزئين مختلفين أو جزء مفقود)',
  '2': 'Acte mal scanné : mauvaise numérisation (المستند ممسوح ضوئيًا بشكل سيئ: مسح ضوئي سيئ)',
  '3': 'Problème de compression : acte vide (مشكلة في الضغط: مستند فارغ)',
  '4': 'Acte non fusionné (المستند غير مدموج)',
  '5': 'Acte manquant (مستند مفقود)'
};

const MESSAGES = {
  '1': 'Le document contient des pages de deux actes différents. Pages 1-2 appartiennent à un acte, pages 3-4 à un autre. Veuillez re-scanner uniquement l\'acte concerné.',
  '2': 'Le document présente une mauvaise qualité de numérisation. Les pages sont floues ou illisibles. Veuillez re-scanner avec une résolution de 300 DPI minimum.',
  '3': 'Le fichier PDF est vide ou corrompu. Impossible d\'ouvrir le document. Veuillez vérifier le fichier source et le re-télécharger.',
  '4': 'L\'acte comporte plusieurs parties qui doivent être fusionnées en un seul document. Actuellement, seule une partie est présente.',
  '5': 'Le document indiqué dans le registre n\'a pas été trouvé. Veuillez localiser et scanner ce document.'
};

const MODIFICATIONS_DIR = path.join(__dirname, 'modifications');

// Créer le dossier si nécessaire
if (!fs.existsSync(MODIFICATIONS_DIR)) {
  fs.mkdirSync(MODIFICATIONS_DIR, { recursive: true });
}

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         Création de Fichiers de Démonstration         ║
╚═══════════════════════════════════════════════════════╝

Usage:
  node create-demo.js [nom] [type]

Arguments:
  nom  : Nom du fichier (sans extension)
  type : Type d'erreur (1-5)

Types d'erreurs disponibles:
  1 - Acte mal fusionné
  2 - Acte mal scanné
  3 - Problème de compression
  4 - Acte non fusionné
  5 - Acte manquant

Exemples:
  node create-demo.js test-fusion 1
  node create-demo.js acte-flou 2
  node create-demo.js document-vide 3

Note: Vous devez fournir votre propre fichier PDF.
Le script crée uniquement le fichier JSON d'erreur.
`);
}

function createDemoJSON(filename, errorType) {
  if (!ERROR_TYPES[errorType]) {
    console.error('❌ Type d\'erreur invalide. Utilisez 1-5.');
    showHelp();
    process.exit(1);
  }

  const jsonPath = path.join(MODIFICATIONS_DIR, `${filename}.json`);
  
  const demoData = {
    errorType: ERROR_TYPES[errorType],
    agentMessage: MESSAGES[errorType],
    documentId: `demo-${Date.now()}`,
    submittedBy: 'agent-demo',
    submittedAt: new Date().toISOString()
  };

  fs.writeFileSync(jsonPath, JSON.stringify(demoData, null, 2), 'utf8');
  
  console.log(`
✓ Fichier JSON créé avec succès!

📁 Emplacement: ${jsonPath}

⚠️  N'oubliez pas:
  1. Copiez un fichier PDF avec le nom: ${filename}.pdf
  2. Placez-le dans: ${MODIFICATIONS_DIR}
  3. Lancez l'application: npm start
  4. Allez dans "Demandes de modification"

🎉 Le document apparaîtra automatiquement!
`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

if (args.length < 2) {
  console.error('❌ Arguments manquants.');
  showHelp();
  process.exit(1);
}

const [filename, errorType] = args;
createDemoJSON(filename, errorType);