import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { resetNextNavigationMock } from './mocks/nextNavigation';

// globals를 끈 설정이라 Testing Library가 자동 정리를 등록하지 못하므로 직접 등록한다.
afterEach(() => {
  cleanup();
  resetNextNavigationMock();
});
