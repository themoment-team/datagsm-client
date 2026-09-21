import {
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
import { describe, expect, it } from 'vitest';

import type { Event } from '@/entities/events';

import EventsPage from '.';

type User = ReturnType<typeof renderWithProviders>['user'];

const createEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 1,
  target_url: 'https://app.test/webhooks/datagsm',
  events: ['STUDENT_UPDATED'],
  is_active: true,
  created_at: '2026-03-02T09:00:00',
  verification_status: 'VERIFIED',
  ...overrides,
});

const mockEventApi = (
  events: Event[],
  {
    create = () => apiSuccess({ ...createEvent({ id: 99 }), secret: 'whsec_created' }),
    update = () => apiSuccess(createEvent()),
    remove = () => apiSuccess(null),
  }: { create?: () => Response; update?: () => Response; remove?: () => Response } = {},
) => {
  const requests: { method: string; id?: unknown; body?: unknown }[] = [];
  server.use(
    http.get(apiPath('/v1/events'), () => apiSuccess({ events })),
    http.post(apiPath('/v1/events'), async ({ request }) => {
      requests.push({ method: 'POST', body: await request.json() });
      return create();
    }),
    http.patch(apiPath('/v1/events/:id'), async ({ request, params }) => {
      requests.push({ method: 'PATCH', id: params.id, body: await request.json() });
      return update();
    }),
    http.delete(apiPath('/v1/events/:id'), ({ params }) => {
      requests.push({ method: 'DELETE', id: params.id });
      return remove();
    }),
  );
  return requests;
};

const rowOf = async (url: string) =>
  (await screen.findByRole('cell', { name: url })).closest('tr')!;

const openCreateDialog = async (user: User) => {
  await user.click(await screen.findByRole('button', { name: '이벤트 추가' }));
  return screen.findByRole('dialog');
};

