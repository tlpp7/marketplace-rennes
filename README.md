# Marché Rennes

Marketplace de vêtements d’occasion et dépôt-vente à Rennes. **V0.1 : démonstration non commerciale**.

## Démarrer

```bash
npm install
npm run check:products
npm run dev
```

Ouvrir `http://localhost:3000`. Pour compiler : `npm run build`. Les pages sont exportées dans `out/`.

## Architecture

- `app/` : pages Next.js et SEO
- `components/` : interface réutilisable
- `data/products.json` : exemples de produits publics uniquement
- `modules/catalog/` : couche de lecture du catalogue
- `scripts/` : contrôles du catalogue
- `docs/` : roadmap, SEO, flux logistiques

## Publier

Le site est statique et peut être hébergé chez n’importe quel fournisseur de fichiers statiques ou sur un serveur personnel. Ne pas activer `SEO_PUBLIC=true` avant l’ouverture réelle et le remplacement des pages juridiques provisoires.

## Sécurité

Ne jamais publier d’informations privées sur les déposants ou les acheteurs, de secrets, ni de données de paiement dans le dépôt. L’accès aux réservations et aux paiements sera développé ultérieurement.
