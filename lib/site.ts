export const site = {
  name: "Renn'Fripes",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.invalid",
  description: "Renn'Fripes : projet de marketplace de vêtements d'occasion et dépôt-vente à Rennes. Achetez, vendez et donnez une seconde vie à votre garde-robe.",
};
export const isLive = process.env.SEO_PUBLIC === "true" && Boolean(process.env.NEXT_PUBLIC_SITE_URL);
