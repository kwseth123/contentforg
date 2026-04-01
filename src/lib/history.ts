import fs from 'fs';
import path from 'path';
import { HistoryItem } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureFile(): HistoryItem[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, '[]');
    return [];
  }
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

export function getHistory(): HistoryItem[] {
  return ensureFile().sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

export function addHistoryItem(item: HistoryItem): void {
  const items = ensureFile();
  items.push(item);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(items, null, 2));
}

export function getHistoryItem(id: string): HistoryItem | undefined {
  return ensureFile().find((i) => i.id === id);
}

export function updateHistoryItem(id: string, update: Partial<HistoryItem>): void {
  const items = ensureFile();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...update };
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(items, null, 2));
  }
}
