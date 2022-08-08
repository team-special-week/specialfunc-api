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

@Injectable()
export class FunctionService {
  constructor(
    @InjectRepository(FunctionEntity)
    private readonly functionRepository: Repository<FunctionEntity>,
    private readonly userService: UserService,
    private readonly applicationService: ApplicationService,
  ) {}

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
    }
  }
}
