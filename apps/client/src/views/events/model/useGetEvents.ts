import { eventQueryKeys, eventUrl, get } from '@repo/shared/api';
import { minutesToMs } from '@repo/shared/utils';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { EventListResponse } from '@/entities/events';

export const useGetEvents = (
  options?: Omit<UseQueryOptions<EventListResponse>, 'queryKey' | 'queryFn'>,
) =>
  useQuery({
    queryKey: eventQueryKeys.getEvents(),
    queryFn: () => get<EventListResponse>(eventUrl.getEvents()),
    staleTime: minutesToMs(5),
    gcTime: minutesToMs(10),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });
