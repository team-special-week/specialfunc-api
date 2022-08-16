import { Request, Response } from 'express';
import * as mysql from 'mysql2/promise';
import { EBuildStatus } from 'src/common/enums/EBuildStatus';

const getDBConnection = async () => {
  return mysql.createConnection({
    host: process.env.MYSQL_DATABASE_HOST,
    user: process.env.MYSQL_DATABASE_USER,
    password: process.env.MYSQL_DATABASE_PASS,
    database: process.env.MYSQL_DATABASE_NAME,
  });
};

const isEndpointMatch = (reqEndpoint: string, dbEndpoint: string) => {
  // endpoint 마지막에 '/' 가 들어가지 않도록 조치
  if (reqEndpoint[reqEndpoint.length - 1] === '/') {
    reqEndpoint = reqEndpoint.slice(0, -1);
  }

  const dbEndpointBlock = dbEndpoint.split('/');
  const reqEndpointBlock = reqEndpoint.split('/');

  if (dbEndpointBlock.length !== reqEndpointBlock.length) {
    // 블럭 길이기 맞지 않으면 같지 않음
    return false;
  }

  for (let i = 0; i < dbEndpointBlock.length; ++i) {
    const dbeb = dbEndpointBlock[i];
    const rqeb = reqEndpointBlock[i];

    if (dbeb !== '*' && dbeb !== rqeb) {
      return false;
    }
  }

  return true;
};

const findEndpoint = async (req: Request) => {
  const conn = await getDBConnection();
  const url = req.originalUrl.replace('/api', '');
  const method = req.method.toUpperCase();

  const [results] = await conn.query(
    `SELECT * FROM spf_functions WHERE func_http_method = ?`,
    [method],
  );

  for (const result of results as any[]) {
    if (isEndpointMatch(url, result.func_endpoint)) {
      return result;
    }
  }
  return null;
};

const findLastReleaseHistory = async (_id: number) => {
  const conn = await getDBConnection();
  const [results] = await conn.query(
    `SELECT * FROM spf_function_releases WHERE func_id = ? ORDER BY _id DESC LIMIT 1`,
    [_id],
  );

  if ((results as any[]).length === 1) {
    return results[0];
  } else {
    return null;
  }
};

export default function containerRunner(req: any, res: Response, next) {
  new Promise<number>(async (resolve, reject) => {
    const endpoint = await findEndpoint(req);

    // endpoint 가 있는지 확인
    if (!endpoint) {
      reject();
    }

    // 해당 endpoint 에 대해 최신 릴리즈 확인
    const lastRelease = await findLastReleaseHistory(endpoint._id);
    if (lastRelease) {
      switch (lastRelease.func_build_status) {
        case EBuildStatus.WARM_START:
          // 최신 릴리즈가 있고, WARM_START 의 경우
          resolve(lastRelease.func_port);
          break;
        case EBuildStatus.COLD_START:
          // 최신 릴리즈가 있고, COLD_START 의 경우
          // TODO 컨테이너 실행 후 포트 읽어서 반환
          break;
        default:
          reject();
      }
    } else {
      // 함수가 배포된 기록이 없는 경우
      reject();
    }
  }).then((port: number) => {
    req.port = port;
    next();
  });
}
