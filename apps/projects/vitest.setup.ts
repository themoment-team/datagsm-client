import { vi } from 'vitest';

vi.mock('next/navigation', async () => {
  const { nextNavigationMock } = await import('@repo/test-utils/next-navigation');
  return nextNavigationMock;
});
