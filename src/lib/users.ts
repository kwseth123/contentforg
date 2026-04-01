import { AppUser } from './types';
import * as db from './db';

let _seeded = false;

export async function findUser(username: string): Promise<AppUser | undefined> {
  // Ensure default company + users exist on first login attempt
  if (!_seeded) {
    await db.ensureCompany('default');
    await db.ensureDefaultUsers();
    _seeded = true;
  }
  return db.findUser(username);
}

export function validatePassword(user: AppUser, password: string): boolean {
  // Keep bcrypt sync - it's fine for password validation
  const bcrypt = require('bcryptjs');
  return bcrypt.compareSync(password, user.password);
}
