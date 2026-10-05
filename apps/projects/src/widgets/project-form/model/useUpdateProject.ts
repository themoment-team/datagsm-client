import { meProjectQueryKeys, meProjectUrl, put } from '@repo/shared/api';
import type { ProjectEditRequestResponse, ProjectRequestBody } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

interface UpdateProjectVariables {
  projectId: number;
  data: ProjectRequestBody;
}

export const useUpdateProject = (
  options?: Omit<
    UseMutationOptions<ProjectEditRequestResponse, AxiosError, UpdateProjectVariables>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: meProjectQueryKeys.putMyProject(),
    mutationFn: ({ projectId, data }: UpdateProjectVariables) =>
      put<ProjectEditRequestResponse>(meProjectUrl.putMyProject(projectId), data),
    ...options,
  });
