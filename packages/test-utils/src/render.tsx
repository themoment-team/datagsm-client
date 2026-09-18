import type { PropsWithChildren, ReactElement } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  type RenderHookOptions,
  type RenderOptions,
  render,
  renderHook,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'sonner';

/** 테스트마다 새로 만든다. 공유하면 캐시가 테스트 사이에 섞인다. */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      // 실패 케이스가 재시도로 느려지지 않도록 끈다.
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface ProviderOptions {
  /** 캐시를 미리 채우거나 무효화를 검사할 때 넘긴다. */
  queryClient?: QueryClient;
}

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );

  return Wrapper;
};

/** React Query와 토스트가 필요한 컴포넌트를 렌더링하고, 사용자 입력용 `user`를 함께 돌려준다. */
export const renderWithProviders = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...options
  }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) => ({
  user: userEvent.setup(),
  queryClient,
  ...render(ui, { wrapper: createWrapper(queryClient), ...options }),
});

/** React Query를 쓰는 훅을 렌더링한다. */
export const renderHookWithProviders = <Result, Props>(
  hook: (props: Props) => Result,
  {
    queryClient = createTestQueryClient(),
    ...options
  }: ProviderOptions & Omit<RenderHookOptions<Props>, 'wrapper'> = {},
) => ({
  queryClient,
  ...renderHook(hook, { wrapper: createWrapper(queryClient), ...options }),
});
