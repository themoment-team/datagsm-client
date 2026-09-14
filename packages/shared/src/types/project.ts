import { ApiResponse, Club, ClubMember } from '@repo/shared/types';

export type ProjectStatus = 'ACTIVE' | 'ENDED';

export interface Project {
  id: number;
  name: string;
  description: string;
  startYear: number;
  endYear: number | null;
  status: ProjectStatus;
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
