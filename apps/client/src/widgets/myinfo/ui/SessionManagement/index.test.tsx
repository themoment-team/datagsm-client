import type { IdpSession } from '@repo/shared/types';
import { apiSuccess, http, renderWithProviders, screen, server } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import { SessionManagement } from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const createIdpSession = (overrides: Partial<IdpSession> = {}): IdpSession => ({
  sessionId: 'session-1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
  createdAt: null,
  current: false,
  ...overrides,
});

/** oauthAxiosInstance의 baseURL은 모듈을 불러올 때 정해지므로 호스트와 무관하게 매칭한다. */
const mockSessions = (resolver: () => Response) => {
  server.use(http.get('*/v1/oauth/idp-sessions', resolver));
};

const openConfirmDialog = async (user: User) => {
  await user.click(await screen.findByRole('button', { name: '종료' }));
  return screen.findByRole('alertdialog', { name: '세션을 종료하시겠습니까?' });
};

describe('SessionManagement', () => {
  describe('종료 확인 창', () => {
    // 종료는 IdP 세션만 지우고 그 기기가 이미 받은 토큰은 남긴다(#253).
    it('다른 기기의 세션이면 새 서비스 로그인에만 비밀번호가 필요하고 이미 로그인된 서비스는 유지될 수 있다고 안내한다', async () => {
      mockSessions(() => apiSuccess({ sessions: [createIdpSession({ current: false })] }));
      const { user } = renderWithProviders(<SessionManagement />);

      const dialog = await openConfirmDialog(user);

      expect(dialog).toHaveAccessibleDescription(
        '해당 기기는 새 서비스에 로그인할 때 비밀번호를 다시 입력해야 합니다. 이미 로그인된 서비스는 로그인 상태가 유지될 수 있습니다.',
      );
    });

    it('현재 세션이면 이 서비스에서만 로그아웃되고 이미 로그인된 다른 서비스는 유지될 수 있다고 안내한다', async () => {
      mockSessions(() => apiSuccess({ sessions: [createIdpSession({ current: true })] }));
      const { user } = renderWithProviders(<SessionManagement />);

      const dialog = await openConfirmDialog(user);

      expect(dialog).toHaveAccessibleDescription(
        '현재 사용 중인 세션입니다. 종료하면 이 서비스에서 로그아웃되고, 새 서비스에 로그인할 때 비밀번호를 다시 입력해야 합니다. 이미 로그인된 다른 서비스는 로그인 상태가 유지될 수 있습니다.',
      );
    });
  });
});
