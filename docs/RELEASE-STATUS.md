# Renn'Fripes — suivi des versions
- V0.1 : interface/cataloque statique fonctionnel sur données fictives. Publication commerciale non ouverte.
- V0.2 : profils fictifs et annuaire des vrais profils approuvés, base prête. Pas de flux commercial réel.
- V0.3 : inscription/session, messagerie, suivis, demandes de RDV et avis en attente. Nécessite PostgreSQL, vérification des emails, limitations de débit, modération et tests E2E.
- V0.4 / finition V0.2 dépôt-vente : demandes, permissions, SKU, réception attestée, contrôle qualité documenté, mandat électronique horodaté et catalogue dynamique sont codés sur security/dependency-hardening. Migrations 006/007 et essais sur base isolée requis ; le mandat doit être revu juridiquement.
- V0.5 : commandes demandées en mode privé, calcul de prix, bases expéditions/événements PSP. Pas de paiement ni de livraison réelle.

**Règle de lancement** : jamais activer comptes et commandes pour le public sans audit sécurité et parcours conforme.
