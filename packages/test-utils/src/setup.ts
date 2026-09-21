import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { resetFixtureIds } from './fixtures';
import { resetNextNavigationMock } from './mocks/nextNavigation';
import { server } from './msw/server';

// 느린 환경에서 로딩이 끝나기 전에 조회가 끊기지 않도록 findBy*·waitFor의 기본 대기 시간을 늘린다.
configure({ asyncUtilTimeout: 3_000 });

// 핸들러를 등록하지 않은 요청이 실제 네트워크로 나가지 않고 바로 실패하도록 한다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// globals를 끈 설정이라 Testing Library가 자동 정리를 등록하지 못하므로 직접 등록한다.
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetNextNavigationMock();
  resetFixtureIds();
});

afterAll(() => server.close());
