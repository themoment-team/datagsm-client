import type { ApiKey, ApiKeyListData } from '@repo/shared/types';

import { nextId } from './sequence';

export const createApiKey = (overrides: Partial<ApiKey> = {}): ApiKey => {
  const id = overrides.id ?? nextId();

  return {
    id,
    apiKey: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    expiresAt: '2026-12-31T23:59:59',
    expiresInDays: 30,
    // 실제 scope 이름은 서버가 정한다. 의미가 있는 테스트에서는 덮어쓴다.
    scopes: ['example:read'],
    description: `API 키${id}`,
    ...overrides,
  };
};

export const createApiKeyListData = (
  apiKeys: ApiKey[] = [createApiKey()],
  overrides: Partial<ApiKeyListData> = {},
): ApiKeyListData => ({
  totalPages: 1,
  totalElements: apiKeys.length,
  apiKeys,
  ...overrides,
});
