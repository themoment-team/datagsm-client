import { accountQueryKeys, accountUrl, get } from '@repo/shared/api';
import type { MyAccountResponse } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

/** 로그인한 계정 정보. role(USER/ADMIN/ROOT) 기반 접근 제어에 쓴다. */
export const useGetMe = (
  options?: Omit<UseQueryOptions<MyAccountResponse>, 'queryKey' | 'queryFn'>,
) =>
  useQuery({
    queryKey: accountQueryKeys.getMy(),
    queryFn: () => get<MyAccountResponse>(accountUrl.getMy()),
    staleTime: minutesToMs(5),
    gcTime: minutesToMs(10),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });
