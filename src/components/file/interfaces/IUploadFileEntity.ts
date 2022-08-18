import { IUserEntity } from '../../user/interfaces/IUserEntity';

export default interface IUploadFileEntity {
  uuid?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  registrant?: IUserEntity;
  createdAt?: Date;
}