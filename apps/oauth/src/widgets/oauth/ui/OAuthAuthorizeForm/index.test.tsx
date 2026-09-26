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
  userEvent,
  waitFor,
} from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OAuthAuthorizeForm from '.';

const TOKEN = 'session-token';
const SESSION_KEY = 'oauth_session_timestamp';
const AUTHORIZE_URL = 'http://localhost:3000/api/oauth/authorize';

type User = ReturnType<typeof userEvent.setup>;

const createSession = (overrides: { expiresAt?: number; serviceName?: string } = {}) => ({
  serviceName: overrides.serviceName ?? '급식 알리미',
  expiresAt: overrides.expiresAt ?? Date.now() + 10 * 60 * 1000,
  requestedScopes: [
    { scope: 'datagsm:self_read', description: '내 학생 정보 조회', applicationName: 'DataGSM' },
  ],
});

const mockSession = (session = createSession()) => {
  const requests: string[] = [];
  server.use(
    http.get(`*/v1/oauth/sessions/${TOKEN}`, ({ request }) => {
      requests.push(request.url);
      return apiSuccess(session);
    }),
  );
  return requests;
};

/** authorize route handler 응답을 정하고, 받은 요청 본문을 모은다. */
const mockAuthorize = (respond: () => Response) => {
  const bodies: unknown[] = [];
  server.use(
    http.post(AUTHORIZE_URL, async ({ request }) => {
      bodies.push(await request.json());
      return respond();
    }),
  );
  return bodies;
};

const setup = () => {
  renderWithProviders(<OAuthAuthorizeForm />);
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
};

const signIn = async (user: User, { email = 's25001', password = 'password1' } = {}) => {
  await user.type(screen.getByLabelText('이메일'), email);
  await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: 'SIGN IN' }));
};

