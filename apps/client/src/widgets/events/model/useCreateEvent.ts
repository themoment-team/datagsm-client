import { eventQueryKeys, eventUrl, post } from '@repo/shared/api';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { CreateEventRequest, CreateEventResponse } from '@/entities/events';

export const useCreateEvent = (
  options?: Omit<
    UseMutationOptions<CreateEventResponse, AxiosError, CreateEventRequest>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: eventQueryKeys.postEvent(),
    mutationFn: (data: CreateEventRequest) =>
      post<CreateEventResponse>(eventUrl.postEvent(), data),
    ...options,
  });
