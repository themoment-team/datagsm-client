import { z } from 'zod';

export const DEPLOYMENT_URL_MAX_LENGTH = 300;

/** 서버 검증(`^https?://.*`)과 같은 규칙. 서버는 대소문자를 구분하므로 `i` 플래그를 붙이지 않는다. */
export const DEPLOYMENT_URL_PATTERN = /^https?:\/\//;

export const ProjectFilterSchema = z.object({
  projectName: z.string().optional(),
  clubId: z.number().optional(),
  status: z.enum(['ACTIVE', 'ENDED']).optional(),
});

export type ProjectFilterType = z.infer<typeof ProjectFilterSchema>;

export const AddProjectSchema = z
  .object({
    name: z.string().min(1, { message: '프로젝트명을 입력해주세요.' }),
    description: z.string().min(1, { message: '프로젝트 설명을 입력해주세요.' }),
    startYear: z
      .number({ message: '시작 연도를 입력해주세요.' })
      .int()
      .min(1900, { message: '1900년 이후의 연도를 입력해주세요.' }),
    clubId: z.number().nullable().optional(),
    participantIds: z.array(z.number()).min(1, { message: '한 명 이상의 팀원을 선택해주세요.' }),
    status: z.enum(['ACTIVE', 'ENDED'], {
      message: '운영 상태를 선택해주세요.',
    }),
    endYear: z.number().int().min(1900, { message: '1900년 이후의 연도를 입력해주세요.' }).optional(),
    repositories: z
      .array(z.string().max(300, { message: '리포지토리 URL은 300자 이하로 입력해주세요.' }))
      .max(20, { message: '리포지토리는 최대 20개까지 등록할 수 있습니다.' }),
    techStacks: z
      .array(z.string().max(50, { message: '기술 스택은 50자 이하로 입력해주세요.' }))
      .max(20, { message: '기술 스택은 최대 20개까지 등록할 수 있습니다.' }),
    /** 빈 문자열이면 미입력. 서버는 공백을 걸러주지 않아 여기서 trim한 값을 보낸다. */
    deploymentUrl: z
      .string()
      .trim()
      .max(DEPLOYMENT_URL_MAX_LENGTH, {
        message: `배포 URL은 ${DEPLOYMENT_URL_MAX_LENGTH}자 이하로 입력해주세요.`,
      })
      .refine((value) => value === '' || DEPLOYMENT_URL_PATTERN.test(value), {
        message: 'http:// 또는 https://로 시작하는 주소를 입력해주세요.',
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'ACTIVE') {
      return;
    }

    if (data.endYear === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '종료 연도를 입력해주세요.',
        path: ['endYear'],
      });
      return;
    }

    if (data.endYear < data.startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '종료 연도는 시작 연도보다 크거나 같아야 합니다.',
        path: ['endYear'],
      });
    }
  });

export type AddProjectType = z.infer<typeof AddProjectSchema>;
