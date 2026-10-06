import { get, studentQueryKeys, studentUrl } from '@repo/shared/api';
import type { ParticipantCandidateListResponse } from '@repo/shared/types';
import { minutesToMs } from '@repo/shared/utils';
import { useQuery } from '@tanstack/react-query';

interface UseGetParticipantCandidatesOptions {
  enabled?: boolean;
}

/** 참여자로 고를 수 있는 재학생 전체. 검색 파라미터가 없어 이름·학번 검색은 화면에서 처리한다. */
export const useGetParticipantCandidates = ({
  enabled = true,
}: UseGetParticipantCandidatesOptions = {}) =>
  useQuery({
    queryKey: studentQueryKeys.getParticipantCandidates(),
    queryFn: () => get<ParticipantCandidateListResponse>(studentUrl.getParticipantCandidates()),
    enabled,
    staleTime: minutesToMs(10),
    gcTime: minutesToMs(30),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
