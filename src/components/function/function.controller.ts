import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FunctionService } from './function.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFunctionDto } from './dto/create-function.dto';
import { FunctionNotFoundException } from './exceptions/function.exceptions';

@Controller('function')
export class FunctionController {
  constructor(private readonly functionService: FunctionService) {}

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

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async createFunction(
    @CurrentUser() user: IUserEntity,
    @Body() dto: CreateFunctionDto,
    @Query('appEndpoint') appEndpoint?: string,
  ) {
    return this.functionService.createFunction(user, dto, appEndpoint);
  }

  //@UseGuards(JwtAuthGuard)
  @Post('/build/:funcUUID')
  async buildFunction(@Param('funcUUID') funcUUID: string) {
    return this.functionService.buildFunctionProject(funcUUID);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:funcUUID')
  async getOneFunction(
    @CurrentUser() user: IUserEntity,
    @Param('funcUUID') funcUUID: string,
  ) {
    if (!funcUUID) {
      throw new FunctionNotFoundException();
    }

    const func = await this.functionService.getAllFunctions({
      owner: { _id: user._id },
      uuid: funcUUID,
    });

    if (func.length === 1) {
      return func[0].metadata;
    } else {
      throw new FunctionNotFoundException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:funcUUID')
  async updateFunction(
    @CurrentUser() user: IUserEntity,
    @Body() dto: CreateFunctionDto,
    @Param('funcUUID') funcUUID: string,
  ) {
    return this.functionService.updateFunction(user, dto, funcUUID);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:funcUUID')
  async deleteFunction(
    @CurrentUser() user: IUserEntity,
    @Param('funcUUID') funcUUID: string,
  ) {
    if (!funcUUID) {
      throw new FunctionNotFoundException();
    }

    return this.functionService.deleteFunction(user, funcUUID);
  }
}
