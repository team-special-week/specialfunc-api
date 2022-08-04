import { SetMetadata } from '@nestjs/common';

export interface IGuardOptions {
  nullable: boolean;
}

export const GuardOptions = (options: IGuardOptions) =>
  SetMetadata('options', options);