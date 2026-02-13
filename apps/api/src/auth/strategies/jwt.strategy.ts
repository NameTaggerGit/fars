import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private auth: AuthService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'fallback-secret-change-in-production',
    });
  }

  async validate(payload: { sub: string; email?: string; type?: string }): Promise<JwtPayload & { role: string }> {
    if (payload.type !== 'access') throw new UnauthorizedException();
    const user = await this.auth.validateUserById(payload.sub);
    if (!user || user.isBanned || (user.bannedUntil && user.bannedUntil > new Date())) {
      throw new UnauthorizedException();
    }
    return {
      sub: user.id,
      email: user.email,
      type: 'access',
      role: user.role,
    };
  }
}
