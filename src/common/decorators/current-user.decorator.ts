import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../components/user/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: any, ctx: ExecutionContext): UserEntity => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as UserEntity;
  },
);
