# Renn’Fripes — V0.2 : dépôt-vente exploitable

## Architecture opérationnelle

1. Un membre connecté propose un article depuis **Mon espace / Mes dépôts**.
2. L'administrateur **Examine**, puis **Accepte** et définit le taux de commission (stock + SKU).
3. Le déposant ouvre le **mandat**, contrôle le prix et la commission, renseigne son identité et son adresse, puis accepte explicitement les conditions.
4. L'administrateur **Réceptionne** l'article physiquement, renseigne le bordereau et l'emplacement et atteste la remise. Un document d'attestation et son SHA-256 sont archivés.
5. L'administrateur réalise le **contrôle qualité** : étiquette, propreté, état et photos. Le rapport positif débloque l'état ready ; un refus documenté bloque la vente.
6. L'administrateur **Publie** la pièce avec sa taille, son image et sa description. Le serveur et une contrainte PostgreSQL exigent réception, qualité positive, mandat et fiche publique.
7. L'article à l'état **listed** est affiché sur /catalogue/ et sur /produit/rf-XXXXXXX/. Les articles de démonstration restent explicitement identifiés.

**Ce jalon n'active aucun paiement.** ORDERS_ENABLED doit rester false jusqu'à la validation Stripe et des commandes.

## Prérequis de configuration des mandats

Ajouter aux variables de l'application dans Railway, ou dans le fichier .env.local privé pour les essais locaux :

- CONSIGNMENT_OPERATOR_NAME : raison sociale / nom exact de l'exploitant ;
- CONSIGNMENT_OPERATOR_ADDRESS : adresse professionnelle exacte ;
- CONSIGNMENT_OPERATOR_SIRET : SIRET de 14 chiffres ;
- CONSIGNMENT_TERMS_VERSION : version identifiant les conditions (ex. 2026-11-v1) ;
- CONSIGNMENT_TERMS_TEXT : texte intégral des conditions propres au dépôt-vente ; minimum 40 caractères. Spécifier notamment les règles de propriété, remise, durée, prix, commission, frais et TVA selon situation, invendus, restitution, pertes/dommages et résiliation.

Sans ces variables, l'API de mandat renvoie 503 et aucun dépôt physique ne peut commencer : il s'agit d'un verrou de sécurité voulu. Le texte accepté est archivé pour chaque article avec date, auteur et SHA-256. **Le consentement électronique horodaté n'est pas présenté comme une signature électronique qualifiée.** Faire valider le mandat et les mentions obligatoires par un professionnel du droit avant lancement commercial.

## Photos

Méthode simple pour le pilote : ajouter dans le dépôt des images publiques nettoyées de métadonnées privées sous public/consignments/RF-0000001.jpg, puis renseigner dans l'interface la valeur /consignments/RF-0000001.jpg.

Pour les images hébergées ailleurs : renseigner la liste séparée par des virgules d'hôtes HTTPS autorisés dans CONSIGNMENT_MEDIA_HOSTS (noms d'hôtes seuls, sans https://), et saisir l'URL HTTPS correspondante lors de la publication. Les hôtes non autorisés sont rejetés.

Ne jamais placer de documents d'identité, mandats ou bordereaux privés dans public/.

## Migration Codespaces — seulement sur une base de test

Vérifier d'abord que DATABASE_URL pointe sur une base isolée. Ne jamais afficher sa valeur dans la console ni la committer.

~~~bash
cd /workspaces/marketplace-rennes
git pull --ff-only origin security/dependency-hardening
npm ci
npm run lint
npm run build
npm run test:unit
# Sur la base TEST uniquement, qui doit déjà contenir les migrations 001 à 005 :
npm run db:migrate:v02
npm run db:check
RF_V02_TEST_MODE=true npm run test:v02:db
npm run dev
~~~

Ouvrir /mon-espace/ et /admin/depot-vente/, puis créer un dépôt test. Si les mandats sont indisponibles, configurer les variables ci-dessus dans .env.local (sur la base de test seulement) et redémarrer le serveur. Vérifier que les transitions hors ordre renvoient 409.

## Procédure de migration production

1. Faire une sauvegarde PostgreSQL et vérifier sa restauration sur une base de test.
2. Vérifier que les migrations 001 à 005 ont été appliquées sur la base cible.
3. Avec une connexion au réseau privé Railway, exécuter npm run db:migrate:v02 via un pré-déploiement Railway ou une session de service de migration. Un Codespace non connecté au réseau privé ne peut pas atteindre le nom d'hôte .railway.internal.
4. Vérifier npm run db:check, le comportement du compte administrateur, les API et le catalogue.
5. Déployer ensuite la branche testée. Ne pas activer les commandes et les paiements avant leurs tests spécifiques.

Cette migration crée quatre tables de preuves et un déclencheur de validation, et ne supprime pas les anciens enregistrements. Une base déjà en production doit toutefois être sauvegardée avant application.

## Points de contrôle

- La réception échoue sans mandat accepté.
- Un article sans attestation de réception ne peut pas passer à quality_check.
- Un article sans rapport qualité positif ne peut pas passer à ready.
- Un article sans mandat ou fiche publiée ne peut pas passer à listed.
- Une décision de contrôle négative exige une justification.
- La fiche publique ne révèle ni l'identité légale ni l'adresse du déposant.
- Le déposant peut relire son mandat et son attestation depuis Mon espace.
- Une fiche fictive n'est jamais proposée comme article réellement en stock.

## Limites à lever avant les premiers encaissements

- Vérifier matériellement l'authenticité des bordereaux et des photographies : une attestation de l'opérateur ne prouve pas à elle seule la remise par un tiers.
- Révision juridique, RGPD et règles de conservation des preuves.
- Validation du fournisseur d'images / des URL accessibles publiquement.
- V0.3 : paiement, allocation de stock lors du paiement, annulations, remboursement, livraison et suivi.
