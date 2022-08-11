import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FunctionService } from '../function/function.service';
import * as fs from 'fs';
import { PROJECT_DIRECTORY } from 'src/common/constants/policy.constant';
import * as path from 'path';

@Injectable()
export class RunnerService {
  constructor(
    @Inject(forwardRef(() => FunctionService))
    private readonly functionService: FunctionService,
  ) {}

  async generateFunctionProject(uuid: string) {
    return new Promise<void>(async (resolve, reject) => {
      const folderPath = path.join(PROJECT_DIRECTORY, uuid);

      try {
        if (!fs.existsSync(folderPath)) {
          // 폴더 생성
          fs.mkdirSync(folderPath, { recursive: true });

          // package.json 파일 생성
          {
            const data = {
              name: uuid,
              version: '1.0.0',
              description: '',
              main: 'index.js',
              scripts: {},
              keywords: [],
              author: '',
              license: 'ISC',
            };
            fs.writeFileSync(
              path.join(folderPath, 'package.json'),
              JSON.stringify(data),
            );
          }

          // main.js 파일 생성
          {
            const data =
              'exports.main = async function(req) {' +
              'return "Hello world!"' +
              '}';
            fs.writeFileSync(path.join(folderPath, 'main.js'), data);
          }

          resolve();
        } else {
          reject();
        }
      } catch (ex) {
        console.error(ex);
        reject();
      }
    });
  }

  async buildFunctionProject(uuid: string) {

  }
}
