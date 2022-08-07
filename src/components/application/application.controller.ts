import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { CreateApplicationDto } from './dto/create-application.dto';

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
}
