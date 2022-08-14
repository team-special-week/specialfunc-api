import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/entities/user.entity';
import { UnregisteredUserException } from './exceptions/auth.exceptions';
import axios, { AxiosResponse } from 'axios';
import { ILoginResult } from './interfaces/login.interfaces';
import { EAuthProvider } from './enums/EAuthProvider';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateKakaoLogin(token: string) {
    const loginResult = await AuthService.validateToken(
      token,
      EAuthProvider.KAKAO,
    );

    let user = await this.validateUser(loginResult.uniqueId);
    let isNewUser = false;
    if (!user) {
      // 계정이 없는 경우, 새로 만들도록 한다.
      user = await this.createAccount(EAuthProvider.KAKAO, loginResult);
      isNewUser = true;
    }

    return {
      user,
      isNewUser,
    };
  }

  async validateGoogleLogin(token: string) {
    const loginResult = await AuthService.validateToken(
      token,
      EAuthProvider.GOOGLE,
    );

    let user = await this.validateUser(loginResult.uniqueId);
    let isNewUser = false;
    if (!user) {
      // 계정이 없는 경우, 새로 만들도록 한다.
      user = await this.createAccount(EAuthProvider.GOOGLE, loginResult);
      isNewUser = true;
    }

    return {
      user,
      isNewUser,
    };
  }

  async validateUser(uniqueId: string): Promise<UserEntity | null> {
    const user = await this.userService.findUser({
      where: {
        uniqueId,
      },
      withDeleted: true,
    });

    if (!user) {
      return null;
    }

    {
      // 탈퇴한 계정인지 확인
      if (user.deletedAt) {
        throw new UnregisteredUserException(user.deletedAt);
      }

      // 차단된 계정인지 확인
      user.isUserBlocked();
    }

    {
      // 마지막 로그인 날짜 업데이트
      user.lastLoginAt = new Date();
      await this.userService.saveOrUpdateUser(user);
    }

    return user;
  }

  login(user: UserEntity) {
    return this.jwtService.sign({
      id: user._id,
      provider: user.provider,
    });
  }

  private static async validateToken(
    token: string,
    provider: EAuthProvider,
  ): Promise<ILoginResult> {
    let response: AxiosResponse = null;
    try {
      if (provider === EAuthProvider.GOOGLE) {
        response = await axios.get(
          `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`,
        );
      }

      if (provider === EAuthProvider.KAKAO) {
        response = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (ex) {
      throw new UnauthorizedException();
    }

    if (response === null || response.status !== 200) {
      throw new UnauthorizedException();
    }

    let loginResult: ILoginResult = null;
    {
      if (provider === EAuthProvider.GOOGLE) {
        loginResult = {
          uniqueId: response.data.id,
          nickname: response.data.name,
          profileImageURL: response.data.picture,
          emailAddress: response.data.email,
        } as ILoginResult;
      }

      if (provider === EAuthProvider.KAKAO) {
        loginResult = {
          uniqueId: String(response.data.id),
          nickname: response.data.properties?.nickname,
          profileImageURL: response.data.properties?.profile_image,
          emailAddress: response.data.kakao_account?.email,
        } as ILoginResult;
      }
    }

    return loginResult;
  }

  private async createAccount(
    provider: EAuthProvider,
    loginResult: ILoginResult,
  ): Promise<UserEntity> {
    const user = new UserEntity();
    user.provider = provider;
    user.applyFromLoginResult(loginResult);
    await this.userService.saveOrUpdateUser(user);
    return user;
  }
}
