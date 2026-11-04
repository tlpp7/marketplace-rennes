import {getServerConfig} from "@/lib/config/env";
const config=getServerConfig();
export const site = {
  name: "Renn'Fripes",
  url: config.urls.siteOrigin ?? "https://example.invalid",
  description: "Renn'Fripes : projet de marketplace de vêtements d'occasion et dépôt-vente à Rennes. Achetez, vendez et donnez une seconde vie à votre garde-robe.",
};
export const isLive = config.flags.seoPublic && Boolean(config.urls.siteOrigin);
