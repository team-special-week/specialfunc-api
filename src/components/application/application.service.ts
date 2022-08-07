import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { Repository } from 'typeorm';
import { CreateApplicationDto } from './dto/create-application.dto';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { MAX_APPLICATION_COUNT } from '../../common/constants/policy.constant';
import {
  EndpointAlreadyExistsException,
  ExceedApplicationCountException,
} from './exceptions/application.exceptions';
import { UserService } from '../user/user.service';
import { IApplicationEntity } from './interfaces/IAppliationEntity';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    private readonly userService: UserService,
  ) {}

  async createApplication(
    dto: CreateApplicationDto,
    owner: IUserEntity,
  ): Promise<IApplicationEntity> {
    const myApplications = await this.applicationRepository.find({
      where: {
        owner: owner,
      },
    });

    const user = await this.userService.findUserByIUserEntity(owner);
    {
      // 유저가 만들 수 있는 최대 애플리케이션을 초과했는지 확인
      if (MAX_APPLICATION_COUNT <= myApplications.length) {
        throw new ExceedApplicationCountException();
      }

      // 이 유저가 차단된 상태인지 확인
      user.isUserBlocked();

      // endpoint 가 이미 점유된 상태인지 확인
      const tmpApp = await this.applicationRepository.findOne({
        where: {
          endpoint: dto.endpoint,
        },
      });
      if (tmpApp) {
        throw new EndpointAlreadyExistsException();
      }
    }

    // 애플리케이션 생성
    const appEntity = new ApplicationEntity();
    appEntity.applyFromCreateApplicationDto(dto);
    appEntity.owner = user;
    await this.applicationRepository.save(appEntity);

    return appEntity.metadata;
  }
}
