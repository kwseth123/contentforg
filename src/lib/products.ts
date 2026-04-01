import { ProductProfile } from './types';
import * as db from './db';

export async function getProducts(): Promise<ProductProfile[]> {
  return db.getProducts();
}

export async function saveProducts(products: ProductProfile[]): Promise<void> {
  return db.saveProducts('default', products);
}

export async function getProduct(id: string): Promise<ProductProfile | undefined> {
  return db.getProduct('default', id);
}

export async function upsertProduct(product: ProductProfile): Promise<void> {
  return db.upsertProduct('default', product);
}

export async function deleteProduct(id: string): Promise<void> {
  return db.deleteProduct('default', id);
}

export async function incrementProductContentCount(id: string): Promise<void> {
  return db.incrementProductContentCount('default', id);
}
