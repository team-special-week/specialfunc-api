import { Request, Response } from 'express';
import * as mysql from 'mysql2/promise';

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

export default function containerRunner(req: any, res: Response, next) {
  new Promise<number>(async (resolve, reject) => {
    const endpoint = await findEndpoint(req);

    console.log('찾았다제');
    console.log(endpoint);
    console.log('url:', req.originalUrl);
    console.log('method:', req.method);
    resolve(12345);
  }).then((port: number) => {
    req.port = port;
    next();
  });
}
