import { del, webhookQueryKeys, webhookUrl } from '@repo/shared/api';
import { BaseApiResponse } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const useDeleteWebhook = (
  options?: Omit<
    UseMutationOptions<BaseApiResponse, AxiosError, number>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: webhookQueryKeys.deleteWebhook(),
    mutationFn: (webhookId) => del<BaseApiResponse>(webhookUrl.deleteWebhook(webhookId)),
    ...options,
  });
