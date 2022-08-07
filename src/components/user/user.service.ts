import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { IUserEntity } from './interfaces/IUserEntity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  findUserByIUserEntity(user: IUserEntity) {
    return this.findUser({
      where: {
        id: user.id,
      },
    });
  }

  findUser(options: FindOneOptions<UserEntity>) {
    return this.userRepository.findOne(options);
  }

  saveOrUpdateUser(user: UserEntity) {
    return this.userRepository.save(user);
  }
}
