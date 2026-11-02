import productsData from "@/data/products.json";
import type { Product } from "./types";
export const getProducts = (): Product[] => productsData as Product[];
export const getProductBySlug = (slug: string): Product | undefined => getProducts().find((p) => p.slug === slug);
