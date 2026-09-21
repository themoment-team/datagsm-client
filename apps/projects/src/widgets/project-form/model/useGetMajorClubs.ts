import { clubQueryKeys, clubUrl, get } from '@repo/shared/api';
import type { ClubListResponse } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { useQuery } from '@tanstack/react-query';

const MAJOR_CLUB_PAGE_SIZE = 100;

/** 신청 폼의 동아리 선택지에 쓸 전공 동아리 목록. */
export const useGetMajorClubs = (enabled = true) =>
  useQuery({
    queryKey: clubQueryKeys.getClubs(0, MAJOR_CLUB_PAGE_SIZE, 'MAJOR_CLUB'),
    queryFn: () =>
      get<ClubListResponse>(clubUrl.getClubs(0, MAJOR_CLUB_PAGE_SIZE, 'MAJOR_CLUB')),
    enabled,
    staleTime: minutesToMs(10),
    gcTime: minutesToMs(30),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
