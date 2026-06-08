import bcrypt from 'bcryptjs';

export async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, 12);
}

export async function verifyPassword(plaintext, hashed) {
  return bcrypt.compare(plaintext, hashed);
}
