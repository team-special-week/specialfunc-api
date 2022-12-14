import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { MoreThan, Repository } from 'typeorm';
import { CreateApplicationDto } from './dto/create-application.dto';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import {
  ENDPOINT_RESPAWN_TIME,
  LIFECYCLE_INTERVAL,
  MAX_APPLICATION_COUNT,
} from '../../common/constants/policy.constant';
import {
  ApplicationNotFoundException,
  EndpointAlreadyExistsException,
  ExceedApplicationCountException,
} from './exceptions/application.exceptions';
import { UserService } from '../user/user.service';
import { IApplicationEntity } from './interfaces/IAppliationEntity';
import { Interval } from '@nestjs/schedule';
import { FunctionService } from '../function/function.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => FunctionService))
    private readonly functionService: FunctionService,
  ) {}

  async createApplication(
    dto: CreateApplicationDto,
    owner: IUserEntity,
  ): Promise<IApplicationEntity> {
    const myApplications = await this.getMyApplications(owner);

    const user = await this.userService.findUserByIUserEntity(owner);
    {
      // 유저가 만들 수 있는 최대 애플리케이션을 초과했는지 확인
      if (MAX_APPLICATION_COUNT <= myApplications.length) {
        throw new ExceedApplicationCountException();
      }

      // 이 유저가 차단된 상태인지 확인
      user.isUserBlocked();

      // 이 endpoint 가 이용 가능한지 확인
      if (!(await this.isEndpointAvailable(dto.endpoint))) {
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

  async updateApplication(
    dto: CreateApplicationDto,
    owner: IUserEntity,
    endpoint: string,
  ) {
    // 대상 Application 을 찾는다.
    const myApplication = await this.getMyApplications(owner, endpoint);
    if (myApplication.length !== 1) {
      throw new ApplicationNotFoundException();
    }

    // endpoint 를 변경하려는 경우, 해당 endpoint 가 이미 존재하는지 확인
    if (dto.endpoint !== endpoint) {
      if (!(await this.isEndpointAvailable(dto.endpoint))) {
        throw new EndpointAlreadyExistsException();
      }
    }

    // Update 처리 한다.
    await this.applicationRepository.update(myApplication[0]._id, {
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      endpoint: dto.endpoint,
    });
  }

  async deleteApplication(owner: IUserEntity, endpoint: string) {
    let application: ApplicationEntity = null;
    {
      const myApplication = await this.getMyApplications(owner, endpoint);
      if (myApplication.length !== 1) {
        throw new ApplicationNotFoundException();
      }
      application = myApplication[0];
    }

    // Function 중지 및 전체 삭제
    const funcs = await this.functionService.getAllFunctions({
      application: { _id: application._id },
    });
    for (const fun of funcs) {
      this.functionService
        .deleteFunction(owner, fun.uuid)
        .catch((ex) => console.error(ex));
    }

    await this.applicationRepository.softDelete(application._id);
  }

  async getMyApplications(owner: IUserEntity, endpoint?: string) {
    return this.applicationRepository.find({
      where: {
        owner: { _id: owner._id },
        endpoint: endpoint ? endpoint : undefined,
      },
    });
  }

  async isEndpointAvailable(endpoint: string): Promise<boolean> {
    // endpoint 가 이미 점유된 상태인지 확인
    const tmpApp = await this.applicationRepository.findOne({
      where: {
        endpoint,
      },
      withDeleted: true,
    });

    return !tmpApp;
  }

  @Interval(1000 * 3600)
  async clearDeletedApplications() {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + ENDPOINT_RESPAWN_TIME);

    // Soft delete 된 애플리케이션 중, ENDPOINT_RESPAWN_TIME 가 지난 앱을 삭제
    return this.applicationRepository.delete({
      deletedAt: MoreThan(expiredDate),
    });
  }
}
