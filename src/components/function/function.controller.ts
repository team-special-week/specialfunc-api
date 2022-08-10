import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getAllFunctions(
    @CurrentUser() user: IUserEntity,
    @Query('appEndpoint') appEndpoint?: string,
  ) {
    const functions = (
      await this.functionService.getAllFunctions({
        owner: { _id: user._id },
      })
    ).map((value) => value.metadata);

    if (appEndpoint) {
      return functions.filter(
        (value) => value.application.endpoint === appEndpoint,
      );
    } else {
      return functions;
    }
  }
}
