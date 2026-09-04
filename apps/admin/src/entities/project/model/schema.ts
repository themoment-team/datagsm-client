import { z } from 'zod';

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
