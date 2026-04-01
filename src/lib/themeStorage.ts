import { ThemeConfig, DEFAULT_THEME } from './theme';
import * as db from './db';

export { DEFAULT_THEME };

export async function getTheme(): Promise<ThemeConfig> {
  return db.getTheme();
}

export async function saveTheme(theme: ThemeConfig): Promise<void> {
  return db.saveTheme('default', theme);
}
