<div align="center">

# ◒ MêmeSoir

### À distance. Au même moment.

Une extension Chrome et Edge pour regarder YouTube ensemble,  
avec une invitation privée, un chat et une lecture synchronisée.

**JavaScript · Manifest V3 · Node.js · Interface en français**

[Installation](#installation) · [Fonctionnement](#fonctionnement) · [À distance](#regarder-à-distance) · [Limites](#limites-actuelles) · [Feuille de route](#feuille-de-route)

</div>

---

> **État du dépôt : documentation initiale.** Le code source et le logo du prototype n’ont pas encore été importés dans ce dépôt. Les instructions ci-dessous décrivent le paquet MêmeSoir v0.1 existant ; elles seront utilisables depuis ce dépôt après l’ajout des fichiers. Le prototype n’est pas encore publié dans le Chrome Web Store.

## Une soirée, plusieurs canapés

MêmeSoir permet à un hôte de créer un salon sur une vidéo YouTube et d’inviter ses amis. Chaque personne regarde la vidéo directement sur YouTube. Le serveur échange les commandes de lecture et les messages du chat, pas le flux vidéo.

### Fonctionnalités du prototype

| Fonction | Comportement |
| --- | --- |
| Invitations privées | Un lien permet de rejoindre le salon avec un pseudo. |
| Lecture synchronisée | Lecture, pause, déplacement et vitesse suivent l’hôte. |
| Chat intégré | Les participants discutent dans un panneau sur la page. |
| Arrivée en cours de séance | Un invité rejoint la position de lecture du salon. |
| Réglages individuels | Volume et sous-titres restent propres à chacun. |
| Fermeture du salon | L’hôte ferme la soirée en la quittant. |

## Installation

**Prérequis :** Chrome ou Edge sur ordinateur, Node.js 22 ou plus récent pour le serveur, et les fichiers du prototype.

### 1. Démarrer le serveur

Sur Windows, double-cliquer sur **DEMARRER-WINDOWS.bat** et garder sa fenêtre ouverte.

Depuis un terminal à la racine du projet :

```bash
npm start
```

L’adresse locale par défaut est **http://localhost:8787**. Le serveur du prototype ne nécessite aucune dépendance npm externe.

### 2. Charger l’extension

1. Ouvrir `chrome://extensions` ou `edge://extensions`.
2. Activer **Mode développeur**.
3. Cliquer sur **Charger l’extension non empaquetée**.
4. Sélectionner le dossier **extension**, qui contient directement `manifest.json`.
5. Épingler MêmeSoir depuis le menu des extensions du navigateur.

> Ne pas sélectionner le dossier racine du projet. Si le manifeste référence une icône, le fichier PNG correspondant doit être présent au chemin indiqué.

### 3. Créer ou rejoindre une soirée

1. Ouvrir une vidéo classique sur `https://www.youtube.com/watch?v=…`.
2. Ouvrir MêmeSoir, saisir un pseudo et créer une soirée.
3. Autoriser l’accès au serveur choisi.
4. Copier le lien avec **Inviter mes amis**.
5. Chaque invité installe l’extension, ouvre YouTube et colle le lien dans MêmeSoir.

Si le navigateur bloque la lecture automatique, l’invité doit autoriser la lecture avec le bouton proposé dans le panneau. Chaque participant doit disposer de son propre accès au contenu.

## Regarder à distance

**`localhost` désigne l’ordinateur de chaque participant.** Un serveur lancé uniquement sur ton PC ne devient pas automatiquement accessible à tes amis.

Pour une soirée entre plusieurs ordinateurs :

- Déployer le serveur Node.js sur une adresse **HTTPS** accessible aux participants.
- Utiliser une seule instance pour cette version : les salons sont conservés en mémoire.
- Configurer cette adresse dans **Connexion au serveur** avant de créer la soirée.
- Garder le serveur disponible pendant toute la séance.

Le port est configurable avec `PORT`. L’endpoint `GET /health` sert à vérifier que le serveur répond. Un redémarrage supprime les salons et les messages en mémoire.

**Aucun serveur public n’est fourni actuellement.**

## Fonctionnement

Le panneau lit les événements du lecteur YouTube. Le service worker de l’extension échange avec le serveur, qui conserve l’état du salon. Les invités consultent cet état et ajustent leur lecteur.

La synchronisation utilise des requêtes HTTP périodiques, avec une compensation approximative du délai réseau. Elle ne garantit pas une synchronisation image par image.

### Organisation prévue des sources

| Chemin | Rôle |
| --- | --- |
| `extension/manifest.json` | Déclaration de l’extension et des permissions |
| `extension/popup.html`, `popup.css`, `popup.js` | Création et accès aux soirées |
| `extension/background.js` | Réseau et sessions par onglet |
| `extension/content.js` | Panneau de chat et pilotage du lecteur |
| `server/server.js` | Salons, participants, commandes et messages |
| `server/index.html` | Page d’invitation |
| `tests/` | Tests du serveur et du service worker simulé |
| `DEMARRER-WINDOWS.bat` | Démarrage local sous Windows |
| `Dockerfile` | Configuration de conteneur du serveur |

## Limites actuelles

- **YouTube classique uniquement** : Netflix, Prime Video, Disney+, Shorts, directs et mobile ne sont pas pris en charge.
- Seul l’hôte contrôle la lecture partagée.
- Les publicités personnalisées, le chargement et les onglets en arrière-plan peuvent provoquer un décalage.
- Changer de vidéo nécessite de revenir à la vidéo du salon ou de créer une autre soirée.
- Le prototype limite les salons à 20 participants et conserve les 100 derniers messages.
- Les salons expirent après deux heures sans requête, avec une durée maximale de douze heures.
- Recharger une page peut nécessiter de rouvrir le panneau.
- **Bug signalé :** la saisie dans le chat peut déclencher les raccourcis YouTube. Un correctif d’isolation des événements clavier a été proposé, mais sa validation en navigateur reste à effectuer.
- Le logo a été créé, mais son intégration aux fichiers de ce dépôt reste à faire.

## Tests et validation

Commande prévue après import des sources :

```bash
npm test
```

Les **10 tests automatisés du paquet v0.1** ont réussi lors de sa création. Ils couvrent notamment les échanges HTTP, les permissions de l’hôte, le chat, la capacité des salons, la fermeture et le service worker avec des API Chrome simulées.

**Cela ne constitue pas une validation complète dans Chrome ou Edge.** Les dialogues de permissions, deux vrais lecteurs YouTube, les publicités et une séance entre deux ordinateurs restent à tester. Aucun résultat de CI n’est encore associé à ce dépôt.

## Confidentialité

Le prototype est conçu pour transmettre au serveur :

- le pseudo choisi ;
- le lien de la vidéo ;
- l’état de lecture ;
- les messages du salon.

Il ne demande pas les mots de passe YouTube et ne retransmet pas les vidéos. Les messages et salons restent en mémoire côté serveur jusqu’à leur suppression, expiration ou redémarrage. L’hébergeur peut avoir ses propres journaux réseau.

Le lien d’invitation donne accès au salon : il doit rester entre les participants.

## Permissions de l’extension

| Permission | Utilisation |
| --- | --- |
| `activeTab` | Accès temporaire à l’onglet activé par l’utilisateur |
| `scripting` | Installation du panneau et interaction avec le lecteur |
| `storage` | Préférences locales et session de l’extension |
| Accès optionnel au serveur | Communication avec l’adresse choisie par l’utilisateur |

## Plateformes et statut du projet

MêmeSoir est un **prototype indépendant**, sans affiliation ni approbation de YouTube, Google, Netflix ou Microsoft.

La version actuelle pilote directement la page YouTube. Sa conformité aux conditions des plateformes n’a pas été juridiquement validée. Une évolution vers le lecteur intégré et l’API officielle YouTube est envisagée, sous réserve de respecter leurs conditions.

La publication du code ne constitue pas une autorisation des plateformes. Le projet ne doit pas être présenté comme permettant d’accéder gratuitement à des contenus payants ou de contourner des protections.

## Feuille de route

- [ ] Importer les sources du prototype et le logo.
- [ ] Intégrer et valider le correctif des raccourcis clavier dans le chat.
- [ ] Fournir des icônes adaptées aux tailles de la barre d’outils.
- [ ] Tester le parcours complet dans Chrome et Edge avec deux participants.
- [ ] Évaluer la migration vers l’API officielle YouTube.
- [ ] Améliorer les reconnexions et le comportement pendant les publicités.
- [ ] Préparer un déploiement HTTPS et une documentation d’exploitation.
- [ ] Ajouter une intégration continue.
- [ ] Examiner séparément toute future plateforme.

## Signaler un problème

Ouvrir une [issue](https://github.com/rtektas/MemeSoir-Chrome-extension/issues) avec le navigateur utilisé, les étapes de reproduction, le résultat attendu et le résultat observé.

Ne pas publier de lien de salon privé, de jeton de session ou d’information personnelle.

## Licence

Aucune licence de réutilisation n’a encore été choisie. La visibilité publique du dépôt ne signifie pas qu’une licence open source lui a été attribuée.

---

<div align="center">

**MêmeSoir — À distance. Au même moment.**

Projet de [Resul Tektas](https://github.com/rtektas)

</div>
