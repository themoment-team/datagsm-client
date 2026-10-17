import { accountQueryKeys, accountUrl, get } from '@repo/shared/api';
import type { MyAccountResponse } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { useQuery } from '@tanstack/react-query';

interface UseGetMyStudentOptions {
  enabled?: boolean;
}

/** 로그인한 계정에 연결된 학생 정보. 교사 등 학생이 아닌 계정이면 null이다. */
export const useGetMyStudent = ({ enabled = true }: UseGetMyStudentOptions = {}) =>
  useQuery({
    queryKey: accountQueryKeys.getMy(),
    queryFn: () => get<MyAccountResponse>(accountUrl.getMy()),
    select: (response) => response.data.student ?? null,
    enabled,
    staleTime: minutesToMs(10),
    gcTime: minutesToMs(30),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