describe('OAuthAuthorizeForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    setMockSearchParams({ token: TOKEN });

    // 컴포넌트는 같은 출처의 route handler를 상대 경로로 부르는데, Node fetch는 상대 경로를 받지 않는다.
    const nodeFetch = globalThis.fetch;
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      nodeFetch(typeof input === 'string' ? new URL(input, 'http://localhost:3000') : input, init),
    );
    // 로그인에 성공하면 외부 서비스 주소로 이동하므로 이동 주소만 기록한다.
    vi.stubGlobal('location', { href: 'http://localhost:3000/oauth/authorize' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('세션 정보', () => {
    it('요청한 서비스 이름과 권한 설명을 보여주고 세션을 저장한다', async () => {
      const session = createSession();
      mockSession(session);
      setup();

      expect(await screen.findByText('급식 알리미')).toBeInTheDocument();
      expect(screen.getByText('내 학생 정보 조회')).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual({ token: TOKEN, ...session });
    });

    it('같은 토큰의 저장된 세션이 있으면 서버에 묻지 않는다', async () => {
      const requests = mockSession();
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token: TOKEN, ...createSession({ serviceName: '저장된 앱' }) }),
      );
      setup();

      expect(await screen.findByText('저장된 앱')).toBeInTheDocument();
      expect(requests).toEqual([]);
    });

    it('다른 토큰의 저장된 세션은 쓰지 않고 서버에서 받아온다', async () => {
      const requests = mockSession();
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token: 'other', ...createSession({ serviceName: '저장된 앱' }) }),
      );
      setup();

      expect(await screen.findByText('급식 알리미')).toBeInTheDocument();
      expect(requests).toHaveLength(1);
    });

    it('만료 30초 전을 기준으로 남은 시간을 보여주고, 끝나면 만료 안내를 띄운다', async () => {
      mockSession(createSession({ expiresAt: Date.now() + 90 * 1000 }));
      setup();

      expect(await screen.findByRole('status')).toHaveTextContent('세션 만료까지: 01:00');

      act(() => vi.advanceTimersByTime(60 * 1000));

      expect(await screen.findByRole('alertdialog')).toHaveTextContent('인증 세션 만료');
      expect(
        screen.getByText('인증 세션이 만료되었습니다. 처음부터 다시 시도해주세요.'),
      ).toBeInTheDocument();
    });
  });

  describe('세션 시작 실패', () => {
    it('URL에 토큰이 없으면 로그인 폼 대신 잘못된 접근 안내만 보여주고, 문서·상태 링크는 없다', async () => {
      setMockSearchParams({});
      setup();

      expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument();
      expect(await screen.findByText('오류')).toBeInTheDocument();
      expect(screen.getByText('잘못되었거나 만료된 접근입니다.', { exact: false })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '기술문서' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '서버 상태 확인' })).not.toBeInTheDocument();
    });

    it('세션 조회가 401이면 잘못된 접근 안내만 보여주고, 문서·상태 링크는 없다', async () => {
      server.use(
        http.get(`*/v1/oauth/sessions/${TOKEN}`, () => apiError(401, '유효하지 않은 토큰')),
      );
      setup();

      expect(await screen.findByText('오류')).toBeInTheDocument();
      expect(screen.getByText('잘못되었거나 만료된 접근입니다.', { exact: false })).toBeInTheDocument();
      expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '기술문서' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '서버 상태 확인' })).not.toBeInTheDocument();
    });

    it('세션 조회가 401이 아닌 오류(서버 장애 등)면 기술문서·서버 상태 링크를 보여준다', async () => {
      server.use(http.get(`*/v1/oauth/sessions/${TOKEN}`, () => apiError(500, '서버 오류')));
      setup();

      expect(await screen.findByText('오류')).toBeInTheDocument();
      expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: '기술문서' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '서버 상태 확인' })).toBeInTheDocument();
    });
  });

  describe('로그인', () => {
    it('이메일에 도메인을 붙여 토큰과 함께 보내고, 받은 주소로 이동하며 세션 캐시를 지운다', async () => {
      mockSession();
      const bodies = mockAuthorize(() =>
        HttpResponse.json({ redirect_url: 'https://app.test/callback?code=abc' }),
      );
      const user = setup();
      await screen.findByText('급식 알리미');

      await signIn(user);

      await waitFor(() => expect(window.location.href).toBe('https://app.test/callback?code=abc'));
      expect(bodies).toEqual([{ email: 's25001@gsm.hs.kr', password: 'password1', token: TOKEN }]);
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });

    it('성공 응답에 이동할 주소가 없으면 안내하고 폼을 다시 쓸 수 있게 한다', async () => {
      mockSession();
      mockAuthorize(() => HttpResponse.json({ success: true }));
      const user = setup();

      await signIn(user);

      expect(
        await screen.findByText('로그인 응답이 올바르지 않습니다. 다시 시도해주세요.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
    });

    it.each([
      [401, '이메일 또는 비밀번호가 일치하지 않습니다.'],
      [403, '승인 대기 중인 계정입니다. 관리자 승인 후 로그인할 수 있습니다.'],
      [500, '로그인에 실패했습니다.'],
    ])('%s 응답이면 안내하고 다시 시도할 수 있게 한다', async (status, message) => {
      mockSession();
      mockAuthorize(() => HttpResponse.json({}, { status }));
      const user = setup();

      await signIn(user);

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('400 응답이면 세션 만료로 보고 만료 안내를 띄운다', async () => {
      mockSession();
      mockAuthorize(() => HttpResponse.json({}, { status: 400 }));
      const user = setup();

      await signIn(user);

      expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('세션이 만료되었습니다. 다시 시도해주세요.')).toBeInTheDocument();
    });

    it('네트워크 오류가 나면 오류 메시지를 보여준다', async () => {
      mockSession();
      server.use(http.post(AUTHORIZE_URL, () => HttpResponse.error()));
      const user = setup();

      await signIn(user);

      expect(await screen.findByText('Failed to fetch')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
    });
  });

  describe('정보 변경이 필요한 계정 (422)', () => {
    const REQUIREMENTS_URL = 'http://localhost:3000/api/oauth/data-edit-requirements';

    const mockRequirements = (respond: () => Response) => {
      const bodies: unknown[] = [];
      server.use(
        http.post(REQUIREMENTS_URL, async ({ request }) => {
          bodies.push(await request.json());
          return respond();
        }),
      );
      return bodies;
    };

    /** 첫 요청은 422, 이후 요청은 respond로 응답한다. */
    const mockAuthorizeAfterDataEdit = (respond: () => Response) => {
      let count = 0;
      return mockAuthorize(() =>
        count++ === 0
          ? HttpResponse.json({ message: '정보 변경 필요' }, { status: 422 })
          : respond(),
      );
    };

    it('필요한 항목을 조회해 정보 변경 화면으로 바꾸고, 입력값을 함께 다시 보낸다', async () => {
      mockSession();
      const authorizeBodies = mockAuthorizeAfterDataEdit(() =>
        HttpResponse.json({ redirect_url: 'https://app.test/callback?code=abc' }),
      );
      const requirementBodies = mockRequirements(() =>
        apiSuccess({ fields: [{ name: 'STUDENT_NUMBER' }, { name: 'DORMITORY_ROOM_NUMBER' }] }),
      );
      const user = setup();

      await signIn(user);

      expect(await screen.findByText('정보 변경')).toBeInTheDocument();
      expect(requirementBodies).toEqual([{ email: 's25001@gsm.hs.kr', password: 'password1' }]);

      await user.type(screen.getByLabelText('학번'), '2103');
      await user.type(screen.getByLabelText('기숙사 호실'), '305');
      await user.click(screen.getByRole('button', { name: 'Enter' }));

      await waitFor(() => expect(window.location.href).toBe('https://app.test/callback?code=abc'));
      expect(authorizeBodies[1]).toEqual({
        email: 's25001@gsm.hs.kr',
        password: 'password1',
        token: TOKEN,
        studentGrade: 2,
        studentClass: 1,
        studentNumber: 3,
        dormitoryRoomNumber: 305,
      });
    });

    it('화면이 모르는 항목이 하나라도 있으면 정보 변경 화면으로 넘어가지 않는다', async () => {
      mockSession();
      mockAuthorizeAfterDataEdit(() => HttpResponse.json({}));
      mockRequirements(() =>
        apiSuccess({ fields: [{ name: 'STUDENT_NUMBER' }, { name: 'PHONE_NUMBER' }] }),
      );
      const user = setup();

      await signIn(user);

      expect(
        await screen.findByText('현재 지원하지 않는 정보 변경 항목입니다. 관리자에게 문의하세요.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('정보 변경')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
    });

    it.each([
      ['조회에 실패하면', () => HttpResponse.json({}, { status: 500 })],
      ['항목이 비어 있으면', () => apiSuccess({ fields: [] })],
    ])('%s 안내하고 로그인 화면에 머문다', async (_, respond) => {
      mockSession();
      mockAuthorizeAfterDataEdit(() => HttpResponse.json({}));
      mockRequirements(respond);
      const user = setup();

      await signIn(user);

      expect(
        await screen.findByText('정보 변경 항목을 불러오지 못했습니다. 다시 시도해주세요.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
    });

    it('정보 변경 재제출이 400이면 세션 만료로 보지 않고 입력 화면을 유지한다', async () => {
      mockSession();
      mockAuthorizeAfterDataEdit(() => HttpResponse.json({}, { status: 400 }));
      mockRequirements(() => apiSuccess({ fields: [{ name: 'DORMITORY_ROOM_NUMBER' }] }));
      const user = setup();
      await signIn(user);
      await user.type(await screen.findByLabelText('기숙사 호실'), '305');

      await user.click(screen.getByRole('button', { name: 'Enter' }));

      expect(
        await screen.findByText(
          '입력한 정보를 저장하지 못했습니다. 값을 확인하고 다시 시도해주세요.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.getByLabelText('기숙사 호실')).toHaveValue('305');
    });
  });
});
