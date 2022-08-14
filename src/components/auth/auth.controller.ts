import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserEntity } from '../user/entities/user.entity';
import { ILoginResponse } from './interfaces/login.interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/kakao')
  @HttpCode(200)
  async loginWithKakao(@Query('code') code: string): Promise<ILoginResponse> {
    const validateResult = await this.authService.validateKakaoLogin(code);
    return this.loginAndMakeResponse(validateResult);
  }

  @Get('/google')
  @HttpCode(200)
  async loginWithGoogle(@Query('code') code: string): Promise<ILoginResponse> {
    const validateResult = await this.authService.validateGoogleLogin(code);
    return this.loginAndMakeResponse(validateResult);
  }

  private loginAndMakeResponse(payload: any): ILoginResponse {
    const { user, isNewUser } = payload as {
      user: UserEntity;
      isNewUser: boolean;
    };

    const token = this.authService.login(user);

    return {
      isNewUser,
      nickname: user.nickname,
      profileImageURL: user.profileImageURL,
      accessToken: token,
    };
  }
}
