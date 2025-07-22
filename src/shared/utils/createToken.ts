import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

export async function createToken(jwtService: JwtService, user: User) {
  return await jwtService.signAsync({
    sub: user.id,
    email: user.email,
  });
}
