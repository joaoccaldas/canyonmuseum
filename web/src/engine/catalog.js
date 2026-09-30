// engine/catalog.js — the runtime join of every injected source into one app catalog.
// landing.template.html injects window.__PRODUCTS (public catalog), __CANDIDATES__ (intake)
// and __BRANDROOMS__ (room placement). Catalog is the one place the UI asks for products.
import { resolveProduct, listProducts, productsForSlot, collectibles } from './product.js';

function sources() {
  return {
    catalog: window.__PRODUCTS || { products: [] },
    candidates: window.__CANDIDATES__ || { items: [] },
    brandrooms: window.__BRANDROOMS || { rooms: [] },
  };
}

export const getProduct = id => resolveProduct(id, sources());
export const allProducts = () => listProducts(sources());
export const roomProducts = roomId => allProducts().filter(p => p.room === roomId);
export const forSlot = slot => productsForSlot(slot, sources());
export const collection = () => collectibles(sources());

// Grouped, human-readable summary for the Explore panel: brands with their live products.
export function catalogOverview() {
  const byBrand = new Map();
  for (const p of allProducts()) {
    const k = p.brand || 'Independent';
    if (!byBrand.has(k)) byBrand.set(k, []);
    byBrand.get(k).push(p);
  }
  return [...byBrand.entries()]
    .map(([brand, items]) => ({ brand, items: items.sort((a, b) => (b.year || 0) - (a.year || 0)) }))
    .sort((a, b) => b.items.length - a.items.length);
}
