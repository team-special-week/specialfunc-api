import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EHttpMethod } from '../../../common/enums/EHttpMethod';

export class CreateFunctionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(75)
  name: string;

  @IsString()
  @Matches(/[a-zA-Z\d-/*]/g)
  @MaxLength(100)
  endpoint: string;

  @IsEnum(EHttpMethod)
  httpMethod: EHttpMethod;
}
