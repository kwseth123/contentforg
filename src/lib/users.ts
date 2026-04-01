import { AppUser } from './types';
import * as db from './db';

export async function findUser(username: string): Promise<AppUser | undefined> {
  return db.findUser(username);
}

export function validatePassword(user: AppUser, password: string): boolean {
  // Keep bcrypt sync - it's fine for password validation
  const bcrypt = require('bcryptjs');
  return bcrypt.compareSync(password, user.password);
}
