import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FunctionService } from '../function/function.service';
import * as fs from 'fs';
import * as ncp from 'ncp';
import {
  PROJECT_DIRECTORY,
  WORK_DIRECTORY,
} from 'src/common/constants/policy.constant';
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
    return new Promise<void>(async (resolve, reject) => {
      const workDirPath = path.join(WORK_DIRECTORY, uuid);
      const folderPath = path.join(PROJECT_DIRECTORY, uuid);

      try {
        if (!fs.existsSync(workDirPath)) {
          // 폴더 생성
          fs.mkdirSync(workDirPath, { recursive: true });
        }

        {
          // Function 카피
          const copyFuncAsync = new Promise((resolve, reject) => {
            ncp(
              folderPath,
              path.join(workDirPath, 'function'),
              { clobber: true },
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(true);
                }
              },
            );
          });

          // runner-host 카피
          const copyRunnerHostAsync = new Promise((resolve, reject) => {
            ncp(
              path.join(PROJECT_DIRECTORY, 'runner-host'),
              path.join(workDirPath, 'runner-host'),
              { clobber: true },
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(true);
                }
              },
            );
          });

          await copyFuncAsync;
          await copyRunnerHostAsync;
        }

        // Dockerfile 생성
        {
          const data = 'FROM ubuntu:latest \n' + 'MAINTAINER <5252bb@daum.net>';

          fs.writeFileSync(path.join(workDirPath, 'Dockerfile'), data);
        }

        resolve();
      } catch (ex) {
        console.error(ex);
        reject();
      }
    });
  }
}
