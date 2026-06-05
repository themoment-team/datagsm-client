import { get, webhookQueryKeys, webhookUrl } from '@repo/shared/api';
import { minutesToMs } from '@repo/shared/utils';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { WebhookListResponse } from '@/entities/webhooks';

export const useGetWebhooks = (
  options?: Omit<UseQueryOptions<WebhookListResponse>, 'queryKey' | 'queryFn'>,
) =>
  useQuery({
    queryKey: webhookQueryKeys.getWebhooks(),
    queryFn: () => get<WebhookListResponse>(webhookUrl.getWebhooks()),
    staleTime: minutesToMs(5),
    gcTime: minutesToMs(10),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });
