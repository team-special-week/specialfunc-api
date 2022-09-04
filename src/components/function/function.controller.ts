import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FunctionService } from './function.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFunctionDto } from './dto/create-function.dto';
import { FunctionNotFoundException } from './exceptions/function.exceptions';
import { FileInterceptor } from '@nestjs/platform-express';
import { promisify } from '../../libs/RunnerHelper';
import * as fs from 'fs';

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
    // 2022.09.04 ep 의 첫 글자가 slash 인지 확인하고 아니면 붙이고
    if (dto.endpoint[0] !== '/') {
      dto.endpoint = `/${dto.endpoint}`;
    }

    console.log(dto);
    return;

    return this.functionService.createFunction(user, dto, appEndpoint);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:funcUUID/build')
  @UseInterceptors(FileInterceptor('file'))
  async buildFunction(
    @CurrentUser() user: IUserEntity,
    @Param('funcUUID') funcUUID: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 50 }),
          new FileTypeValidator({ fileType: 'zip' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      return await this.functionService.buildFunctionProject(
        user,
        funcUUID,
        file.path,
      );
    } finally {
      // 임시 파일 삭제
      promisify(() => {
        fs.rmSync(file.path, { force: true });
      }).then();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:funcUUID/release-history')
  async getReleaseHistory(
    @CurrentUser() user: IUserEntity,
    @Param('funcUUID') funcUUID: string,
  ) {
    if (!funcUUID) {
      throw new FunctionNotFoundException();
    }

    return this.functionService.getReleaseHistory(user, funcUUID);
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
