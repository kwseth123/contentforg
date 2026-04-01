import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { AppUser } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureUsersFile(): AppUser[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers: AppUser[] = [
      {
        id: '1',
        username: 'admin',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        name: 'Admin User',
      },
      {
        id: '2',
        username: 'rep',
        password: bcrypt.hashSync('rep123', 10),
        role: 'rep',
        name: 'Sales Rep',
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

export function findUser(username: string): AppUser | undefined {
  const users = ensureUsersFile();
  return users.find((u) => u.username === username);
}

export function validatePassword(user: AppUser, password: string): boolean {
  return bcrypt.compareSync(password, user.password);
}
