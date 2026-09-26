import {
  apiError,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  server,
  setMockSearchParams,
} from '@repo/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import OAuthConsentForm from '.';

const TOKEN = 'session-token';

const createSession = () => ({
  serviceName: '급식 알리미',
  expiresAt: Date.now() + 10 * 60 * 1000,
  requestedScopes: [
    { scope: 'datagsm:self_read', description: '내 학생 정보 조회', applicationName: 'DataGSM' },
  ],
});

const mockSession = (session = createSession()) => {
  server.use(http.get(`*/v1/oauth/sessions/${TOKEN}`, () => apiSuccess(session)));
};

describe('OAuthConsentForm', () => {
  beforeEach(() => {
    setMockSearchParams({ token: TOKEN });
  });

  it('세션 정보를 정상적으로 받아오면 동의 화면을 보여준다', async () => {
    mockSession();
    renderWithProviders(<OAuthConsentForm />);

    expect(await screen.findByText('접근 권한 동의')).toBeInTheDocument();
    expect(await screen.findByText('내 학생 정보 조회')).toBeInTheDocument();
  });

  describe('세션 시작 실패', () => {
    it('URL에 토큰이 없으면 동의 화면 대신 잘못된 접근 안내만 보여주고, 문서·상태 링크는 없다', async () => {
      setMockSearchParams({});
      renderWithProviders(<OAuthConsentForm />);

      expect(await screen.findByText('오류')).toBeInTheDocument();
      expect(screen.getByText('잘못되었거나 만료된 접근입니다.', { exact: false })).toBeInTheDocument();
      expect(screen.queryByText('접근 권한 동의')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '기술문서' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '서버 상태 확인' })).not.toBeInTheDocument();
    });

    it('세션 조회가 401이면 잘못된 접근 안내만 보여주고, 문서·상태 링크는 없다', async () => {
      server.use(
        http.get(`*/v1/oauth/sessions/${TOKEN}`, () => apiError(401, '유효하지 않은 토큰')),
      );
      renderWithProviders(<OAuthConsentForm />);

      expect(await screen.findByText('오류')).toBeInTheDocument();
      expect(screen.getByText('잘못되었거나 만료된 접근입니다.', { exact: false })).toBeInTheDocument();
      expect(screen.queryByText('접근 권한 동의')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '기술문서' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '서버 상태 확인' })).not.toBeInTheDocument();
    });

    it('세션 조회가 401이 아닌 오류(서버 장애 등)면 기술문서·서버 상태 링크를 보여준다', async () => {
      server.use(http.get(`*/v1/oauth/sessions/${TOKEN}`, () => apiError(500, '서버 오류')));
      renderWithProviders(<OAuthConsentForm />);

      expect(await screen.findByText('오류')).toBeInTheDocument();
      expect(screen.queryByText('접근 권한 동의')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: '기술문서' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '서버 상태 확인' })).toBeInTheDocument();
    });
  });
});
