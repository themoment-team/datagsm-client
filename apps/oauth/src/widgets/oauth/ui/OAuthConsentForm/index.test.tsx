import {
  HttpResponse,
  act,
  apiError,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  server,
  setMockSearchParams,
  waitFor,
} from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OAuthConsentForm from '.';

const TOKEN = 'session-token';
const OAUTH_BASE_URL = 'https://oauth.test';
const CONSENT_URL = `${OAUTH_BASE_URL}/v1/oauth/authorize/consent`;

const createSession = (overrides: { expiresAt?: number } = {}) => ({
  serviceName: '급식 알리미',
  expiresAt: overrides.expiresAt ?? Date.now() + 10 * 60 * 1000,
  requestedScopes: [
    { scope: 'datagsm:self_read', description: '내 학생 정보 조회', applicationName: 'DataGSM' },
  ],
});

const mockSession = (session = createSession()) => {
  server.use(http.get(`*/v1/oauth/sessions/${TOKEN}`, () => apiSuccess(session)));
};

/** 동의 요청 응답을 정하고, 받은 요청의 본문과 credentials 설정을 모은다. */
const mockConsent = (respond: () => Response) => {
  const requests: { body: unknown; credentials: RequestCredentials }[] = [];
  server.use(
    http.post(CONSENT_URL, async ({ request }) => {
      requests.push({ body: await request.json(), credentials: request.credentials });
      return respond();
    }),
  );
  return requests;
};

/** 세션 정보를 다 불러와 승인·거부를 누를 수 있을 때까지 기다린다. */
const renderLoaded = async () => {
  const rendered = renderWithProviders(<OAuthConsentForm />);
  await screen.findByText('내 학생 정보 조회');
  return rendered;
};

describe('OAuthConsentForm', () => {
  beforeEach(() => {
    localStorage.clear();
    setMockSearchParams({ token: TOKEN });
  });

  afterEach(() => {
    vi.useRealTimers();
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
      expect(
        screen.getByText('잘못되었거나 만료된 접근입니다.', { exact: false }),
      ).toBeInTheDocument();
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
      expect(
        screen.getByText('잘못되었거나 만료된 접근입니다.', { exact: false }),
      ).toBeInTheDocument();
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

  describe('승인·거부', () => {
    beforeEach(() => {
      // 동의 요청은 BFF를 거치지 않고 백엔드로 바로 나가며, 주소는 요청할 때 읽는다.
      vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
      // 처리가 끝나면 외부 서비스 주소로 이동하므로 이동 주소만 기록한다.
      vi.stubGlobal('location', { href: 'http://localhost:3004/oauth/consent' });
    });

    it.each([
      ['승인', true, 'https://app.test/callback?code=abc'],
      ['거부', false, 'https://app.test/callback?error=access_denied'],
    ])(
      '%s하면 세션 쿠키와 함께 선택을 보내고 받은 주소로 이동한다',
      async (name, approved, redirectUrl) => {
        mockSession();
        const requests = mockConsent(() => HttpResponse.json({ redirectUrl }));
        const { user } = await renderLoaded();

        await user.click(screen.getByRole('button', { name }));

        await waitFor(() => expect(window.location.href).toBe(redirectUrl));
        expect(requests).toEqual([{ body: { token: TOKEN, approved }, credentials: 'include' }]);
      },
    );

    it.each([
      [400, '인증 요청이 만료되었습니다. 서비스에서 다시 로그인을 시도해주세요.'],
      [401, '인증 세션이 만료되었습니다. 서비스에서 다시 로그인을 시도해주세요.'],
    ])(
      '%s 응답이면 다시 눌러도 같은 오류만 나므로 만료 안내를 띄우고 승인·거부를 막는다',
      async (status, message) => {
        mockSession();
        mockConsent(() => HttpResponse.json({}, { status }));
        const { user } = await renderLoaded();

        await user.click(screen.getByRole('button', { name: '승인' }));

        expect(await screen.findByRole('alertdialog')).toHaveTextContent('인증 세션 만료');
        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '승인' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '거부' })).not.toBeInTheDocument();
      },
    );

    it('그 외 오류면 안내만 하고 다시 시도할 수 있게 둔다', async () => {
      mockSession();
      mockConsent(() => HttpResponse.json({}, { status: 500 }));
      const { user } = await renderLoaded();

      await user.click(screen.getByRole('button', { name: '승인' }));

      expect(
        await screen.findByText('요청을 처리하지 못했습니다. 다시 시도해주세요.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '승인' })).toBeEnabled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('만료 30초 전이 되면 누르기 전에 만료 안내를 띄우고 승인·거부를 막는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSession(createSession({ expiresAt: Date.now() + 90 * 1000 }));
    await renderLoaded();

    act(() => vi.advanceTimersByTime(59 * 1000));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '승인' })).toBeEnabled();

    act(() => vi.advanceTimersByTime(1000));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('인증 세션 만료');
    expect(screen.queryByRole('button', { name: '승인' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '거부' })).not.toBeInTheDocument();
  });
});
