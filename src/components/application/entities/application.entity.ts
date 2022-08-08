import { UserEntity } from 'src/components/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { ITypeORMEntityHelper } from '../../../common/interfaces/ITypeORMEntityHelper';
import { IApplicationEntity } from '../interfaces/IAppliationEntity';

@Entity('spf_applications')
export class ApplicationEntity implements ITypeORMEntityHelper {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column({
    name: 'app_name',
    type: 'varchar',
    length: 50,
  })
  name: string;

  @Column({
    name: 'app_description',
    type: 'text',
  })
  description: string;

  @Column({
    name: 'app_icon',
    type: 'varchar',
    nullable: true,
  })
  icon: string;

  @Index('idx_endpoint', {
    unique: true,
  })
  @Column({
    unique: true,
    name: 'app_endpoint',
    type: 'varchar',
    length: 25,
  })
  endpoint: string;

  // FK 설정은 아래에서...
  // 당장 생각나는건 Functions, Owner 정도
  @Index('idx_owner')
  @ManyToOne(() => UserEntity, (user) => user.myApplications)
  owner: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  applyFromCreateApplicationDto(dto: CreateApplicationDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.icon = dto.icon;
    this.endpoint = dto.endpoint;
  }

  get metadata(): IApplicationEntity {
    console.log(this);
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      endpoint: this.endpoint,
      owner: this.owner?.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
