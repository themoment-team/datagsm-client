import { oauthDel, oauthQueryKeys, oauthUrl } from '@repo/shared/api';
import { BaseApiResponse } from '@repo/shared/types';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export interface DeleteIdpSessionVariables {
  sessionId: string;
  /** 삭제 대상이 현재 접속 중인 세션인지. 백엔드에는 보내지 않고, 성공 후 분기에만 쓴다. */
  isCurrent: boolean;
}

export const useDeleteIdpSession = (
  options?: Omit<
    UseMutationOptions<BaseApiResponse | undefined, AxiosError, DeleteIdpSessionVariables>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: oauthQueryKeys.deleteIdpSession(),
    mutationFn: ({ sessionId }: DeleteIdpSessionVariables) =>
      oauthDel<BaseApiResponse | undefined>(oauthUrl.deleteIdpSession(sessionId), {
        withCredentials: true,
      }),
    ...options,
  });
