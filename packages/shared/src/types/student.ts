import { ApiResponse, Club } from '@repo/shared/types';

export type StudentSex = 'MAN' | 'WOMAN';

export type StudentMajor = 'SW_DEVELOPMENT' | 'SMART_IOT' | 'AI';

export type StudentRole =
  | 'GENERAL_STUDENT'
  | 'STUDENT_COUNCIL'
  | 'DORMITORY_MANAGER'
  | 'GRADUATE'
  | 'WITHDRAWN';

export interface Student {
  id: number;
  name: string;
  sex: StudentSex;
  email: string;
  grade: number;
  classNum: number;
  number: number;
  studentNumber: number;
  major: StudentMajor;
  specialty: string | null;
  githubId: string | null;
  githubUrl: string | null;
  role: StudentRole;
  dormitoryFloor: number;
  dormitoryRoom: number;
  majorClub: Club | null;
  autonomousClub: Club | null;
}

export interface StudentListData {
  totalPages: number;
  totalElements: number;
  students: Student[];
}

export type StudentListResponse = ApiResponse<StudentListData>;

/** 프로젝트 참여자로 선택할 수 있는 재학생 — 동명이인 구분에 필요한 값만 내려온다 */
export interface ParticipantCandidate {
  id: number;
  name: string;
  studentNumber: number | null;
  major: StudentMajor | null;
}

export interface ParticipantCandidateListData {
  students: ParticipantCandidate[];
}

export type ParticipantCandidateListResponse = ApiResponse<ParticipantCandidateListData>;
