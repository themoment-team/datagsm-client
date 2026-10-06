import { clubQueryKeys, clubUrl, get } from '@repo/shared/api';
import type { ClubStatus, PublicClubListResponse } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { useQuery } from '@tanstack/react-query';

interface UseGetMajorClubsOptions {
  enabled?: boolean;
  /** 넘기지 않으면 폐지된 동아리까지 모두 조회한다. */
  status?: ClubStatus;
}

/** 신청 폼의 동아리 선택지와 공개 목록의 동아리 필터에 함께 쓰는 전공 동아리 목록. */
export const useGetMajorClubs = ({ enabled = true, status }: UseGetMajorClubsOptions = {}) =>
  useQuery({
    queryKey: clubQueryKeys.getPublicClubs('MAJOR_CLUB', status),
    queryFn: () =>
      // 비로그인 상태에서도 호출되는 공개 API라 401에도 토큰 갱신·리다이렉트를 건너뛴다.
      get<PublicClubListResponse>(clubUrl.getPublicClubs('MAJOR_CLUB', status), {
        skipAuthRefresh: true,
      }),
    enabled,
    staleTime: minutesToMs(10),
    gcTime: minutesToMs(30),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
