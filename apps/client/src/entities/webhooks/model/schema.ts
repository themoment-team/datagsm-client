import { z } from 'zod';

export const WebhookFormSchema = z.object({
  targetUrl: z
    .url({ message: '올바른 URL 형식이 아닙니다.' })
    .regex(/^https?:\/\//, { message: 'URL은 http:// 또는 https://로 시작해야 합니다.' }),
  events: z.array(z.string()).min(1, { message: '구독할 이벤트를 최소 1개 이상 선택해주세요.' }),
});

export type WebhookFormType = z.infer<typeof WebhookFormSchema>;
