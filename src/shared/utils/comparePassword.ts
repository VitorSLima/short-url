import { compare } from 'bcrypt';

export async function comparePassword(password: string, hash: string) {
  return await compare(password, hash);
}
