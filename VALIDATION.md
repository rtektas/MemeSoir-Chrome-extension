# Validation — 16 novembre 2026

## Réalisé

- 10 tests automatisés réussis (`npm test`) sous Node.js 24.
- Échanges réels HTTP entre plusieurs sessions : création, invitation, arrivée tardive, lecture, pause, déplacement, vitesse et chat.
- Refus des commandes d’un invité, refus d’une session inconnue, validation des entrées, limitation du chat et de la capacité, fermeture par l’hôte.
- Exécution du vrai code du service worker dans un environnement Chrome simulé, relié au vrai serveur : sessions par onglet, jetons privés, invitation, chat et nettoyage à la fermeture.
- Vérification du manifeste v3 et vérification syntaxique des fichiers JavaScript.

## Non validé ici

Le navigateur Chromium de cet environnement ne démarre pas (création de socket refusée). Il n’a donc pas été possible de charger visuellement l’extension, de tester le dialogue réel d’autorisation Chrome, ni de contrôler deux vrais lecteurs YouTube. Les API Chrome simulées ne remplacent pas ce test.

Aucun serveur public n’a été déployé. Aucun test à distance entre deux ordinateurs, avec des publicités YouTube ou sur Netflix n’a été effectué.

## Recette sur deux profils Chrome / Edge

1. Démarrer le serveur, installer l’extension dans deux profils, créer puis rejoindre une soirée.
2. Vérifier lecture, pause, déplacement et vitesse. Vérifier qu’un invité ne prend pas les commandes.
3. Vérifier un invité arrivant en milieu de vidéo ; puis fermeture et réouverture du panneau, rechargement de page et changement de vidéo.
4. Vérifier que le chat affiche littéralement `<img src=x onerror=alert(1)>` sans interprétation HTML.
5. Tester les publicités, le blocage de lecture automatique et une coupure du serveur suivie de son retour.
6. Vérifier que quitter comme invité préserve la soirée et que quitter comme hôte la ferme.

Cette version est un prototype fonctionnel à tester, pas une version certifiée pour publication dans le Chrome Web Store.

## Mise à jour 0.1.1 — 17 novembre 2026

Les 10 tests automatisés ont été relancés avec succès. Le manifeste référence désormais les PNG inclus en 16, 32, 48 et 128 pixels. Le panneau arrête la propagation de keydown, keyup et keypress sans annuler l’édition native du texte. Ce correctif clavier doit encore être vérifié sur une vraie page YouTube, notamment face à ses gestionnaires en phase de capture.
