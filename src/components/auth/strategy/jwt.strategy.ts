import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_TOKEN'),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findUser({
      where: {
        _id: payload.id,
        provider: payload.provider,
      },
    });

    if (user) {
      return user.metadata;
    } else {
      throw new UnauthorizedException();
    }
  }
}
