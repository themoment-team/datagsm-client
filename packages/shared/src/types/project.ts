import { ApiResponse, Club, ClubMember, StudentMajor } from '@repo/shared/types';

export type ProjectStatus = 'ACTIVE' | 'ENDED';
export type ProjectRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type ProjectParticipantRole = 'OWNER' | 'PARTICIPANT';
export type ProjectSortBy = 'ID' | 'NAME';
export type ProjectSortDirection = 'ASC' | 'DESC';

/** 어드민이 직접 관리하는 공식 승인본 프로젝트 */
export interface Project {
  id: number;
  name: string;
  description: string;
  startYear: number;
  endYear: number | null;
  status: ProjectStatus;
  iconUrl?: string | null;
  club: Club | null;
  participants: ClubMember[];
  repositories: string[];
  techStacks: string[];
}

export interface ProjectListData {
  totalPages: number;
  totalElements: number;
  projects: Project[];
}

export type ProjectListResponse = ApiResponse<ProjectListData>;

export interface ProjectQueryParams {
  projectId?: number;
  projectName?: string;
  clubId?: number;
  status?: ProjectStatus;
  page: number;
  size: number;
}

/* -------------------------------------------------------------------------- */
/* 공개 조회 (인증 불필요) — 참여자는 이름·학과만 노출                         */
/* -------------------------------------------------------------------------- */

export interface PublicParticipant {
  name: string;
  major: StudentMajor;
}

export interface PublicProject {
  id: number;
  name: string;
  description: string;
  startYear: number;
  endYear: number | null;
  status: ProjectStatus;
  iconUrl: string | null;
  club: Club | null;
  participants: PublicParticipant[];
  repositories: string[];
  techStacks: string[];
}

export interface PublicProjectListData {
  totalPages: number;
  totalElements: number;
  projects: PublicProject[];
}

export type PublicProjectListResponse = ApiResponse<PublicProjectListData>;
export type PublicProjectResponse = ApiResponse<PublicProject>;

export interface PublicProjectQueryParams {
  projectName?: string;
  clubId?: number;
  status?: ProjectStatus;
  page?: number;
  size?: number;
  sortBy?: ProjectSortBy;
  sortDirection?: ProjectSortDirection;
}

/* -------------------------------------------------------------------------- */
/* 학생 — 내 프로젝트 목록 (신청했거나 참여자로 등록된 프로젝트)               */
/* -------------------------------------------------------------------------- */

export interface MyProject {
  projectId: number | null;
  requestId: number | null;
  requestStatus: ProjectRequestStatus;
  rejectReason: string | null;
  role: ProjectParticipantRole;
  name: string;
  description: string;
  startYear: number;
  endYear: number | null;
  status: ProjectStatus | null;
  iconUrl: string | null;
  club: Club | null;
  participants: ClubMember[];
  repositories: string[];
  techStacks: string[];
}

export interface MyProjectListData {
  totalElements: number;
  projects: MyProject[];
}

export type MyProjectListResponse = ApiResponse<MyProjectListData>;

/* -------------------------------------------------------------------------- */
/* 신청 / 수정 요청                                                            */
/* -------------------------------------------------------------------------- */

/** 신규 신청(POST)·수정 신청(PUT) 공통 요청 바디 */
export interface ProjectRequestBody {
  name: string;
  description: string;
  startYear: number;
  /** 무소속은 0 또는 생략 */
  clubId?: number;
  participantIds?: number[];
  repositories?: string[];
  techStacks?: string[];
  iconKey?: string;
}

/** 신청/수정 제안 스냅샷 (ProjectEditRequestResDto) */
export interface ProjectEditRequest {
  id: number;
  /** null이면 신규 생성 신청, 값이 있으면 해당 프로젝트 수정 신청 */
  originalProjectId: number | null;
  requestedBy: ClubMember;
  name: string;
  description: string;
  startYear: number;
  iconUrl: string | null;
  club: Club | null;
  participants: ClubMember[];
  repositories: string[];
  techStacks: string[];
  requestStatus: ProjectRequestStatus;
  rejectReason: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export type ProjectEditRequestResponse = ApiResponse<ProjectEditRequest>;

export interface ProjectRequestListData {
  totalPages: number;
  totalElements: number;
  requests: ProjectEditRequest[];
}

export type ProjectRequestListResponse = ApiResponse<ProjectRequestListData>;

export interface ProjectRequestListQueryParams {
  requestStatus?: ProjectRequestStatus;
  page?: number;
  size?: number;
}

/** 어드민 거절 사유 바디 */
export interface ProjectRejectBody {
  reason: string;
}

/* -------------------------------------------------------------------------- */
/* 아이콘 업로드 (presigned URL)                                              */
/* -------------------------------------------------------------------------- */

export type ProjectIconContentType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

export interface IconUploadUrlBody {
  contentType: ProjectIconContentType;
  /** 최대 5,242,880 (5MB) */
  contentLength: number;
}

export interface IconUploadUrlData {
  uploadUrl: string;
  iconKey: string;
  expiresInSeconds: number;
}

export type IconUploadUrlResponse = ApiResponse<IconUploadUrlData>;
