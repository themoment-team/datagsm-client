import { post, projectRequestQueryKeys, projectRequestUrl } from '@repo/shared/api';
import type { BaseApiResponse } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const useAcceptProjectRequest = (
  options?: Omit<
    UseMutationOptions<BaseApiResponse, AxiosError, number>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: projectRequestQueryKeys.postAcceptProjectRequest(),
    mutationFn: (requestId: number) =>
      post<BaseApiResponse>(projectRequestUrl.postAcceptProjectRequest(requestId)),
    ...options,
  });
