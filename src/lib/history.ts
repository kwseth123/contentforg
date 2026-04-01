import { HistoryItem } from './types';
import * as db from './db';

export async function getHistory(): Promise<HistoryItem[]> {
  return db.getHistory();
}

export async function addHistoryItem(item: HistoryItem): Promise<void> {
  return db.addHistoryItem('default', item);
}

export async function getHistoryItem(id: string): Promise<HistoryItem | undefined> {
  return db.getHistoryItem('default', id);
}

export async function updateHistoryItem(id: string, update: Partial<HistoryItem>): Promise<void> {
  return db.updateHistoryItem('default', id, update);
}
