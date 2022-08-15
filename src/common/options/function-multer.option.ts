import { NotZipFileException } from '../../components/function/exceptions/function.exceptions';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const functionMulterDiskOptions = {
  fileFilter: (request, file, callback) => {
    if (file.mimetype.match(/\/(zip)$/)) {
      callback(null, true);
    } else {
      throw new NotZipFileException();
    }
  },
  storage: diskStorage({
    destination: (request, file, callback) => {
      // Function 은 임시 폴더에 만들고, 압축을 풀면 삭제한다.
      const uploadPath = path.join(__dirname, '../../../', 'tmp');
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }

      callback(null, uploadPath);
    },
    filename: (request, file, callback) => {
      callback(null, uuidv4());
    },
  }),
  limits: {
    filedSize: 1024 * 1024 * 50,
    files: 1,
  },
};
