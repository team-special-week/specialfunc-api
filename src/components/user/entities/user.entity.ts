import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EAuthProvider } from '../../auth/enums/EAuthProvider';
import { ITypeORMEntityHelper } from '../../../common/interfaces/ITypeORMEntityHelper';

@Entity('spf_users')
export class UserEntity implements ITypeORMEntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    name: 'unique_id',
  })
  uniqueId: string;

  @Column({
    type: 'enum',
    name: 'auth_provider',
    enum: EAuthProvider,
    default: EAuthProvider.UNKNOWN,
  })
  provider: EAuthProvider;

  @Column({
    type: 'varchar',
    name: 'user_name',
    length: 50,
  })
  nickname: string;

  @Column({
    type: 'text',
    name: 'user_email',
    nullable: true,
  })
  email: string;

  @Column({
    type: 'text',
    name: 'user_profile_url',
  })
  profileImageURL: string;

  @Column({
    type: 'datetime',
    name: 'last_login_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastLoginAt: Date;

  @Column({
    type: 'datetime',
    name: 'block_expires_at',
    nullable: true,
  })
  blockExpiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  get metadata(): any {
    throw new Error('Method not implemented.');
  }
}
