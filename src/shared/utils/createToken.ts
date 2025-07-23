import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

/**
 * Create a JWT token
 * @param jwtService - The JwtService instance
 * @param user - The user to create the token for
 * @returns The JWT token
 */
export async function createToken(jwtService: JwtService, user: User) {
  return await jwtService.signAsync({
    sub: user.id,
    email: user.email,
  });
}
