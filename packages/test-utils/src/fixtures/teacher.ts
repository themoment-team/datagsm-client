import type { Teacher } from '@repo/shared/types';

import { nextId } from './sequence';

export const createTeacher = (overrides: Partial<Teacher> = {}): Teacher => {
  const id = overrides.id ?? nextId();

  return {
    id,
    name: `선생님${id}`,
    email: `teacher${id}@gsm.hs.kr`,
    department: 'MEISTER',
    description: null,
    ...overrides,
  };
};
