import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('spf_applications')
export class ApplicationEntity {
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
