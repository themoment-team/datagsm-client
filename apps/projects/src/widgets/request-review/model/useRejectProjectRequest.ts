import { post, projectRequestQueryKeys, projectRequestUrl } from '@repo/shared/api';
import type { BaseApiResponse, ProjectRejectBody } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

interface RejectProjectRequestVariables {
  requestId: number;
  reason: string;
}

export const useRejectProjectRequest = (
  options?: Omit<
    UseMutationOptions<BaseApiResponse, AxiosError, RejectProjectRequestVariables>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: projectRequestQueryKeys.postRejectProjectRequest(),
    mutationFn: ({ requestId, reason }: RejectProjectRequestVariables) => {
      const body: ProjectRejectBody = { reason };
      return post<BaseApiResponse>(projectRequestUrl.postRejectProjectRequest(requestId), body);
    },
    ...options,
  });
