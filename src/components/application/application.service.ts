import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { Repository } from 'typeorm';
import { CreateApplicationDto } from './dto/create-application.dto';
import { IUserEntity } from '../user/interfaces/IUserEntity';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
  ) {}

  async createApplication(dto: CreateApplicationDto, owner: IUserEntity) {
    const myApplications = await this.applicationRepository.find({
      where: {
        owner: owner,
      },
    });

    console.log(myApplications);
  }
}
