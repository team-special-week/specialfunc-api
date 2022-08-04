import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(uniqueId: string): Promise<UserEntity | null> {
    const user = await this.userService.findUser(
      {
        uniqueId,
      },
      true,
    );

    if (!user) {
      return null;
    }

    {
      // 탈퇴한 계정인지 확인
    }
  }
}
