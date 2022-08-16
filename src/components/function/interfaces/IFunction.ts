import { EHttpMethod } from 'src/common/enums/EHttpMethod';
import { IApplicationEntity } from '../../application/interfaces/IAppliationEntity';
import { IUserEntity } from '../../user/interfaces/IUserEntity';

export default interface IFunction {
  _id?: number;
  name?: string;
  uuid?: string;
  endpoint?: string;
  httpMethod?: EHttpMethod;
  application?: IApplicationEntity;
  owner?: IUserEntity;
  createdAt?: Date;
  updatedAt?: Date;
}
