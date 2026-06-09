import { post, webhookQueryKeys, webhookUrl } from '@repo/shared/api';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { CreateWebhookRequest, CreateWebhookResponse } from '@/entities/webhooks';

export const useCreateWebhook = (
  options?: Omit<
    UseMutationOptions<CreateWebhookResponse, AxiosError, CreateWebhookRequest>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: webhookQueryKeys.postWebhook(),
    mutationFn: (data: CreateWebhookRequest) =>
      post<CreateWebhookResponse>(webhookUrl.postWebhook(), data),
    ...options,
  });
