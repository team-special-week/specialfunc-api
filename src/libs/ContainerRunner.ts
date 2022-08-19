import { Request } from 'express';
import * as mysql from 'mysql2/promise';
import { EBuildStatus } from 'src/common/enums/EBuildStatus';
import { RunnerService } from '../components/runner/runner.service';
import { LifecycleService } from '../components/function/apps/lifecycle.service';
import { ELifecyclePositive } from '../common/enums/ELifecycle';

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

  let url = req.originalUrl.replace('/api', '');
  const appEndpoint = url.split('/')[1];
  url = url.replace(`/${appEndpoint}`, '');

  // 애플리케이션 찾기
  const [appResults] = await conn.query(
    `SELECT spf_functions.* FROM spf_applications LEFT JOIN spf_functions ON spf_applications._id = spf_functions.application_id WHERE app_endpoint = ?;`,
    [appEndpoint],
  );

  for (const result of appResults as any[]) {
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

export default function containerRunner(
  runnerService: RunnerService,
  lifecycleService: LifecycleService,
) {
  const throwNotFound = (res) => {
    res.sendStatus(404);
  };

  const throwInternalError = (res) => {
    res.sendStatus(500);
  };

  return async (req, res, next) => {
    const endpoint = await findEndpoint(req);

    // endpoint 가 있는지 확인
    if (!endpoint) {
      throwNotFound(res);
      return;
    }

    // 해당 endpoint 에 대해 최신 릴리즈 확인
    const lastRelease = await findLastReleaseHistory(endpoint._id);
    const funcUUID = endpoint.func_uuid;

    if (lastRelease) {
      switch (lastRelease.func_build_status) {
        case EBuildStatus.WARM_START:
          // LIFE TIME 을 증가시킨다.
          await lifecycleService.increaseLifetime(
            ELifecyclePositive.FUNCTION_WARM_TO_WARM,
            funcUUID,
          );
          req.port = lastRelease.func_port;
          console.log('req.port WARM', req.port);
          next();
          break;
        case EBuildStatus.COLD_START:
          // 함수를 WARM_START 형태로 바꾸고 접근 포트 얻기
          const port = await runnerService.warm(endpoint.func_uuid);
          if (port) {
            // LIFE TIME 증가
            await lifecycleService.increaseLifetime(
              ELifecyclePositive.FUNCTION_COLD_TO_WARM,
              funcUUID,
            );
            req.port = port;
            next();
          } else {
            throwInternalError(res);
            return;
          }
          break;
        default:
          throwNotFound(res);
          return;
      }
    } else {
      // 함수가 배포된 기록이 없는 경우
      throwNotFound(res);
      return;
    }
  };
}
