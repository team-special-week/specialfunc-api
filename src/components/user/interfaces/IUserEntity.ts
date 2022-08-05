import { EAuthProvider } from '../../auth/enums/EAuthProvider';

export interface IUserEntity {
  id?: number;
  uniqueId?: string;
  provider?: EAuthProvider;
  nickname?: string;
  email?: string;
  profileImageURL?: string;
  lastLoginAt?: Date;
}
