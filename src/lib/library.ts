import fs from 'fs';
import path from 'path';
import { LibraryItem } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');

function ensureFile(): LibraryItem[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LIBRARY_FILE)) {
    fs.writeFileSync(LIBRARY_FILE, '[]');
    return [];
  }
  return JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
}

export function getLibrary(): LibraryItem[] {
  const items = ensureFile();
  return items.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime();
  });
}

export function addLibraryItem(item: LibraryItem): void {
  const items = ensureFile();
  items.push(item);
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(items, null, 2));
}

export function deleteLibraryItem(id: string): void {
  const items = ensureFile().filter((i) => i.id !== id);
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(items, null, 2));
}

export function togglePinLibraryItem(id: string): void {
  const items = ensureFile();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx].pinned = !items[idx].pinned;
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(items, null, 2));
  }
}
