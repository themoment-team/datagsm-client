import { accountQueryKeys, accountUrl, del } from '@repo/shared/api';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

interface RejectTeacherAccountVariables {
  accountId: number;
}

export const useRejectTeacherAccount = (
  options?: Omit<
    UseMutationOptions<void, AxiosError, RejectTeacherAccountVariables>,
    'mutationKey' | 'mutationFn'
  >,
) =>
  useMutation({
    mutationKey: accountQueryKeys.deleteAccountApproval(),
    mutationFn: ({ accountId }: RejectTeacherAccountVariables) =>
      del<void>(accountUrl.deleteAccountApproval(accountId)),
    ...options,
  });
