import { EHttpMethod } from 'src/common/enums/EHttpMethod';
import { IApplicationEntity } from '../../application/interfaces/IAppliationEntity';
import { IUserEntity } from '../../user/interfaces/IUserEntity';
import { EFunctionStatus } from '../../../common/enums/EFunctionStatus';

export default interface IFunction {
  _id?: number;
  name?: string;
  uuid?: string;
  status?: EFunctionStatus;
  endpoint?: string;
  httpMethod?: EHttpMethod;
  application?: IApplicationEntity;
  owner?: IUserEntity;
}
