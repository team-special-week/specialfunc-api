import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description: string;

  @IsString()
  @IsOptional()
  icon: string;

  @IsString()
  @Matches(/[a-zA-Z\d-]/g)
  @MinLength(3)
  @MaxLength(25)
  endpoint: string;
}
