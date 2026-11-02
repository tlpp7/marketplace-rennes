export const site = {name: "Marché Rennes", url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.invalid", description: "Projet de dépôt-vente et marketplace de vêtements d’occasion à Rennes."};
export const isLive = process.env.SEO_PUBLIC === "true" && Boolean(process.env.NEXT_PUBLIC_SITE_URL);
