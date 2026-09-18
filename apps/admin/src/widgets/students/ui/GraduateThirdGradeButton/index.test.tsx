import {
  apiError,
  apiPath,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  server,
  within,
} from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import GraduateThirdGradeButton from '.';

const mockGraduate = (respond: () => Response = () => apiSuccess(null)) => {
  let count = 0;
  server.use(
    http.post(apiPath('/v1/students/graduate/third-grade'), () => {
      count += 1;
      return respond();
    }),
  );
  return () => count;
};

const openConfirm = async () => {
  const view = renderWithProviders(<GraduateThirdGradeButton />);
  await view.user.click(screen.getByRole('button', { name: '3학년 전체 졸업' }));
  const alert = await screen.findByRole('alertdialog');
  return { ...view, alert };
};

describe('GraduateThirdGradeButton', () => {
  it('되돌릴 수 없다는 경고와 함께 한 번 더 확인받는다', async () => {
    const requestCount = mockGraduate();
    const { alert } = await openConfirm();

    expect(alert).toHaveTextContent('정말 3학년 전체 졸업 기능을 실행할까요?');
    expect(alert).toHaveTextContent('이 작업은 되돌릴 수 없습니다!');
    expect(requestCount()).toBe(0);
  });

  it('취소하면 졸업 처리를 요청하지 않는다', async () => {
    const requestCount = mockGraduate();
    const { user, alert } = await openConfirm();

    await user.click(within(alert).getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(requestCount()).toBe(0);
  });

  it('확인하면 졸업 처리를 한 번 요청하고 완료를 알린다', async () => {
    const requestCount = mockGraduate();
    const { user, alert } = await openConfirm();

    await user.click(within(alert).getByRole('button', { name: '확인' }));

    expect(await screen.findByText('3학년 전체 졸업 처리가 완료되었습니다.')).toBeInTheDocument();
    expect(requestCount()).toBe(1);
  });

  it('실패하면 다시 시도하라고 알린다', async () => {
    mockGraduate(() => apiError(500, 'error'));
    const { user, alert } = await openConfirm();

    await user.click(within(alert).getByRole('button', { name: '확인' }));

    expect(
      await screen.findByText('졸업 처리에 실패했습니다. 다시 시도해주세요.'),
    ).toBeInTheDocument();
  });
});
