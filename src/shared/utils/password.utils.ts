import { compare, hash } from 'bcrypt';

/**
 * Hash a password
 * @param password - The password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string) {
  return await hash(password, 10);
}

/**
 * Compare a password with a hash
 * @param password - The password to compare
 * @param hash - The hash to compare
 * @returns True if the password is valid, false otherwise
 */
export async function comparePassword(password: string, hash: string) {
  return await compare(password, hash);
}
