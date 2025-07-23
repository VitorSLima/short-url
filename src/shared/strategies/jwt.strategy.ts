import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { config } from 'dotenv';
import { UserRequest } from '../interfaces/User';

config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * Validate the JWT token
   * @param payload - The payload of the JWT token
   * @returns The user object
   */
  async validate(payload: UserRequest) {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
