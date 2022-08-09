import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FunctionEntity } from './entities/function.entity';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { ApplicationService } from '../application/application.service';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { CreateFunctionDto } from './dto/create-function.dto';
import { ApplicationEntity } from '../application/entities/application.entity';
import { ApplicationNotFoundException } from '../application/exceptions/application.exceptions';
import { IApplicationEntity } from '../application/interfaces/IAppliationEntity';
import { EHttpMethod } from '../../common/enums/EHttpMethod';
import {
  EndpointOrMethodExistsException,
  ExceedFunctionCountException,
} from './exceptions/function.exceptions';
import { v4 as uuidv4 } from 'uuid';
import { MAX_FUNCTION_COUNT } from '../../common/constants/policy.constant';

@Injectable()
export class FunctionService {
  constructor(
    @InjectRepository(FunctionEntity)
    private readonly functionRepository: Repository<FunctionEntity>,
    private readonly userService: UserService,
    private readonly applicationService: ApplicationService,
  ) {}

  async getAllFunctions(application: IApplicationEntity) {
    return this.functionRepository.find({
      where: {
        application: { _id: application._id },
      },
      relations: ['application'],
    });
  }

  async createFunction(
    owner: IUserEntity,
    dto: CreateFunctionDto,
    appEndpoint: string,
  ) {
    let application: ApplicationEntity;
    {
      // endpoint 를 지정하지 않은 경우
      if (!appEndpoint) {
        throw new ApplicationNotFoundException();
      }

      // 내 Application 중 해당 endpoint 를 찾을 수 없는 경우
      const myApplications = await this.applicationService.getMyApplications(
        owner,
        appEndpoint,
      );
      if (myApplications.length !== 1) {
        throw new ApplicationNotFoundException();
      }

      application = myApplications[0];

      // 생성 가능한 함수 개수를 초과한 경우
      const functions = await this.getAllFunctions(application);
      if (functions.length >= MAX_FUNCTION_COUNT) {
        throw new ExceedFunctionCountException();
      }
    }

    const user = await this.userService.findUserByIUserEntity(owner);
    {
      // 이 유저가 블락되었는지 확인
      user.isUserBlocked();

      // endpoint 와 http method 가 중복되는지 확인
      if (
        !(await this.isEndpointAndMethodAvailable(
          application,
          dto.endpoint,
          dto.httpMethod,
        ))
      ) {
        throw new EndpointOrMethodExistsException();
      }
    }

    let savedEntity: FunctionEntity;
    {
      // 새 엔티티 저장
      const funcEntity = new FunctionEntity();
      funcEntity.applyFromCreateFunctionDto(dto);
      funcEntity.application = application;
      funcEntity.owner = user;
      funcEntity.uuid = (uuidv4() as string).replace(/-/gi, '');
      savedEntity = await this.functionRepository.save(funcEntity);
    }

    return savedEntity.metadata;
  }

  async isEndpointAndMethodAvailable(
    app: IApplicationEntity,
    endpoint: string,
    httpMethod: EHttpMethod,
  ): Promise<boolean> {
    const allFunctions = await this.getAllFunctions(app);

    return (
      allFunctions.filter(
        (func) =>
          func.endpoint === endpoint &&
          (func.httpMethod === httpMethod ||
            func.httpMethod === EHttpMethod.HM_ANY),
      ).length === 0
    );
  }

  endpointRebase(endpoint: string) {}
}
