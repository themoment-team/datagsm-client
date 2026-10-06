import { ApiResponse, StudentMajor, StudentSex } from '@repo/shared/types';

export type ClubType = 'MAJOR_CLUB' | 'AUTONOMOUS_CLUB';
export type ClubStatus = 'ACTIVE' | 'ABOLISHED';

export interface ClubMember {
  id: number;
  name: string;
  email: string;
  studentNumber: number;
  major: StudentMajor;
  sex: StudentSex;
}

export interface Club {
  id: number;
  name: string;
  type: ClubType;
  status: ClubStatus;
  foundedYear: number;
  abolishedYear?: number | null;
  leader: ClubMember | null;
  participants: ClubMember[];
}

export interface ClubListData {
  totalPages: number;
  totalElements: number;
  clubs: Club[];
}

export type ClubListResponse = ApiResponse<ClubListData>;

/** 공개 조회용 동아리 — 부원 정보 없이 선택지에 필요한 값만 내려온다 */
export interface ClubSummary {
  id: number;
  name: string;
  type: ClubType;
}

export interface PublicClubListData {
  clubs: ClubSummary[];
}

export type PublicClubListResponse = ApiResponse<PublicClubListData>;
