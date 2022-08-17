import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadFileEntity } from './entities/upload-file.entity';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { UserService } from '../user/user.service';
import IUploadFileEntity from './interfaces/IUploadFileEntity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(UploadFileEntity)
    private readonly uploadFileRepository: Repository<UploadFileEntity>,
    private readonly userService: UserService,
  ) {}

  async uploadFile(
    owner: IUserEntity,
    file: Express.Multer.File,
  ): Promise<IUploadFileEntity> {
    const userEntity = await this.userService.findUserByIUserEntity(owner);

    let uploadResult: IUploadFileEntity;
    {
      const fileEntity = new UploadFileEntity();
      fileEntity.uuid = file.filename;
      fileEntity.size = file.size;
      fileEntity.mimeType = file.mimetype;
      fileEntity.registrant = userEntity;
      fileEntity.originalName = file.originalname;

      uploadResult = (await this.uploadFileRepository.save(fileEntity))
        .metadata;
    }

    return uploadResult;
  }

  async findUploadFile(uuid: string): Promise<IUploadFileEntity | null> {
    const uploadFile = await this.uploadFileRepository.findOne({
      where: {
        uuid,
      },
    });

    if (uploadFile) {
      return uploadFile.metadata;
    } else {
      return null;
    }
  }
}
