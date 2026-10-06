import type { ClubSummary } from '@repo/shared/types';
import {
  apiPath,
  apiSuccess,
  createPublicClubListData,
  http,
  renderWithProviders,
  screen,
  server,
} from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import ProjectsPage from '.';

const activeClub: ClubSummary = { id: 1, name: '운영동아리', type: 'MAJOR_CLUB' };
const abolishedClub: ClubSummary = { id: 2, name: '폐지동아리', type: 'MAJOR_CLUB' };

describe('ProjectsPage 동아리 필터', () => {
  it('폐지된 동아리도 선택지에 넣되 (폐지)로 구분한다', async () => {
    server.use(
      http.get(apiPath('/v1/public/projects'), () =>
        apiSuccess({ totalPages: 0, totalElements: 0, projects: [] }),
      ),
      http.get(apiPath('/v1/public/clubs'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('clubStatus');
        return apiSuccess(
          createPublicClubListData(
            status === 'ACTIVE' ? [activeClub] : [activeClub, abolishedClub],
          ),
        );
      }),
    );
    const { user } = renderWithProviders(<ProjectsPage />);

    const clubFilter = await screen.findByRole('combobox', { name: '동아리' });
    clubFilter.focus();
    await user.keyboard('{ArrowDown}');

    expect(await screen.findByRole('option', { name: '폐지동아리 (폐지)' })).toBeVisible();
    expect(screen.getByRole('option', { name: '운영동아리' })).toBeVisible();
  });
});
