import { del, eventQueryKeys, eventUrl } from '@repo/shared/api';
import { BaseApiResponse } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const useDeleteEvent = (
  options?: Omit<
    UseMutationOptions<BaseApiResponse, AxiosError, number>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: eventQueryKeys.deleteEvent(),
    mutationFn: (eventId) => del<BaseApiResponse>(eventUrl.deleteEvent(eventId)),
    ...options,
  });