describe('EventsPage', () => {
  describe('목록', () => {
    it('등록된 이벤트가 없으면 빈 상태 문구를 보여준다', async () => {
      mockEventApi([]);
      renderWithProviders(<EventsPage />);

      expect(await screen.findByText(/등록된 이벤트가 없습니다/)).toBeInTheDocument();
    });

    it('구독 이벤트와 활성·검증 상태를 보여준다', async () => {
      mockEventApi([
        createEvent({
          id: 1,
          target_url: 'https://a.test',
          events: ['STUDENT_UPDATED', 'CLUB_UPDATED'],
        }),
        createEvent({
          id: 2,
          target_url: 'https://b.test',
          is_active: false,
          verification_status: 'FAILED',
        }),
      ]);
      renderWithProviders(<EventsPage />);

      const first = within(await rowOf('https://a.test'));
      expect(first.getByText('STUDENT_UPDATED')).toBeInTheDocument();
      expect(first.getByText('CLUB_UPDATED')).toBeInTheDocument();
      expect(first.getByText('active')).toBeInTheDocument();
      expect(first.getByText('verified')).toBeInTheDocument();

      const second = within(await rowOf('https://b.test'));
      expect(second.getByText('inactive')).toBeInTheDocument();
      expect(second.getByText('failed')).toBeInTheDocument();
    });

    it('계정당 최대 개수에 닿으면 추가 버튼을 막고 안내한다', async () => {
      mockEventApi(
        Array.from({ length: 10 }, (_, i) =>
          createEvent({ id: i + 1, target_url: `https://${i}.test` }),
        ),
      );
      renderWithProviders(<EventsPage />);

      expect(
        await screen.findByText(/계정당 최대 10개의 이벤트를 등록할 수 있습니다/),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이벤트 추가' })).toBeDisabled();
    });
  });

  describe('추가', () => {
    it('URL 형식과 구독 이벤트 선택을 검사한다', async () => {
      const requests = mockEventApi([]);
      const { user } = renderWithProviders(<EventsPage />);
      const dialog = within(await openCreateDialog(user));

      await user.type(dialog.getByLabelText('수신 URL'), 'ftp://app.test');
      await user.click(dialog.getByRole('button', { name: '추가' }));

      expect(
        await dialog.findByText('URL은 http:// 또는 https://로 시작해야 합니다.'),
      ).toBeInTheDocument();
      expect(dialog.getByText('구독할 이벤트를 최소 1개 이상 선택해주세요.')).toBeInTheDocument();
      expect(requests).toEqual([]);
    });

    it('등록하면 다시 볼 수 없는 secret을 보여주고 복사할 수 있게 한다', async () => {
      const requests = mockEventApi([]);
      const { user } = renderWithProviders(<EventsPage />);
      const dialog = within(await openCreateDialog(user));

      await user.type(dialog.getByLabelText('수신 URL'), 'https://app.test/webhooks');
      await user.click(dialog.getByLabelText(/club\.updated/));
      await user.click(dialog.getByLabelText(/student\.updated/));
      await user.click(dialog.getByRole('button', { name: '추가' }));

      expect(await screen.findByText('EVENT CREATED')).toBeInTheDocument();
      expect(requests).toEqual([
        {
          method: 'POST',
          body: {
            target_url: 'https://app.test/webhooks',
            events: ['CLUB_UPDATED', 'STUDENT_UPDATED'],
          },
        },
      ]);
      const successDialog = within(screen.getByRole('dialog'));
      expect(successDialog.getByText('whsec_created')).toBeInTheDocument();
      expect(successDialog.getByText(/이 창을 닫으면 다시 확인할 수 없습니다/)).toBeInTheDocument();

      await user.click(successDialog.getAllByRole('button').find((button) => !button.textContent)!);

      expect(await screen.findByText('Secret이 복사되었습니다.')).toBeInTheDocument();
      await expect(navigator.clipboard.readText()).resolves.toBe('whsec_created');
    });

    it('등록에 실패하면 안내하고 입력 창을 그대로 둔다', async () => {
      mockEventApi([], { create: () => apiError(400, 'error') });
      const { user } = renderWithProviders(<EventsPage />);
      const dialog = within(await openCreateDialog(user));

      await user.type(dialog.getByLabelText('수신 URL'), 'https://app.test/webhooks');
      await user.click(dialog.getByLabelText(/project\.updated/));
      await user.click(dialog.getByRole('button', { name: '추가' }));

      expect(await screen.findByText('이벤트 생성에 실패했습니다.')).toBeInTheDocument();
      expect(screen.queryByText('EVENT CREATED')).not.toBeInTheDocument();
      expect(dialog.getByLabelText('수신 URL')).toHaveValue('https://app.test/webhooks');
    });
  });

  describe('수정·삭제', () => {
    const actionButtons = async (url: string) => within(await rowOf(url)).getAllByRole('button');

    it('기존 값을 채운 수정 창을 열고, 한 번 더 확인받은 뒤 저장한다', async () => {
      const requests = mockEventApi([createEvent({ id: 7, target_url: 'https://old.test' })]);
      const { user } = renderWithProviders(<EventsPage />);

      const [editButton] = await actionButtons('https://old.test');
      await user.click(editButton!);
      const dialog = within(await screen.findByRole('dialog'));
      expect(dialog.getByLabelText('수신 URL')).toHaveValue('https://old.test');
      expect(dialog.getByRole('checkbox', { name: /student\.updated/ })).toBeChecked();

      await user.clear(dialog.getByLabelText('수신 URL'));
      await user.type(dialog.getByLabelText('수신 URL'), 'https://new.test');
      await user.click(dialog.getByRole('button', { name: '저장' }));
      const confirm = within(await screen.findByRole('alertdialog'));
      expect(requests).toEqual([]);

      await user.click(confirm.getByRole('button', { name: '저장' }));

      expect(await screen.findByText('이벤트가 수정되었습니다.')).toBeInTheDocument();
      expect(requests).toEqual([
        {
          method: 'PATCH',
          id: '7',
          body: { target_url: 'https://new.test', events: ['STUDENT_UPDATED'] },
        },
      ]);
    });

    it('삭제는 확인받은 뒤 해당 이벤트로 요청한다', async () => {
      const requests = mockEventApi([createEvent({ id: 7, target_url: 'https://old.test' })]);
      const { user } = renderWithProviders(<EventsPage />);

      const [, deleteButton] = await actionButtons('https://old.test');
      await user.click(deleteButton!);
      await user.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: '취소' }),
      );
      expect(requests).toEqual([]);

      await user.click(deleteButton!);
      await user.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: '삭제' }),
      );

      expect(await screen.findByText('이벤트가 삭제되었습니다.')).toBeInTheDocument();
      expect(requests).toEqual([{ method: 'DELETE', id: '7' }]);
    });

    it('삭제에 실패하면 안내한다', async () => {
      mockEventApi([createEvent({ id: 7, target_url: 'https://old.test' })], {
        remove: () => apiError(500, 'error'),
      });
      const { user } = renderWithProviders(<EventsPage />);

      const [, deleteButton] = await actionButtons('https://old.test');
      await user.click(deleteButton!);
      await user.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: '삭제' }),
      );

      await waitFor(() =>
        expect(screen.getByText('이벤트 삭제에 실패했습니다.')).toBeInTheDocument(),
      );
    });
  });
});
