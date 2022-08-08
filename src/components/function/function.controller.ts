import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { FunctionService } from './function.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFunctionDto } from './dto/create-function.dto';

@Controller('function')
export class FunctionController {
  constructor(private readonly functionService: FunctionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/:appEndpoint')
  async createFunction(
    @CurrentUser() user: IUserEntity,
    @Body() dto: CreateFunctionDto,
    @Param('appEndpoint') appEndpoint: string,
  ) {
    return this.functionService.createFunction(user, dto, appEndpoint);
  }
}
