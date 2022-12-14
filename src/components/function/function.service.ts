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
  PROJECT_DIRECTORY,
  WORK_DIRECTORY,
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
import { promisify } from '../../libs/RunnerHelper';

@Injectable()
export class FunctionService {
  constructor(
    @InjectRepository(FunctionEntity)
    private readonly functionRepository: Repository<FunctionEntity>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ApplicationService))
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
      // endpoint ??? ???????????? ?????? ??????
      if (!appEndpoint) {
        throw new ApplicationNotFoundException();
      }

      // endpoint ??? regexp ??????
      if (!this.isEndpointValid(dto.endpoint)) {
        throw new EndpointNotValidException();
      }

      // ??? Application ??? ?????? endpoint ??? ?????? ??? ?????? ??????
      const myApplications = await this.applicationService.getMyApplications(
        owner,
        appEndpoint,
      );
      if (myApplications.length !== 1) {
        throw new ApplicationNotFoundException();
      }

      application = myApplications[0];

      // ?????? ????????? ?????? ????????? ????????? ??????
      const functions = await this.getAllFunctions({
        application: { _id: application._id },
      });
      if (functions.length >= MAX_FUNCTION_COUNT) {
        throw new ExceedFunctionCountException();
      }
    }

    const user = await this.userService.findUserByIUserEntity(owner);
    {
      // ??? ????????? ?????????????????? ??????
      user.isUserBlocked();

      // endpoint ??? http method ??? ??????????????? ??????
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
      // ??? ????????? ??????
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
      // ????????????????????? ????????? ??????
      if (funcEntity.application.deletedAt !== null) {
        throw new DeletedApplicationException();
      }

      // Endpoint ????????? ?????? ????????? ??????
      if (!this.isEndpointValid(dto.endpoint)) {
        throw new EndpointNotValidException();
      }

      // ?????? Endpoint ??? ?????? ?????? ??????
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

    // ????????? ?????? ????????? ?????? ?????? ?????? ????????? ??????
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

    // ?????? ?????? ??????
    const unzipAsync = new Promise<void>((resolve, reject) => {
      const projectPath = path.join(
        __dirname,
        '../../../',
        'projects',
        funcUUID,
      );
      try {
        // ???????????? ?????? ??????
        fs.rmSync(projectPath, { recursive: true, force: true });

        // ?????? ??????
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

    // ?????? ??????
    await this.runnerService.build(fun.uuid);

    // Lifecycle ??? ??????
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
      // Function ??????
      await this.functionRepository.delete({
        uuid: funcUUID,
      });

      // Docker ??? ?????? ?????? ??? ?????? ??????
      this.runnerService
        .stop(funcUUID)
        .then(() => {
          // ???????????? ?????? ??????
          return promisify(() => {
            const projectPath = path.join(PROJECT_DIRECTORY, funcUUID);
            fs.rmSync(projectPath, { recursive: true, force: true });
          });
        })
        .then(() => {
          // ????????? ????????? ??????
          return this.lifecycleService.terminateLifecycle(funcUUID);
        })
        .catch((ex) => console.error(ex));
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
    // ?????? ??????
    endpoint = endpoint.trim();

    // ??? ????????? ??????
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
