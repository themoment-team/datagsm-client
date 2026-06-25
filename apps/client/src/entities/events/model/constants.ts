export interface EventTypeOption {
  value: string;
  label: string;
  description: string;
}

export const EVENT_TYPES: EventTypeOption[] = [
  { value: 'STUDENT_UPDATED', label: 'student.updated', description: '학생 정보 변경 (수정·졸업·자퇴 등)' },
  { value: 'CLUB_UPDATED', label: 'club.updated', description: '동아리 변경 (생성·수정·삭제)' },
  { value: 'PROJECT_UPDATED', label: 'project.updated', description: '프로젝트 변경 (생성·수정·삭제)' },
];

export const MAX_EVENTS_PER_ACCOUNT = 10;
