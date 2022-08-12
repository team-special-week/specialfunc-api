import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FunctionService } from '../function/function.service';
import * as fs from 'fs';
import * as ncp from 'ncp';
import * as child_process from 'child_process';
import {
  PROJECT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  WORK_DIRECTORY,
} from 'src/common/constants/policy.constant';
import * as path from 'path';

@Injectable()
export class RunnerService {
  constructor(
    @Inject(forwardRef(() => FunctionService))
    private readonly functionService: FunctionService,
  ) {}

  async buildFunctionProject(uuid: string) {
    return new Promise<void>(async (resolve, reject) => {
      const workDirPath = path.join(WORK_DIRECTORY, uuid);
      const projectDirectory = path.join(PROJECT_DIRECTORY, uuid);

      try {
        if (!fs.existsSync(workDirPath)) {
          // Work directory 생성
          fs.mkdirSync(workDirPath, { recursive: true });
        }

        {
          await Promise.all([
            // Function Project 복사
            this.copy(projectDirectory, path.join(workDirPath, 'function')),

            // runner-host 프로젝트 복사
            this.copy(
              path.join(TEMPLATE_DIRECTORY, 'runner-host'),
              path.join(workDirPath, 'runner-host'),
            ),

            // Dockerfile 생성
            this.promisify(() => {
              fs.copyFileSync(
                path.join(TEMPLATE_DIRECTORY, 'Dockerfile'),
                path.join(workDirPath, 'Dockerfile'),
              );
            }),
          ]);

          // docker build 실행
          await this.exec(
            `cd ${workDirPath} && docker build --no-cache -t ${uuid}:latest .`,
          );
        }

        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private promisify(func: () => void): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await func();
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private copy(src: string, dest: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ncp(src, dest, { clobber: true }, (err) => {
        if (err) {
          reject();
        } else {
          resolve();
        }
      });
    });
  }

  private exec(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      child_process.exec(command, (err, stdout, stderr) => {
        if (err) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}
