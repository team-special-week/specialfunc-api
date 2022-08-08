import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from '../user/entities/user.entity';
import { ILoginResponse } from './interfaces/login.interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/kakao')
  @HttpCode(200)
  @UseGuards(AuthGuard('kakao'))
  loginWithKakao() {
    return HttpStatus.OK;
  }

  @Get('/kakao/callback')
  @HttpCode(200)
  @UseGuards(AuthGuard('kakao'))
  async loginWithKakaoCallback(@Req() req): Promise<ILoginResponse> {
    return this.loginAndMakeResponse(req.user);
  }

  @Get('/google')
  @HttpCode(200)
  @UseGuards(AuthGuard('google'))
  loginWithGoogle() {
    return HttpStatus.OK;
  }

  @Get('/google/callback')
  @HttpCode(200)
  @UseGuards(AuthGuard('google'))
  async loginWithGoogleCallback(@Req() req): Promise<ILoginResponse> {
    return this.loginAndMakeResponse(req.user);
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
