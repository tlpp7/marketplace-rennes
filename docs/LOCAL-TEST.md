# Test des versions V0.1 à V0.3
Requis : Node 22+, Docker, OpenSSL et Git. Pas de serveur payant nécessaire.

```bash
git pull --ff-only origin main
bash scripts/setup-local.sh
npm install
npm run check
npm run dev -- --hostname 127.0.0.1
```

Tester /catalogue/, /profils/, /depot-vente/rennes/, /compte/, /mon-espace/ et /api/health.
Pour tester la collaboration, créer deux utilisateurs de test distincts; l'activation des profils vendeurs/prestataires nécessite une validation administrateur. **Ne pas exposer publiquement les comptes avant vérification email, politique de modération, anti-abus et audit.**

Codespaces: ports 3000 et 5432 doivent rester privés, Postgres lié à 127.0.0.1. Si Docker Compose est indisponible, utiliser l'installation PostgreSQL préexistante.

La prise de rendez-vous en V0.3 est une demande de créneau, pas une confirmation ni une réservation définitive. Avis soumis à approbation.

Il n'existe encore ni paiement ni commande commerciale; les données d'essai ne constituent pas un service réel.
