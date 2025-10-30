# acteFlow - Gestionnaire de Documents d'État Civil

Application de bureau pour la gestion et le traitement des documents d'état civil avec authentification sécurisée et synchronisation serveur.

## 🌟 Caractéristiques

### Authentification
- ✅ Système d'authentification hors-ligne/en-ligne
- ✅ Mots de passe chiffrés avec bcrypt
- ✅ Connexion automatique après la première authentification

### Gestion des Documents
- ✅ Surveillance automatique d'un dossier
- ✅ Visualisation PDF intégrée
- ✅ Système de traitement avec métadonnées complètes:
  - **Bureau** (avec recherche et ajout personnalisé)
  - **Type du registre** (5 types disponibles)
  - **Année**
  - **Numéro de registre**
  - **Numéro d'acte**
- ✅ Filtrage par statut (Tous / Non traités / Traités)
- ✅ Compteurs en temps réel
- ✅ Persistance du dossier surveillé

### Demandes de Modification
- ✅ Onglet dédié pour les demandes de modification
- ✅ Dossier fixe pour les modifications
- ✅ Affichage des erreurs (lecture seule)
- ✅ Messages personnalisés de l'agent
- ✅ Possibilité de re-télécharger les fichiers endommagés

### Synchronisation
- ✅ Synchronisation avec serveur Node.js
- ✅ Suppression automatique après sync
- ✅ Suivi de l'état de synchronisation

### Support Multilingue
- ✅ Interface 100% en français
- ✅ Support UTF-8 complet
- ✅ Compatible avec caractères arabes et spéciaux

## 📋 Champs de Document

### Bureau (16 options disponibles)
- Aïn Chock
- Aïn Sebaâ
- Al Fida
- Anfa
- Ben M'sik
- Essoukhour Assawda
- Hay Hassani
- Hay Mohammadi
- Maârif
- Mers Sultan
- Moulay Rachid
- Sbata
- Sidi Belyout
- Sidi Bernoussi
- Sidi Moumen
- Sidi Othman

*Possibilité d'ajouter de nouveaux bureaux via la fonction de recherche*

### Types de Registre
1. Registre des naissances
2. Registre des décès
3. Registre des jugements déclaratifs
4. Registre de transcriptions des déclarations
5. Registre des étrangers

## 🚀 Installation

### Application Desktop

```bash
# Installer les dépendances
npm install

# Lancer l'application
npm start
```

### Serveur de Synchronisation

```bash
cd sync-server

# Installer les dépendances
npm install

# Créer le fichier .env
echo "PORT=3000
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=justice2024" > .env

# Démarrer le serveur
npm start
```

## 📁 Structure des Fichiers

```
acteflow/
├── main.js                 # Process principal Electron
├── renderer.js             # Logique de l'interface
├── login.js                # Logique de connexion
├── index.html              # Interface principale
├── login.html              # Page de connexion
├── styles.css              # Styles de l'application
├── package.json            # Configuration npm
└── README.md               # Ce fichier

sync-server/
├── server.js               # Serveur Express
├── auth-db.js              # Base de données d'authentification
├── upload-to-project.js    # Script de téléchargement
├── package.json            # Configuration serveur
└── .env                    # Variables d'environnement
```

## 🔐 Sécurité

- Chiffrement bcrypt (10 rounds)
- Authentification locale-first
- Session tracking côté serveur
- Validation des fichiers PDF
- Limite de taille : 50MB

## 💾 Base de Données

### Documents
- ID, nom de fichier, chemin
- Bureau, numéros d'acte et de registre
- Année, type de registre
- Statut de traitement, date de création

### Modifications
- ID, nom de fichier, chemin
- Type d'erreur
- Message de l'agent
- Date de création

### Paramètres
- Dossier surveillé (persistant)
- Configuration utilisateur

## 🎨 Interface

### Onglets Principaux
1. **Documents** - Traitement des nouveaux documents
2. **Demandes de modification** - Gestion des erreurs et corrections

### Panneau de Traitement
- Informations du document
- Formulaire avec tous les champs
- Badge de statut
- Boutons d'action (Enregistrer, Synchroniser)

### Panneau de Modification
- Affichage du type d'erreur
- Message de l'agent
- Bouton de re-téléchargement

## 🔄 Workflow

### Traitement d'un Document
1. L'utilisateur sélectionne un dossier à surveiller
2. Les PDFs apparaissent automatiquement dans la liste
3. Clic sur un document pour l'afficher
4. Remplir tous les champs (Bureau, Type, Année, Registres, Acte)
5. Enregistrer → Document marqué comme "Traité"
6. Synchroniser → Envoi au serveur et suppression locale

### Gestion des Modifications
1. Les documents avec erreurs apparaissent dans l'onglet "Demandes de modification"
2. Clic pour visualiser le document et l'erreur
3. Lecture du type d'erreur et du message de l'agent
4. Option de re-téléchargement si nécessaire

## 🌐 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/verify` - Vérification utilisateur

### Documents
- `POST /api/sync` - Synchroniser un document
- `GET /api/documents` - Liste des documents
- `GET /api/documents/:id` - Détails d'un document
- `DELETE /api/documents/:id` - Supprimer un document

## ⚙️ Configuration

### Variables d'Environnement (.env)
```
PORT=3000
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=justice2024
```

### Dossiers
- **Documents surveillés** : Défini par l'utilisateur (persistant)
- **Modifications** : `~/AppData/acteflow/modifications` (fixe)
- **Base de données** : `~/AppData/acteflow/documents.db`

## 🐛 Dépannage

**L'application ne démarre pas:**
- Vérifier que Node.js est installé
- Exécuter `npm install` dans le dossier

**Impossible de se connecter:**
- Vérifier que le serveur est lancé
- Vérifier l'URL du serveur (http://localhost:3000)
- Utiliser les identifiants par défaut : admin / justice2024

**Les documents n'apparaissent pas:**
- Vérifier que le dossier contient des fichiers PDF
- Vérifier les permissions du dossier
- Rafraîchir en sélectionnant à nouveau le dossier

**Les caractères spéciaux ne s'affichent pas:**
- L'application supporte UTF-8 nativement
- Vérifier l'encodage des fichiers (doit être UTF-8)

## 📝 Notes

- Support complet UTF-8 (français, arabe, caractères spéciaux)
- Interface responsive et adaptative
- Scroll automatique pour petites fenêtres
- Sauvegarde automatique des préférences
- Compteurs en temps réel

## 🔮 Fonctionnalités Futures

- [ ] Connexion API pour les modifications
- [ ] Statistiques et rapports
- [ ] Export des données
- [ ] Recherche avancée
- [ ] Gestion multi-utilisateurs
- [ ] Notifications push
- [ ] Mode sombre/clair

## 📄 Licence

MIT License - Libre d'utilisation

## 👥 Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de support.

---

**acteFlow v1.0** - Gestionnaire de Documents d'État Civil