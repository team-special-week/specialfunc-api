import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import ILoginResult from '../interfaces/ILoginResult';

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

    let account = await this.authService.validateUser(loginResult.uniqueId);
    let isNewUser = false;

    if (!account) {
      // 계정이 없는 경우, 새로 만들도록 한다.
      account = await this.userService.createAccount(
        dto,
        EAccountProvider.KAKAO,
      );
      isNewUser = true;
    }

    return {
      account,
      isNewUser,
    };
  }
}
