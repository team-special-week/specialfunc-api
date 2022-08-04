import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { IUserEntity } from './interfaces/IUserEntity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findUser(
    user: IUserEntity,
    withDeleted: boolean,
  ): Promise<UserEntity | null> {
    if (!user.id && !user.uniqueId) {
      return null;
    }

    return this.userRepository.findOne({
      where: {
        id: user.id ?? undefined,
        uniqueId: user.uniqueId ?? undefined,
      },
      withDeleted,
    });
  }
}
