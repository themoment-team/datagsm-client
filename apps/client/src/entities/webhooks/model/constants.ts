export interface WebhookEventOption {
  value: string;
  label: string;
  description: string;
}

export const WEBHOOK_EVENTS: WebhookEventOption[] = [
  { value: 'STUDENT_GRADUATED', label: 'student.graduated', description: '학생 졸업 처리' },
  { value: 'STUDENT_WITHDRAWN', label: 'student.withdrawn', description: '학생 자퇴 처리' },
  {
    value: 'STUDENT_STATUS_CHANGED',
    label: 'student.status_changed',
    description: '학생 상태 변경',
  },
  { value: 'CLUB_CREATED', label: 'club.created', description: '동아리 생성' },
  { value: 'CLUB_UPDATED', label: 'club.updated', description: '동아리 정보 수정' },
  { value: 'CLUB_DELETED', label: 'club.deleted', description: '동아리 삭제' },
  { value: 'PROJECT_CREATED', label: 'project.created', description: '프로젝트 생성' },
  { value: 'PROJECT_UPDATED', label: 'project.updated', description: '프로젝트 수정' },
  { value: 'PROJECT_DELETED', label: 'project.deleted', description: '프로젝트 삭제' },
];

export const MAX_WEBHOOKS_PER_ACCOUNT = 10;
