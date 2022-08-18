import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
  BuildAlreadyRunningException,
  EndpointNotValidException,
  EndpointOrMethodExistsException,
  ExceedFunctionCountException,
  FunctionNotFoundException,
} from './exceptions/function.exceptions';
import { v4 as uuidv4 } from 'uuid';
import {
  LIFECYCLE_POSITIVE_RULE,
  MAX_FUNCTION_COUNT,
} from '../../common/constants/policy.constant';
import { RunnerService } from '../runner/runner.service';
import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as path from 'path';
import { ReleaseHistoryService } from './apps/release-history.service';
import { EBuildStatus } from '../../common/enums/EBuildStatus';
import IReleaseHistory from './interfaces/IReleaseHistory';
import { LifecycleService } from './apps/lifecycle.service';
import { ELifecyclePositive } from '../../common/enums/ELifecycle';

@Injectable()
export class FunctionService {
  constructor(
    @InjectRepository(FunctionEntity)
    private readonly functionRepository: Repository<FunctionEntity>,
    private readonly userService: UserService,
    private readonly applicationService: ApplicationService,
    @Inject(forwardRef(() => RunnerService))
    private readonly runnerService: RunnerService,
    private readonly releaseHistoryService: ReleaseHistoryService,
    @Inject(forwardRef(() => LifecycleService))
    private readonly lifecycleService: LifecycleService,
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

    const uuid = (uuidv4() as string).replace(/-/gi, '');
    let savedEntity: FunctionEntity;
    {
      // 새 엔티티 저장
      const funcEntity = new FunctionEntity();
      funcEntity.applyFromCreateFunctionDto(dto);
      funcEntity.application = application;
      funcEntity.owner = user;
      funcEntity.uuid = uuid;
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

  async buildFunctionProject(
    owner: IUserEntity,
    funcUUID: string,
    funcZipPath: string,
  ) {
    let fun: FunctionEntity = null;
    {
      const func = await this.getAllFunctions({
        owner: { _id: owner._id },
        uuid: funcUUID,
      });

      if (func.length === 1) {
        fun = func[0];
      } else {
        throw new FunctionNotFoundException();
      }
    }

    // 마지막 빌드 기록을 보고 현재 빌드 상태를 확인
    const lastReleaseHistory =
      await this.releaseHistoryService.findLastReleaseHistory(funcUUID);
    if (
      lastReleaseHistory !== null &&
      lastReleaseHistory.buildStatus === EBuildStatus.BUILD_PROCESS
    ) {
      throw new BuildAlreadyRunningException();
    } else {
      const stat = fs.statSync(funcZipPath);
      await this.releaseHistoryService.createReleaseHistory(
        funcUUID,
        stat.size,
      );
    }

    // 함수 압축 해제
    const unzipAsync = new Promise<void>((resolve, reject) => {
      const projectPath = path.join(
        __dirname,
        '../../../',
        'projects',
        funcUUID,
      );
      try {
        // 프로젝트 폴더 삭제
        fs.rmSync(projectPath, { recursive: true, force: true });

        // 압축 해제
        fs.createReadStream(funcZipPath)
          .pipe(unzipper.Extract({ path: projectPath }))
          .promise()
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      } catch (ex) {
        console.error(ex);
        reject();
      }
    });
    await unzipAsync;

    // 함수 빌드
    await this.runnerService.build(fun.uuid);

    // Lifecycle 에 등록
    await this.lifecycleService.enrollLifecycle(
      fun.uuid,
      LIFECYCLE_POSITIVE_RULE[ELifecyclePositive.FUNCTION_BUILD],
    );

    return fun.metadata;
  }

  async getReleaseHistory(
    owner: IUserEntity,
    funcUUID: string,
  ): Promise<IReleaseHistory[]> {
    const func = await this.functionRepository.findOne({
      where: {
        uuid: funcUUID,
        owner: { _id: owner._id },
      },
      relations: ['releaseHistory'],
    });

    if (!func) {
      throw new FunctionNotFoundException();
    }

    return func.releaseHistory.map((value) => value.metadata);
  }

  async deleteFunction(owner: IUserEntity, funcUUID: string) {
    const func = await this.functionRepository.findOne({
      where: {
        uuid: funcUUID,
        owner: { _id: owner._id },
      },
    });

    if (func) {
      // TODO
      // Runner 에게 function 프로젝트 삭제를 요청

      // Function 삭제
      await this.functionRepository.delete({
        uuid: funcUUID,
      });
    } else {
      throw new FunctionNotFoundException();
    }
  }

  async isEndpointAndMethodAvailable(
    app: IApplicationEntity,
    endpoint: string,
    httpMethod: EHttpMethod,
  ): Promise<boolean> {
    const allFunctions = await this.getAllFunctions({
      application: { _id: app._id },
    });

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
