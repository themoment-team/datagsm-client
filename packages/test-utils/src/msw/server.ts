import { setupServer } from 'msw/node';

/**
 * 기본 핸들러 없이 시작한다. 테스트마다 필요한 응답을 `server.use()`로 등록하고,
 * 등록하지 않은 요청은 setup의 `onUnhandledRequest: 'error'`로 실패시킨다.
 */
export const server = setupServer();
