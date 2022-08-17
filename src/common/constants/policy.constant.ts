import * as path from 'path';

// 애플리케이션/함수 관련 정책
export const MAX_APPLICATION_COUNT = 50;
export const MAX_FUNCTION_COUNT = 200;

// 함수 프로젝트를 CRUD 할 때 내부적으로 사용하는 폴더
export const PROJECT_DIRECTORY = path.join(__dirname, '../../../', 'projects');
export const WORK_DIRECTORY = path.join(__dirname, '../../../', 'workspace');
export const TEMPLATE_DIRECTORY = path.join(__dirname, '../../../', 'template');

export const LIFECYCLE_INTERVAL = 1000 * 10;
