import { IUserEntity } from '../../user/interfaces/IUserEntity';

export interface IApplicationEntity {
  _id?: number;
  name?: string;
  description?: string;
  icon?: string;
  endpoint?: string;
  owner?: IUserEntity;
  createdAt?: Date;
  updatedAt?: Date;
}
