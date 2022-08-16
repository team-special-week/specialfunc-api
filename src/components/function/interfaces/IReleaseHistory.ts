import { EBuildStatus } from '../../../common/enums/EBuildStatus';
import IFunction from './IFunction';

export default interface IReleaseHistory {
  _id?: number;
  buildStatus?: EBuildStatus;
  zipFileSize?: number;
  func?: IFunction;
  createdAt?: Date;
  updatedAt?: Date;
}
