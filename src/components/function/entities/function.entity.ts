import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ITypeORMEntityHelper } from '../../../common/interfaces/ITypeORMEntityHelper';
import { EHttpMethod } from '../../../common/enums/EHttpMethod';
import { ApplicationEntity } from 'src/components/application/entities/application.entity';
import { UserEntity } from '../../user/entities/user.entity';
import IFunction from '../interfaces/IFunction';
import { CreateFunctionDto } from '../dto/create-function.dto';

@Entity('spf_functions')
export class FunctionEntity implements ITypeORMEntityHelper {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column({
    name: 'func_uuid',
    type: 'char',
    length: 32,
  })
  uuid: string;

  @Column({
    name: 'func_name',
    type: 'varchar',
    length: 75,
  })
  name: string;

  @Column({
    name: 'func_endpoint',
    type: 'varchar',
    length: 100,
  })
  endpoint: string;

  @Column({
    name: 'func_http_method',
    type: 'enum',
    enum: EHttpMethod,
  })
  httpMethod: EHttpMethod;

  @ManyToOne(() => ApplicationEntity, (app) => app.functions)
  application: ApplicationEntity;

  @ManyToOne(() => UserEntity, (user) => user.myFunctions)
  owner: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  applyFromCreateFunctionDto(dto: CreateFunctionDto) {
    this.name = dto.name;
    this.endpoint = dto.endpoint;
    this.httpMethod = dto.httpMethod;
  }

  get metadata(): IFunction {
    return {
      _id: this._id,
      name: this.name,
      endpoint: this.endpoint,
      httpMethod: this.httpMethod,
      application: this.application?.metadata,
      owner: this.owner?.metadata,
    };
  }
}
