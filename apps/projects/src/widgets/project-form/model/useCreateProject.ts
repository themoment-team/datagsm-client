import { meProjectQueryKeys, meProjectUrl, post } from '@repo/shared/api';
import type { ProjectEditRequestResponse, ProjectRequestBody } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const useCreateProject = (
  options?: Omit<
    UseMutationOptions<ProjectEditRequestResponse, AxiosError, ProjectRequestBody>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: meProjectQueryKeys.postMyProject(),
    mutationFn: (data: ProjectRequestBody) =>
      post<ProjectEditRequestResponse>(meProjectUrl.postMyProject(), data),
    ...options,
  });
