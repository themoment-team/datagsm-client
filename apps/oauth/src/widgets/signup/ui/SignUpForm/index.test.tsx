import {
  act,
  apiError,
  apiSuccess,
  fireEvent,
  http,
  mockRouter,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SignUpForm from '.';

const SEND_CODE_URL = '*/v1/accounts/email-verifications';
const VERIFY_CODE_URL = '*/v1/accounts/email-verifications/verify';
const SIGN_UP_URL = '*/v1/accounts';
const COOLDOWN_KEY = 'email_verification_timestamp';

type Requests = { sendCode: unknown[]; verifyCode: unknown[]; signUp: unknown[] };

const mockAccountApi = ({
  sendCode = () => apiSuccess(null),
  verifyCode = () => apiSuccess(null),
  signUp = () => apiSuccess(null),
}: {
  sendCode?: () => Response;
  verifyCode?: () => Response;
  signUp?: () => Response;
} = {}) => {
  const requests: Requests = { sendCode: [], verifyCode: [], signUp: [] };
  server.use(
    http.post(SEND_CODE_URL, async ({ request }) => {
      requests.sendCode.push(await request.json());
      return sendCode();
    }),
    http.post(VERIFY_CODE_URL, async ({ request }) => {
      requests.verifyCode.push(await request.json());
      return verifyCode();
    }),
    http.post(SIGN_UP_URL, async ({ request }) => {
      requests.signUp.push(await request.json());
      return signUp();
    }),
  );
  return requests;
};

const setup = (objectType: 'STUDENT' | 'TEACHER' = 'STUDENT') => {
  const result = renderWithProviders(<SignUpForm objectType={objectType} />);
  // 인증 코드 입력은 1초 debounce 후 검증하므로 가짜 타이머와 함께 쓴다.
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  return { ...result, user };
};

const sendCode = async (user: ReturnType<typeof userEvent.setup>, email = 's25001') => {
  await user.type(screen.getByLabelText('이메일'), email);
  await user.click(screen.getByRole('button', { name: '코드전송' }));
  await screen.findByText('인증 코드가 이메일로 전송되었습니다.');
};

const verifyCode = async (user: ReturnType<typeof userEvent.setup>, code = 'ABCD1234') => {
  await user.type(screen.getByLabelText('인증 코드'), code);
  act(() => vi.advanceTimersByTime(1000));
};

const agreePrivacy = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText('개인정보 처리방침'));
  const dialog = await screen.findByRole('dialog');
  const agreeButton = within(dialog).getByRole('button', { name: '동의합니다' });

  expect(agreeButton).toBeDisabled();
  // jsdom은 레이아웃이 없어 스크롤 위치가 늘 끝으로 계산된다.
  fireEvent.scroll(
    within(dialog)
      .getByText(/개인정보/, { selector: 'h1' })
      .closest('div[class*="overflow-y-auto"]')!,
  );

  await user.click(agreeButton);
};

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('인증 코드 전송', () => {
    it('도메인을 붙인 이메일로 코드를 보내고 5분 쿨다운을 시작한다', async () => {
      const requests = mockAccountApi();
      const { user } = setup();

      await sendCode(user);

      expect(requests.sendCode).toEqual([{ email: 's25001@gsm.hs.kr' }]);
      expect(screen.getByRole('button', { name: '5:00' })).toBeDisabled();
      expect(screen.getByLabelText('이메일')).toBeDisabled();
      expect(screen.getByLabelText('인증 코드')).toBeEnabled();
      expect(localStorage.getItem(COOLDOWN_KEY)).not.toBeNull();
    });

    it('이메일이 비어 있으면 코드전송 버튼을 누를 수 없다', () => {
      mockAccountApi();
      setup();

      expect(screen.getByRole('button', { name: '코드전송' })).toBeDisabled();
    });

    it.each([
      [400, '이메일 형식을 확인해주세요.'],
      [409, '이미 해당 이메일을 가진 계정이 존재합니다.'],
      [500, '인증 코드 전송에 실패했습니다.'],
    ])('전송이 %s로 실패하면 안내 토스트를 띄운다', async (status, message) => {
      mockAccountApi({ sendCode: () => apiError(status, 'error') });
      const { user } = setup();

      await user.type(screen.getByLabelText('이메일'), 's25001');
      await user.click(screen.getByRole('button', { name: '코드전송' }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByLabelText('이메일')).toBeEnabled();
    });

    it('새로고침해도 남은 쿨다운을 이어서 보여준다', () => {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() - 2 * 60 * 1000));
      mockAccountApi();
      setup();

      expect(screen.getByRole('button', { name: '3:00' })).toBeDisabled();
      expect(screen.getByLabelText('인증 코드')).toBeEnabled();
    });

    it('쿨다운이 끝나면 저장된 기록을 지우고 처음 상태로 보여준다', () => {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() - 6 * 60 * 1000));
      mockAccountApi();
      setup();

      expect(localStorage.getItem(COOLDOWN_KEY)).toBeNull();
      expect(screen.getByLabelText('인증 코드')).toBeDisabled();
    });

    it('인증하지 못한 채 5분이 지나면 만료 토스트를 띄우고 코드를 비운다', async () => {
      mockAccountApi();
      const { user } = setup();
      await sendCode(user);
      await user.type(screen.getByLabelText('인증 코드'), '1234');

      act(() => vi.advanceTimersByTime(5 * 60 * 1000));

      expect(
        await screen.findByText('인증 시간이 만료되었습니다. 다시 인증해주세요.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('인증 코드')).toHaveValue('');
      expect(screen.getByLabelText('인증 코드')).toBeDisabled();
      expect(screen.getByRole('button', { name: '코드전송' })).toBeEnabled();
    });
  });

  describe('인증 코드 확인', () => {
    it('8자리를 입력하고 1초 뒤 한 번만 확인 요청을 보내고 비밀번호 입력을 연다', async () => {
      const requests = mockAccountApi();
      const { user } = setup();
      await sendCode(user);

      await verifyCode(user);

      expect(await screen.findByText('인증 완료')).toBeInTheDocument();
      expect(requests.verifyCode).toEqual([{ email: 's25001@gsm.hs.kr', code: 'ABCD1234' }]);
      expect(screen.getByLabelText('비밀번호')).toBeEnabled();
      expect(screen.getByLabelText('인증 코드')).toBeDisabled();
    });

    it('8자리가 아니면 확인 요청을 보내지 않는다', async () => {
      const requests = mockAccountApi();
      const { user } = setup();
      await sendCode(user);

      await verifyCode(user, 'ABCD123');

      expect(requests.verifyCode).toEqual([]);
    });

    it.each([
      [400, '인증 코드가 일치하지 않습니다.'],
      [404, '인증 코드가 만료되었거나 존재하지 않습니다.'],
    ])('확인이 %s로 실패하면 안내하고 비밀번호 입력을 닫아 둔다', async (status, message) => {
      mockAccountApi({ verifyCode: () => apiError(status, 'error') });
      const { user } = setup();
      await sendCode(user);

      await verifyCode(user);

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByLabelText('비밀번호')).toBeDisabled();
    });
  });

  describe('가입', () => {
    const fillPasswords = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText('비밀번호'), 'password1');
      await user.type(screen.getByLabelText('비밀번호 확인'), 'password1');
    };

    it('인증 전에는 가입 버튼을 누를 수 없다', () => {
      mockAccountApi();
      setup();

      expect(screen.getByRole('button', { name: 'SIGN UP' })).toBeDisabled();
    });

    it('개인정보 처리방침은 끝까지 읽어야 동의할 수 있다', async () => {
      mockAccountApi();
      const { user } = setup();

      await agreePrivacy(user);

      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('개인정보 처리방침에 동의하지 않으면 요청하지 않고 에러를 보여준다', async () => {
      const requests = mockAccountApi();
      const { user } = setup();
      await sendCode(user);
      await verifyCode(user);
      await screen.findByText('인증 완료');
      await fillPasswords(user);

      await user.click(screen.getByRole('button', { name: 'SIGN UP' }));

      expect(await screen.findByText('개인정보 처리방침에 동의해주세요.')).toBeInTheDocument();
      expect(requests.signUp).toEqual([]);
    });

    it('학생으로 가입하고 성공 페이지로 이동한다', async () => {
      const requests = mockAccountApi();
      const { user } = setup();
      await sendCode(user);
      await verifyCode(user);
      await screen.findByText('인증 완료');
      await fillPasswords(user);
      await agreePrivacy(user);

      await user.click(screen.getByRole('button', { name: 'SIGN UP' }));

      await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/success?page=signup'));
      expect(requests.signUp).toEqual([
        {
          objectType: 'STUDENT',
          email: 's25001@gsm.hs.kr',
          password: 'password1',
          code: 'ABCD1234',
        },
      ]);
    });

    it.each([
      [400, '입력 데이터를 확인해주세요.'],
      [404, '인증 코드가 만료되었거나 존재하지 않습니다.'],
      [409, '이미 존재하는 계정입니다.'],
      [500, '회원가입에 실패했습니다.'],
    ])('가입이 %s로 실패하면 안내 토스트를 띄운다', async (status, message) => {
      mockAccountApi({ signUp: () => apiError(status, 'error') });
      const { user } = setup();
      await sendCode(user);
      await verifyCode(user);
      await screen.findByText('인증 완료');
      await fillPasswords(user);
      await agreePrivacy(user);

      await user.click(screen.getByRole('button', { name: 'SIGN UP' }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('선생님은 성함·부서를 함께 보내고 빈 설명은 빼며 선생님 성공 페이지로 이동한다', async () => {
      const requests = mockAccountApi();
      const { user } = setup('TEACHER');
      await sendCode(user, 'teacher');
      await verifyCode(user);
      await screen.findByText('인증 완료');
      await fillPasswords(user);
      await user.type(screen.getByLabelText('성함'), '  김선생 ');
      await user.click(screen.getByRole('combobox', { name: '소속 부서' }));
      await user.click(await screen.findByRole('option', { name: '마이스터부' }));
      await user.type(screen.getByLabelText('설명'), '   ');
      await agreePrivacy(user);

      await user.click(screen.getByRole('button', { name: 'SIGN UP' }));

      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith('/success?page=signup-teacher'),
      );
      expect(requests.signUp).toEqual([
        {
          objectType: 'TEACHER',
          email: 'teacher@gsm.hs.kr',
          password: 'password1',
          code: 'ABCD1234',
          name: '김선생',
          department: 'MEISTER',
        },
      ]);
    });

    it('선생님이 중복 신청하면 선생님용 안내를 띄운다', async () => {
      mockAccountApi({ signUp: () => apiError(409, 'duplicated') });
      const { user } = setup('TEACHER');
      await sendCode(user, 'teacher');
      await verifyCode(user);
      await screen.findByText('인증 완료');
      await fillPasswords(user);
      await user.type(screen.getByLabelText('성함'), '김선생');
      await user.click(screen.getByRole('combobox', { name: '소속 부서' }));
      await user.click(await screen.findByRole('option', { name: '마이스터부' }));
      await agreePrivacy(user);

      await user.click(screen.getByRole('button', { name: 'SIGN UP' }));

      expect(
        await screen.findByText('이미 해당 이메일로 가입되었거나 신청된 계정이 있습니다.'),
      ).toBeInTheDocument();
    });
  });
});
