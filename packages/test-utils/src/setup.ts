import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { resetNextNavigationMock } from './mocks/nextNavigation';
import { server } from './msw/server';

// 핸들러를 등록하지 않은 요청이 실제 네트워크로 나가지 않고 바로 실패하도록 한다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// globals를 끈 설정이라 Testing Library가 자동 정리를 등록하지 못하므로 직접 등록한다.
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetNextNavigationMock();
});

afterAll(() => server.close());
