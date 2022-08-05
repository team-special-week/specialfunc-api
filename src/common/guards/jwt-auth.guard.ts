import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IGuardOptions } from '../decorators/guard-options.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    let options = this.reflector.get<IGuardOptions>(
      'options',
      context.getHandler(),
    );

    if (!options) {
      // 옵션이 없다면 기본 값을 지정
      options = {
        nullable: false,
      };
    }

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (authorization) {
      return super.canActivate(context);
    } else {
      return options.nullable;
    }
  }
}
