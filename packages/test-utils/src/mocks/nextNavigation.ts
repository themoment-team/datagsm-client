import { vi } from 'vitest';

/**
 * `next/navigation` 대체 구현. 각 패키지의 setup에서
 * `vi.mock('next/navigation', () => nextNavigationMock)`로 등록한다.
 *
 * 라우터 함수는 호출만 기록하고 URL 상태는 바꾸지 않는다.
 * 이동 결과는 `mockRouter.push`의 호출 인자로 검사한다.
 */

const state = {
  pathname: '/',
  searchParams: new URLSearchParams(),
  params: {} as Record<string, string | string[]>,
};

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export const nextNavigationMock = {
  useRouter: () => mockRouter,
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(state.searchParams),
  useParams: () => state.params,
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
};

export const setMockPathname = (pathname: string) => {
  state.pathname = pathname;
};

export const setMockSearchParams = (init: string | Record<string, string> | URLSearchParams) => {
  state.searchParams = new URLSearchParams(init);
};

export const setMockParams = (params: Record<string, string | string[]>) => {
  state.params = params;
};

export const resetNextNavigationMock = () => {
  state.pathname = '/';
  state.searchParams = new URLSearchParams();
  state.params = {};
  Object.values(mockRouter).forEach((fn) => fn.mockClear());
  nextNavigationMock.redirect.mockClear();
  nextNavigationMock.notFound.mockClear();
};
