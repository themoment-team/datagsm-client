import { eventQueryKeys, eventUrl, patch } from '@repo/shared/api';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { UpdateEventRequest, UpdateEventResponse } from '@/entities/events';

interface UpdateEventVariables {
  eventId: number;
  data: UpdateEventRequest;
}

export const useUpdateEvent = (
  options?: Omit<
    UseMutationOptions<UpdateEventResponse, AxiosError, UpdateEventVariables>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: eventQueryKeys.patchEvent(),
    mutationFn: ({ eventId, data }: UpdateEventVariables) =>
      patch<UpdateEventResponse>(eventUrl.patchEvent(eventId), data),
    ...options,
  });
