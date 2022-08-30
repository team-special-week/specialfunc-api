import { UserEntity } from 'src/components/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { ITypeORMEntityHelper } from '../../../common/interfaces/ITypeORMEntityHelper';
import { IApplicationEntity } from '../interfaces/IAppliationEntity';
import { FunctionEntity } from 'src/components/function/entities/function.entity';

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

  @Column({
    unique: true,
    name: 'app_endpoint',
    type: 'varchar',
    length: 25,
  })
  endpoint: string;

  @OneToMany(() => FunctionEntity, (func) => func.application, {
    cascade: true,
  })
  functions: FunctionEntity[];

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
