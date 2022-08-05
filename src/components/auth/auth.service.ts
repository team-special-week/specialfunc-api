import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/entities/user.entity';
import {
  BlockedUserException,
  UnregisteredUserException,
} from './exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

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
      if (user.blockExpiresAt && user.blockExpiresAt.getTime() > Date.now()) {
        throw new BlockedUserException(user.blockExpiresAt);
      }
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
      id: user.id,
      provider: user.provider,
    });
  }
}
