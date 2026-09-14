import { post, projectQueryKeys, projectUrl } from '@repo/shared/api';
import { BaseApiResponse } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export interface CreateProjectRequest {
  name: string;
  description: string;
  startYear: number;
  clubId?: number | null;
  participantIds: number[];
  status: 'ACTIVE' | 'ENDED';
  endYear?: number;
  repositories: string[];
  techStacks: string[];
}

export const useCreateProject = (
  options?: Omit<
    UseMutationOptions<BaseApiResponse, AxiosError, CreateProjectRequest>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: projectQueryKeys.postProject(),
    mutationFn: (data: CreateProjectRequest) =>
      post<BaseApiResponse>(projectUrl.postProject(), data),
    ...options,
  });
