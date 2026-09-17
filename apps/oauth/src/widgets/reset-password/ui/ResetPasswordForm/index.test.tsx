import {
  act,
  apiError,
  apiSuccess,
  http,
  mockRouter,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordForm from '.';

const SEND_CODE_URL = '*/v1/accounts/password-resets';
const VERIFY_CODE_URL = '*/v1/accounts/password-resets/verification';
const CHANGE_PASSWORD_URL = '*/v1/accounts/password';
const COOLDOWN_KEY = 'password_reset_verification_timestamp';

type User = ReturnType<typeof userEvent.setup>;

const mockPasswordApi = ({
  sendCode = () => apiSuccess(null),
  verifyCode = () => apiSuccess(null),
  changePassword = () => apiSuccess(null),
}: {
  sendCode?: () => Response;
  verifyCode?: () => Response;
  changePassword?: () => Response;
} = {}) => {
  const requests = {
    sendCode: [] as unknown[],
    verifyCode: [] as unknown[],
    change: [] as unknown[],
  };
  server.use(
    http.post(SEND_CODE_URL, async ({ request }) => {
      requests.sendCode.push(await request.json());
      return sendCode();
    }),
    http.post(VERIFY_CODE_URL, async ({ request }) => {
      requests.verifyCode.push(await request.json());
      return verifyCode();
    }),
    http.put(CHANGE_PASSWORD_URL, async ({ request }) => {
      requests.change.push(await request.json());
      return changePassword();
    }),
  );
  return requests;
};

const setup = () => {
  renderWithProviders(<ResetPasswordForm />);
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
};

const sendCode = async (user: User) => {
  await user.type(screen.getByLabelText('이메일'), 's25001');
  await user.click(screen.getByRole('button', { name: '코드전송' }));
  await screen.findByText('인증 코드가 이메일로 전송되었습니다.');
};

const verifyCode = async (user: User, code = 'ABCD1234') => {
  await user.type(screen.getByLabelText('인증 코드'), code);
  act(() => vi.advanceTimersByTime(1000));
};

const verify = async (user: User) => {
  await sendCode(user);
  await verifyCode(user);
  await screen.findByText('인증 완료');
};

const fillPasswords = async (user: User, confirm = 'newpass12') => {
  await user.type(screen.getByLabelText('새로운 비밀번호'), 'newpass12');
  await user.type(screen.getByLabelText('비밀번호 확인'), confirm);
};

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('인증 코드 전송', () => {
    it('도메인을 붙인 이메일로 코드를 보내고 5분 쿨다운을 시작한다', async () => {
      const requests = mockPasswordApi();
      const user = setup();

      await sendCode(user);

      expect(requests.sendCode).toEqual([{ email: 's25001@gsm.hs.kr' }]);
      expect(screen.getByRole('button', { name: '5:00' })).toBeDisabled();
      expect(localStorage.getItem(COOLDOWN_KEY)).not.toBeNull();
    });

    it.each([
      [404, '존재하지 않는 이메일입니다.'],
      [429, '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'],
      [500, '인증 코드 전송에 실패했습니다.'],
    ])('전송이 %s로 실패하면 안내 토스트를 띄운다', async (status, message) => {
      mockPasswordApi({ sendCode: () => apiError(status, 'error') });
      const user = setup();

      await user.type(screen.getByLabelText('이메일'), 's25001');
      await user.click(screen.getByRole('button', { name: '코드전송' }));

      expect(await screen.findByText(message)).toBeInTheDocument();
    });

    it('새로고침해도 남은 쿨다운을 이어서 보여준다', () => {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() - 4 * 60 * 1000));
      mockPasswordApi();
      setup();

      expect(screen.getByRole('button', { name: '1:00' })).toBeDisabled();
      expect(screen.getByLabelText('인증 코드')).toBeEnabled();
    });

    it('인증하지 못한 채 5분이 지나면 만료 토스트를 띄우고 코드를 비운다', async () => {
      mockPasswordApi();
      const user = setup();
      await sendCode(user);
      await user.type(screen.getByLabelText('인증 코드'), '1234');

      act(() => vi.advanceTimersByTime(5 * 60 * 1000));

      expect(
        await screen.findByText('인증 시간이 만료되었습니다. 다시 인증해주세요.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('인증 코드')).toHaveValue('');
      expect(localStorage.getItem(COOLDOWN_KEY)).toBeNull();
    });

    it('인증을 마친 뒤에는 5분이 지나도 만료 처리하지 않는다', async () => {
      mockPasswordApi();
      const user = setup();
      await verify(user);

      act(() => vi.advanceTimersByTime(5 * 60 * 1000));

      expect(screen.getByText('인증 완료')).toBeInTheDocument();
      expect(screen.getByLabelText('인증 코드')).toHaveValue('ABCD1234');
      expect(
        screen.queryByText('인증 시간이 만료되었습니다. 다시 인증해주세요.'),
      ).not.toBeInTheDocument();
    });
  });

  describe('인증 코드 확인', () => {
    it('8자리 코드를 이메일과 함께 확인하고 새 비밀번호 입력을 연다', async () => {
      const requests = mockPasswordApi();
      const user = setup();

      await verify(user);

      expect(requests.verifyCode).toEqual([{ email: 's25001@gsm.hs.kr', code: 'ABCD1234' }]);
      expect(screen.getByLabelText('새로운 비밀번호')).toBeEnabled();
    });

    it.each([
      [400, '인증 코드가 일치하지 않습니다.'],
      [404, '인증 코드가 만료되었거나 존재하지 않습니다.'],
      [429, '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'],
      [500, '인증 코드 확인에 실패했습니다.'],
    ])('확인이 %s로 실패하면 안내하고 새 비밀번호 입력을 닫아 둔다', async (status, message) => {
      mockPasswordApi({ verifyCode: () => apiError(status, 'error') });
      const user = setup();
      await sendCode(user);

      await verifyCode(user);

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByLabelText('새로운 비밀번호')).toBeDisabled();
    });
  });

  describe('비밀번호 변경', () => {
    it('비밀번호 확인이 다르면 변경 버튼을 누를 수 없다', async () => {
      mockPasswordApi();
      const user = setup();
      await verify(user);

      await fillPasswords(user, 'different1');

      expect(screen.getByRole('button', { name: 'RESET PASSWORD' })).toBeDisabled();
    });

    it('새 비밀번호로 변경하고 성공 페이지로 이동한다', async () => {
      const requests = mockPasswordApi();
      const user = setup();
      await verify(user);
      await fillPasswords(user);

      await user.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));

      await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/success?page=reset'));
      expect(requests.change).toEqual([
        { email: 's25001@gsm.hs.kr', code: 'ABCD1234', newPassword: 'newpass12' },
      ]);
    });

    it.each([
      [400, '이전 비밀번호와 동일합니다.'],
      [404, '계정이 존재하지 않습니다.'],
      [429, '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'],
      [500, '비밀번호 변경에 실패했습니다.'],
    ])('변경이 %s로 실패하면 안내 토스트를 띄운다', async (status, message) => {
      mockPasswordApi({ changePassword: () => apiError(status, 'error') });
      const user = setup();
      await verify(user);
      await fillPasswords(user);

      await user.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it('비밀번호가 기억나면 창을 닫는다', async () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    mockPasswordApi();
    const user = setup();

    await user.click(screen.getByRole('button', { name: '비밀번호가 기억나셨나요?' }));

    expect(close).toHaveBeenCalled();
  });
});
