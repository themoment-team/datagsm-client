export interface EventTypeOption {
  value: string;
  label: string;
  description: string;
}

export const EVENT_TYPES: EventTypeOption[] = [
  { value: 'STUDENT_UPDATED', label: 'student.updated', description: '학생 정보 업데이트' },
  { value: 'CLUB_UPDATED', label: 'club.updated', description: '동아리 정보 업데이트' },
  { value: 'PROJECT_UPDATED', label: 'project.updated', description: '프로젝트 정보 업데이트' },
];

export const MAX_EVENTS_PER_ACCOUNT = 10;
