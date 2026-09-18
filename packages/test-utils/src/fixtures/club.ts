import type { Club, ClubListData } from '@repo/shared/types';

import { nextId } from './sequence';

/** 기본값은 부장과 참여자가 없는 활동 중인 전공동아리다. */
export const createClub = (overrides: Partial<Club> = {}): Club => {
  const id = overrides.id ?? nextId();

  return {
    id,
    name: `동아리${id}`,
    type: 'MAJOR_CLUB',
    status: 'ACTIVE',
    foundedYear: 2024,
    abolishedYear: null,
    leader: null,
    participants: [],
    ...overrides,
  };
};

export const createClubListData = (
  clubs: Club[] = [createClub()],
  overrides: Partial<ClubListData> = {},
): ClubListData => ({
  totalPages: 1,
  totalElements: clubs.length,
  clubs,
  ...overrides,
});
