import { z } from 'zod';

import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_REPOSITORY_MAX_COUNT,
  PROJECT_REPOSITORY_MAX_LENGTH,
  PROJECT_TECH_STACK_MAX_COUNT,
  PROJECT_TECH_STACK_MAX_LENGTH,
} from './constants';

const CURRENT_YEAR = new Date().getFullYear();

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '프로젝트 이름을 입력해 주세요')
    .max(PROJECT_NAME_MAX_LENGTH, `이름은 ${PROJECT_NAME_MAX_LENGTH}자 이하여야 합니다`),
  description: z
    .string()
    .trim()
    .min(1, '프로젝트 설명을 입력해 주세요')
    .max(PROJECT_DESCRIPTION_MAX_LENGTH, `설명은 ${PROJECT_DESCRIPTION_MAX_LENGTH}자 이하여야 합니다`),
  startYear: z
    .number()
    .int('연도는 정수로 입력해 주세요')
    .gte(2000, '올바른 연도를 입력해 주세요')
    .lte(CURRENT_YEAR + 1, '올바른 연도를 입력해 주세요'),
  /** null이면 무소속 */
  clubId: z.number().int().nullable(),
  repositories: z
    .array(z.string().max(PROJECT_REPOSITORY_MAX_LENGTH))
    .max(PROJECT_REPOSITORY_MAX_COUNT, `리포지토리는 최대 ${PROJECT_REPOSITORY_MAX_COUNT}개까지 등록할 수 있습니다`),
  techStacks: z
    .array(z.string().max(PROJECT_TECH_STACK_MAX_LENGTH))
    .max(PROJECT_TECH_STACK_MAX_COUNT, `기술 스택은 최대 ${PROJECT_TECH_STACK_MAX_COUNT}개까지 등록할 수 있습니다`),
  iconKey: z.string().nullable(),
});

export type ProjectFormType = z.infer<typeof projectFormSchema>;
