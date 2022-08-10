import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FunctionEntity } from './entities/function.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { ApplicationService } from '../application/application.service';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { CreateFunctionDto } from './dto/create-function.dto';
import { ApplicationEntity } from '../application/entities/application.entity';
import {
  ApplicationNotFoundException,
  DeletedApplicationException,
} from '../application/exceptions/application.exceptions';
import { IApplicationEntity } from '../application/interfaces/IAppliationEntity';
import { EHttpMethod } from '../../common/enums/EHttpMethod';
import {
  EndpointNotValidException,
  EndpointOrMethodExistsException,
  ExceedFunctionCountException,
  FunctionNotFoundException,
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

  async getAllFunctions(options: FindOptionsWhere<FunctionEntity>) {
    return this.functionRepository.find({
      where: options,
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

      // endpoint 의 regexp 검사
      if (!this.isEndpointValid(dto.endpoint)) {
        throw new EndpointNotValidException();
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
      const functions = await this.getAllFunctions({
        application: { _id: application._id },
      });
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

  async updateFunction(
    owner: IUserEntity,
    dto: CreateFunctionDto,
    funcUUID: string,
  ) {
    let funcEntity: FunctionEntity = null;
    {
      const tmp = await this.getAllFunctions({
        owner: { _id: owner._id },
        uuid: funcUUID,
      });

      if (tmp.length === 1) {
        funcEntity = tmp[0];
      } else {
        throw new FunctionNotFoundException();
      }
    }

    {
      // 애플리케이션이 삭제된 경우
      if (funcEntity.application.deletedAt !== null) {
        throw new DeletedApplicationException();
      }

      // Endpoint 형태에 대한 유효성 검증
      if (!this.isEndpointValid(dto.endpoint)) {
        throw new EndpointNotValidException();
      }

      // 해당 Endpoint 의 존재 여부 확인
      if (dto.endpoint !== funcEntity.endpoint) {
        if (
          !(await this.isEndpointAndMethodAvailable(
            funcEntity.application,
            dto.endpoint,
            dto.httpMethod,
          ))
        ) {
          throw new EndpointOrMethodExistsException();
        }
      }
    }

    funcEntity.applyFromCreateFunctionDto(dto);
    return (await this.functionRepository.save(funcEntity)).metadata;
  }

  async isEndpointAndMethodAvailable(
    app: IApplicationEntity,
    endpoint: string,
    httpMethod: EHttpMethod,
  ): Promise<boolean> {
    const allFunctions = await this.getAllFunctions({
      application: { _id: app._id },
    });
    console.log(allFunctions);

    return (
      allFunctions.filter(
        (func) =>
          func.endpoint === endpoint &&
          (func.httpMethod === httpMethod ||
            func.httpMethod === EHttpMethod.HM_ANY),
      ).length === 0
    );
  }

  isEndpointValid(endpoint: string) {
    // 공백 제거
    endpoint = endpoint.trim();

    // 첫 슬레시 제거
    if (endpoint[0] === '/') {
      endpoint = endpoint.slice(1, endpoint.length);
    }

    const element = endpoint.split('/');
    for (const el of element) {
      if (el.length === 0) {
        return false;
      }

      if (!/^\/[a-zA-Z\d-*]*/g.test(`/${el}`)) {
        return false;
      }
    }

    return true;
  }
}
