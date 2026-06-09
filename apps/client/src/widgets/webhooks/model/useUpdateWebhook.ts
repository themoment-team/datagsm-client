import { patch, webhookQueryKeys, webhookUrl } from '@repo/shared/api';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { UpdateWebhookRequest, UpdateWebhookResponse } from '@/entities/webhooks';

interface UpdateWebhookVariables {
  webhookId: number;
  data: UpdateWebhookRequest;
}

export const useUpdateWebhook = (
  options?: Omit<
    UseMutationOptions<UpdateWebhookResponse, AxiosError, UpdateWebhookVariables>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: webhookQueryKeys.patchWebhook(),
    mutationFn: ({ webhookId, data }: UpdateWebhookVariables) =>
      patch<UpdateWebhookResponse>(webhookUrl.patchWebhook(webhookId), data),
    ...options,
  });
