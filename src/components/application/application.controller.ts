import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { IApplicationEntity } from './interfaces/IAppliationEntity';
import { ApplicationNotFoundException } from './exceptions/application.exceptions';

@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async createApplication(
    @CurrentUser() user: IUserEntity,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.createApplication(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getMyApplications(
    @CurrentUser() user: IUserEntity,
    @Query('endpoint') endpoint?: string,
  ): Promise<IApplicationEntity[] | IApplicationEntity> {
    const myApplications = await this.applicationService.getMyApplications(
      user,
      endpoint,
    );

    if (endpoint) {
      if (myApplications.length === 0) {
        // endpoint 가 잘못된 경우
        throw new ApplicationNotFoundException();
      }

      return myApplications[0].metadata;
    } else {
      return myApplications.map((app) => app.metadata);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/')
  async updateApplication(
    @CurrentUser() user: IUserEntity,
    @Body() dto: CreateApplicationDto,
    @Query('endpoint') endpoint?: string,
  ) {
    if (!endpoint) {
      throw new ApplicationNotFoundException();
    }

    return this.applicationService.updateApplication(dto, user, endpoint);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/')
  async deleteApplication(
    @CurrentUser() user: IUserEntity,
    @Query('endpoint') endpoint?: string,
  ) {
    if (!endpoint) {
      throw new ApplicationNotFoundException();
    }

    return this.applicationService.deleteApplication(user, endpoint);
  }
}
