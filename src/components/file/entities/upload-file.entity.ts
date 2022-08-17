import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { ITypeORMEntityHelper } from '../../../common/interfaces/ITypeORMEntityHelper';
import IUploadFileEntity from '../interfaces/IUploadFileEntity';

@Entity('spf_upload_files')
export class UploadFileEntity implements ITypeORMEntityHelper {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column({
    type: 'varchar',
    name: 'file_uuid',
    length: 40,
  })
  uuid: string;

  @Column({
    type: 'varchar',
    name: 'file_original_name',
  })
  originalName: string;

  @Column({
    type: 'varchar',
    name: 'file_mime_type',
    nullable: true,
  })
  mimeType: string;

  @Column({
    type: 'int',
    name: 'file_size',
    nullable: true,
  })
  size: number;

  @ManyToOne(() => UserEntity, (user) => user.myUploadFiles)
  registrant: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  get metadata(): IUploadFileEntity {
    return {
      uuid: this.uuid,
      mimeType: this.mimeType,
      size: this.size,
      originalName: this.originalName,
      registrant: this.registrant?.metadata,
      createdAt: this.createdAt,
    };
  }
}
