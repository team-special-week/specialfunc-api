import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { ILoginResult } from '../interfaces/login.interfaces';
import { UserEntity } from '../../user/entities/user.entity';
import { EAuthProvider } from '../enums/EAuthProvider';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.get('KAKAO_CLIENT_ID'),
      callbackURL: configService.get('KAKAO_CALLBACK_URL'),
    });
  }

  async validate(accessToken, refreshToken, profile) {
    const loginResult = {
      uniqueId: String(profile.id),
      nickname: profile.username,
      profileImageURL: profile._json?.properties?.profile_image,
      emailAddress: profile._json?.kakao_account?.email,
    } as ILoginResult;

    let user = await this.authService.validateUser(loginResult.uniqueId);
    let isNewUser = false;

    if (!user) {
      // 계정이 없는 경우, 새로 만들도록 한다.
      user = new UserEntity();
      user.provider = EAuthProvider.KAKAO;
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
