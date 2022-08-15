import * as fs from 'fs';
import * as path from 'path';
import * as ncp from 'ncp';
import {
  PROJECT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  WORK_DIRECTORY,
} from '../common/constants/policy.constant';
import * as child_process from 'child_process';

export async function createWorkspace(uuid: string) {
  const workspacePath = path.join(WORK_DIRECTORY, uuid);

  if (fs.existsSync(workspacePath)) {
    await removeWorkspace(uuid);
  }

  fs.mkdirSync(workspacePath, { recursive: true });
}

export async function removeWorkspace(uuid: string) {
  const workspacePath = path.join(WORK_DIRECTORY, uuid);

  return promisify(() => {
    fs.rmSync(workspacePath, { recursive: true, force: true });
  });
}

export async function copyFunctionProject(uuid: string) {
  const workspacePath = path.join(WORK_DIRECTORY, uuid);
  const projectPath = path.join(PROJECT_DIRECTORY, uuid);

  return Promise.all([
    // Function Project 복사
    copy(projectPath, path.join(workspacePath, 'function')),

    // runner-host 프로젝트 복사
    copy(
      path.join(TEMPLATE_DIRECTORY, 'runner-host'),
      path.join(workspacePath, 'runner-host'),
    ),

    // Dockerfile 생성
    promisify(() => {
      fs.copyFileSync(
        path.join(TEMPLATE_DIRECTORY, 'Dockerfile'),
        path.join(workspacePath, 'Dockerfile'),
      );
    }),
  ]);
}

export async function buildFunctionProject(uuid: string) {
  const workspacePath = path.join(WORK_DIRECTORY, uuid);

  return exec(
    `cd ${workspacePath} && docker build --no-cache -t ${uuid}:latest .`,
  );
}

function copy(src: string, dest: string): Promise<void> {
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

export function promisify(func: () => void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      func();
      resolve();
    } catch (ex) {
      reject(ex);
    }
  });
}

export function exec(command: string): Promise<string> {
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
