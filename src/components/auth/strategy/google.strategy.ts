import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';
import { ILoginResult } from '../interfaces/login.interfaces';
import { UserEntity } from '../../user/entities/user.entity';
import { EAuthProvider } from '../enums/EAuthProvider';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken, refreshToken, profile) {
    const loginResult = {
      uniqueId: profile.id,
      nickname: profile.displayName,
      profileImageURL: profile._json?.picture,
      emailAddress: profile._json?.email,
    } as ILoginResult;

    let user = await this.authService.validateUser(loginResult.uniqueId);
    let isNewUser = false;

    if (!user) {
      // 계정이 없는 경우, 새로 만들도록 한다.
      user = new UserEntity();
      user.provider = EAuthProvider.GOOGLE;
      user.applyFromLoginResult(loginResult);
      isNewUser = true;

      await this.userService.saveOrUpdateUser(user);
    }

    return {
      user,
      isNewUser,
    };
  }
}
