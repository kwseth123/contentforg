import { LibraryItem } from './types';
import * as db from './db';

export async function getLibrary(): Promise<LibraryItem[]> {
  return db.getLibrary();
}

export async function addLibraryItem(item: LibraryItem): Promise<void> {
  return db.addLibraryItem('default', item);
}

export async function deleteLibraryItem(id: string): Promise<void> {
  return db.deleteLibraryItem('default', id);
}

export async function togglePinLibraryItem(id: string): Promise<void> {
  return db.togglePinLibraryItem('default', id);
}
