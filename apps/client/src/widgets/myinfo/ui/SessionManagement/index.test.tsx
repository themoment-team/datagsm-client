import type { IdpSession } from '@repo/shared/types';
import {
  HttpResponse,
  apiError,
  apiPath,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { SessionManagement } from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const createIdpSession = (overrides: Partial<IdpSession> = {}): IdpSession => ({
  sessionId: 'session-1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
  // 서버는 epoch milliseconds로 준다. 시간대에 따라 표시가 바뀌지 않도록 로컬 시각으로 만든다.
  createdAt: new Date(2026, 2, 2, 9, 0).getTime(),
  current: false,
  ...overrides,
});

/** oauthAxiosInstance의 baseURL은 모듈을 불러올 때 정해지므로 호스트와 무관하게 매칭한다. */
const mockSessions = (resolver: () => Response) => {
  server.use(http.get('*/v1/oauth/idp-sessions', resolver));
};

const mockDeleteSession = (resolver: () => Response) => {
  server.use(http.delete('*/v1/oauth/idp-sessions/:sessionId', resolver));
};

const openConfirmDialog = async (user: User) => {
  await user.click(await screen.findByRole('button', { name: '종료' }));
  return screen.findByRole('alertdialog', { name: '세션을 종료하시겠습니까?' });
};

describe('SessionManagement', () => {
  describe('목록 조회', () => {
    it('같은 날 만든 세션도 구분되도록 생성 시각을 시각까지 보여 준다', async () => {
      mockSessions(() =>
        apiSuccess({
          sessions: [
            createIdpSession({
              sessionId: 'session-1',
              createdAt: new Date(2026, 2, 2, 14, 5).getTime(),
            }),
            createIdpSession({
              sessionId: 'session-2',
              createdAt: new Date(2026, 2, 2, 9, 30).getTime(),
            }),
          ],
        }),
      );
      renderWithProviders(<SessionManagement />);

      expect(await screen.findByText('2026년 3월 2일 오후 2:05')).toBeInTheDocument();
      expect(screen.getByText('2026년 3월 2일 오전 9:30')).toBeInTheDocument();
    });

    // IdP 세션이 만료돼도 이 서비스는 refresh token으로 로그인이 유지되므로, 401은 오류가 아니다(#253).
    it('401이면 오류 대신 이 브라우저에 SSO 세션이 없다고 안내하고 다시 보는 방법을 알려 준다', async () => {
      mockSessions(() => apiError(401, '로그인이 필요합니다.'));
      renderWithProviders(<SessionManagement />);

      expect(
        await screen.findByText('이 브라우저에 SSO 세션이 없어 세션 목록을 볼 수 없습니다.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('로그아웃한 뒤 다시 로그인하면 확인할 수 있습니다.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('세션 목록을 불러오지 못했습니다.')).not.toBeInTheDocument();
    });

    it('401이 아닌 오류면 목록을 불러오지 못했다고 알린다', async () => {
      mockSessions(() => apiError(500, '서버 오류가 발생했습니다.'));
      renderWithProviders(<SessionManagement />);

      expect(await screen.findByText('세션 목록을 불러오지 못했습니다.')).toBeInTheDocument();
      expect(
        screen.queryByText('이 브라우저에 SSO 세션이 없어 세션 목록을 볼 수 없습니다.'),
      ).not.toBeInTheDocument();
    });
  });

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

  describe('세션 종료', () => {
    it('현재 세션을 종료하면 서버 라우트로 토큰 쿠키를 지우고 /로 보낸다', async () => {
      vi.stubGlobal('location', { href: 'http://localhost:3000/mypage' });
      mockSessions(() => apiSuccess({ sessions: [createIdpSession({ current: true })] }));
      mockDeleteSession(() => apiSuccess(null));
      const localLogout = vi.fn();
      server.use(
        http.post(apiPath('/logout'), () => {
          localLogout();
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const { user } = renderWithProviders(<SessionManagement />);
      const dialog = await openConfirmDialog(user);

      await user.click(within(dialog).getByRole('button', { name: '종료' }));

      await waitFor(() => expect(window.location.href).toBe('/'));
      expect(localLogout).toHaveBeenCalledTimes(1);
    });

    it('현재 세션을 종료했지만 토큰 쿠키를 지우지 못하면 이동하지 않고 실패를 알린다', async () => {
      vi.stubGlobal('location', { href: 'http://localhost:3000/mypage' });
      mockSessions(() => apiSuccess({ sessions: [createIdpSession({ current: true })] }));
      mockDeleteSession(() => apiSuccess(null));
      server.use(http.post(apiPath('/logout'), () => HttpResponse.error()));
      const { user } = renderWithProviders(<SessionManagement />);
      const dialog = await openConfirmDialog(user);

      await user.click(within(dialog).getByRole('button', { name: '종료' }));

      expect(
        await screen.findByText('로그아웃에 실패했습니다. 다시 시도해 주세요.'),
      ).toBeInTheDocument();
      expect(window.location.href).toBe('http://localhost:3000/mypage');
    });

    it('목록을 연 뒤 SSO 세션이 사라져 종료가 401이면 그 이유를 알리고 목록을 안내로 바꾼다', async () => {
      let hasSsoSession = true;
      mockSessions(() =>
        hasSsoSession
          ? apiSuccess({ sessions: [createIdpSession()] })
          : apiError(401, '로그인이 필요합니다.'),
      );
      mockDeleteSession(() => apiError(401, '로그인이 필요합니다.'));
      const { user } = renderWithProviders(<SessionManagement />);
      const dialog = await openConfirmDialog(user);

      hasSsoSession = false;
      await user.click(within(dialog).getByRole('button', { name: '종료' }));

      expect(
        await screen.findByText('이 브라우저에 SSO 세션이 없어 세션을 종료할 수 없습니다.'),
      ).toBeInTheDocument();
      expect(
        await screen.findByText('이 브라우저에 SSO 세션이 없어 세션 목록을 볼 수 없습니다.'),
      ).toBeInTheDocument();
    });
  });
});
