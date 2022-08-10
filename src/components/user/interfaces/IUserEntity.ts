import { EAuthProvider } from '../../auth/enums/EAuthProvider';

export interface IUserEntity {
  _id?: number;
  uniqueId?: string;
  provider?: EAuthProvider;
  nickname?: string;
  email?: string;
  profileImageURL?: string;
  lastLoginAt?: Date;
}
