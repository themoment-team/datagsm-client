import { clubQueryKeys, clubUrl, get } from '@repo/shared/api';
import type { ClubListResponse } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { useQuery } from '@tanstack/react-query';

const MAJOR_CLUB_PAGE_SIZE = 100;

interface UseGetMajorClubsOptions {
  enabled?: boolean;
  /** 공개 페이지에서 쓸 때 401에도 토큰 갱신·리다이렉트를 건너뛴다. */
  skipAuthRefresh?: boolean;
}

/** 신청 폼의 동아리 선택지와 공개 목록의 동아리 필터에 함께 쓰는 전공 동아리 목록. */
export const useGetMajorClubs = ({
  enabled = true,
  skipAuthRefresh = false,
}: UseGetMajorClubsOptions = {}) =>
  useQuery({
    queryKey: clubQueryKeys.getClubs(0, MAJOR_CLUB_PAGE_SIZE, 'MAJOR_CLUB'),
    queryFn: () =>
      get<ClubListResponse>(clubUrl.getClubs(0, MAJOR_CLUB_PAGE_SIZE, 'MAJOR_CLUB'), {
        skipAuthRefresh,
      }),
    enabled,
    staleTime: minutesToMs(10),
    gcTime: minutesToMs(30),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
