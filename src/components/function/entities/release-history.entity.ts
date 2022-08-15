import { ITypeORMEntityHelper } from '../../../common/interfaces/ITypeORMEntityHelper';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EBuildStatus } from '../../../common/enums/EBuildStatus';
import { FunctionEntity } from './function.entity';
import IReleaseHistory from '../interfaces/IReleaseHistory';

@Entity('spf_function_releases')
export class ReleaseHistoryEntity implements ITypeORMEntityHelper {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column({
    name: 'func_build_status',
    type: 'enum',
    enum: EBuildStatus,
  })
  buildStatus: EBuildStatus;

  @Column({
    name: 'func_zipfile_size',
    type: 'int',
  })
  zipFileSize: number;

  @Column({
    name: 'func_port',
    type: 'int',
    nullable: true,
  })
  port?: number;

  @ManyToOne(() => FunctionEntity, (func) => func.releaseHistory)
  func: FunctionEntity;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  get metadata(): IReleaseHistory {
    return {
      _id: this._id,
      buildStatus: this.buildStatus,
      zipFileSize: this.zipFileSize,
      func: this.func?.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
