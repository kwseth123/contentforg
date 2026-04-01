import fs from 'fs';
import path from 'path';
import { ThemeConfig, DEFAULT_THEME } from './theme';

const DATA_DIR = path.join(process.cwd(), 'data');
const THEME_FILE = path.join(DATA_DIR, 'theme.json');

export function getTheme(): ThemeConfig {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(THEME_FILE)) {
    fs.writeFileSync(THEME_FILE, JSON.stringify(DEFAULT_THEME, null, 2));
    return { ...DEFAULT_THEME };
  }
  const raw = fs.readFileSync(THEME_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function saveTheme(theme: ThemeConfig): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(THEME_FILE, JSON.stringify(theme, null, 2));
}
