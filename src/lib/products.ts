import fs from 'fs';
import path from 'path';
import { ProductProfile } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

export function getProducts(): ProductProfile[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function saveProducts(products: ProductProfile[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

export function getProduct(id: string): ProductProfile | undefined {
  return getProducts().find((p) => p.id === id);
}

export function upsertProduct(product: ProductProfile): void {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = { ...product, lastUpdated: new Date().toISOString() };
  } else {
    products.push({ ...product, lastUpdated: new Date().toISOString() });
  }
  saveProducts(products);
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
}

export function incrementProductContentCount(id: string): void {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx >= 0) {
    products[idx].contentGeneratedCount = (products[idx].contentGeneratedCount || 0) + 1;
    saveProducts(products);
  }
}
