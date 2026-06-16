import { ClubType, StudentRole, StudentSex } from '@repo/shared/types';

import { UserRoleType } from '../types/userRole';

export const studentUrl = {
  putStudentById: (studentId: number) => `/v1/students/${studentId}`,
  getStudents: (
    page?: number,
    size?: number,
    grade?: number,
    classNum?: number,
    sex?: StudentSex,
    role?: StudentRole,
    includeGraduates?: boolean,
    includeWithdrawn?: boolean,
    onlyEnrolled?: boolean,
    sortBy?: string,
    name?: string,
  ) => {
    const params = new URLSearchParams();

    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());
    if (grade !== undefined) params.append('grade', grade.toString());
    if (classNum !== undefined) params.append('classNum', classNum.toString());
    if (sex !== undefined) params.append('sex', sex);
    if (role !== undefined) params.append('role', role);
    if (includeGraduates !== undefined)
      params.append('includeGraduates', includeGraduates.toString());
    if (includeWithdrawn !== undefined)
      params.append('includeWithdrawn', includeWithdrawn.toString());
    if (onlyEnrolled !== undefined) params.append('onlyEnrolled', onlyEnrolled.toString());
    if (sortBy !== undefined) params.append('sortBy', sortBy);
    if (name !== undefined) params.append('name', name);

    return `/v1/students?${params.toString()}`;
  },
  postStudent: () => '/v1/students',
  patchStudentStatus: (studentId: number) => `/v1/students/${studentId}/status`,
  postStudentBatchOperation: () => '/v1/students/batch-operations',
  postStudentImport: () => '/v1/students/imports',
  getStudentExport: () => '/v1/students/exports/excel',
  postGraduateThirdGrade: () => '/v1/students/graduate/third-grade',
  patchMySpecialty: () => '/v1/students/me/specialty',
  patchMyGithubId: () => '/v1/students/me/github-id',
} as const;

export const authUrl = {
  getApiKey: () => '/v1/auth/api-keys/my',
  putApiKey: () => '/v1/auth/api-keys/my',
  postApiKey: () => '/v1/auth/api-keys/my',
  postRotateApiKey: () => '/v1/auth/api-keys/my/rotations',
  deleteApiKey: () => '/v1/auth/api-keys/my',
  getApiKeys: (params: {
    page?: number;
    size?: number;
    id?: number;
    accountId?: number;
    scope?: string;
    isExpired?: boolean;
    isRenewable?: boolean;
  }) => {
    const urlParams = new URLSearchParams();

    if (params.page !== undefined) urlParams.append('page', params.page.toString());
    if (params.size !== undefined) urlParams.append('size', params.size.toString());
    if (params.id !== undefined) urlParams.append('id', params.id.toString());
    if (params.accountId !== undefined) urlParams.append('accountId', params.accountId.toString());
    if (params.scope) urlParams.append('scope', params.scope);
    if (params.isExpired !== undefined) urlParams.append('isExpired', params.isExpired.toString());
    if (params.isRenewable !== undefined)
      urlParams.append('isRenewable', params.isRenewable.toString());

    const queryString = urlParams.toString();
    return queryString ? `/v1/auth/api-keys?${queryString}` : '/v1/auth/api-keys';
  },
  getApiScope: (scopeName: string) => `/v1/auth/api-keys/scopes/${scopeName}`,
  getAvailableScope: (userRole: UserRoleType) =>
    `/v1/auth/api-keys/available-scopes?role=${userRole}`,
  deleteApiKeyById: (apiKeyId: number) => `/v1/auth/api-keys/${apiKeyId}`,
  patchApiKeyExpirationById: (apiKeyId: number) => `/v1/auth/api-keys/${apiKeyId}/expiration`,
} as const;

export const projectUrl = {
  putProjectById: (projectId: number) => `/v1/projects/${projectId}`,
  deleteProjectById: (projectId: number) => `/v1/projects/${projectId}`,
  postProjectEndById: (projectId: number) => `/v1/projects/${projectId}/end`,
  postProjectReactivateById: (projectId: number) => `/v1/projects/${projectId}/reactivate`,
  getProjects: (params: {
    page?: number;
    size?: number;
    projectName?: string;
    clubId?: number;
    status?: 'ACTIVE' | 'ENDED';
  }) => {
    const urlParams = new URLSearchParams();

    if (params.page !== undefined) urlParams.append('page', params.page.toString());
    if (params.size !== undefined) urlParams.append('size', params.size.toString());
    if (params.projectName) urlParams.append('projectName', params.projectName);
    if (params.clubId !== undefined) urlParams.append('clubId', params.clubId.toString());
    if (params.status !== undefined) urlParams.append('status', params.status);

    const queryString = urlParams.toString();
    return queryString ? `/v1/projects?${queryString}` : '/v1/projects';
  },
  postProject: () => '/v1/projects',
} as const;

export const clubUrl = {
  putClubById: (clubId: number) => `/v1/clubs/${clubId}`,
  deleteClubById: (clubId: number) => `/v1/clubs/${clubId}`,
  getClubs: (page?: number, size?: number, type?: ClubType, clubName?: string, status?: string) => {
    const params = new URLSearchParams();

    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());
    if (type != null) params.append('clubType', type);
    if (clubName !== undefined) params.append('clubName', clubName);
    if (status !== undefined) params.append('clubStatus', status);

    const queryString = params.toString();
    return queryString ? `/v1/clubs?${queryString}` : '/v1/clubs';
  },
  postClub: () => '/v1/clubs',
  postClubImport: () => '/v1/clubs/imports',
  getClubExport: () => '/v1/clubs/exports/excel',
} as const;

export const clientUrl = {
  getClientsSearch: (page?: number, size?: number, clientName?: string) => {
    const params = new URLSearchParams();

    if (clientName !== undefined) params.append('clientName', clientName);
    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());

    const queryString = params.toString();
    return queryString ? `/v1/clients?${queryString}` : '/v1/clients';
  },
  postClient: () => '/v1/clients',
  deleteClientById: (clientId: string) => `/v1/clients/${clientId}`,
  patchClientById: (clientId: string) => `/v1/clients/${clientId}`,
  getClients: (page?: number, size?: number) => {
    const params = new URLSearchParams();

    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());

    const queryString = params.toString();
    return queryString ? `/v1/clients/my?${queryString}` : '/v1/clients/my';
  },
  getAvailableScopes: () => '/v1/clients/available-scopes',
} as const;

export const applicationUrl = {
  getApplications: (params: { page?: number; size?: number; name?: string; id?: string }) => {
    const urlParams = new URLSearchParams();

    if (params.page !== undefined) urlParams.append('page', params.page.toString());
    if (params.size !== undefined) urlParams.append('size', params.size.toString());
    if (params.name) urlParams.append('name', params.name);
    if (params.id) urlParams.append('id', params.id);

    const queryString = urlParams.toString();
    return queryString ? `/v1/applications?${queryString}` : '/v1/applications';
  },
  postApplication: () => '/v1/applications',
  deleteApplicationById: (id: string) => `/v1/applications/${id}`,
  patchApplication: (id: string) => `/v1/applications/${id}`,
  patchApplicationScope: (applicationId: string, scopeId: number) =>
    `/v1/applications/${applicationId}/scopes/${scopeId}`,
  deleteApplicationScope: (applicationId: string, scopeId: number) =>
    `/v1/applications/${applicationId}/scopes/${scopeId}`,
  postApplicationScope: (applicationId: string) => `/v1/applications/${applicationId}/scopes`,
} as const;

export const eventUrl = {
  getEvents: () => '/v1/events',
  postEvent: () => '/v1/events',
  patchEvent: (eventId: number) => `/v1/events/${eventId}`,
  deleteEvent: (eventId: number) => `/v1/events/${eventId}`,
} as const;

export const healthUrl = {
  getHealth: () => '/v1/health',
} as const;

export const accountUrl = {
  postEmailVerification: () => '/v1/accounts/email-verifications',
  postEmailVerificationVerify: () => '/v1/accounts/email-verifications/verify',
  postAccount: () => '/v1/accounts',
  getMy: () => '/v1/accounts/my',
  deleteMy: () => '/v1/accounts/my',
  postPasswordReset: () => '/v1/accounts/password-resets', // 비밀번호 재설정 요청 (이메일 발송)
  postPasswordResetVerification: () => '/v1/accounts/password-resets/verification', // 비밀번호 재설정 코드 검증
  putPassword: () => '/v1/accounts/password', // 비밀번호 변경 (인증된 사용자)
} as const;

export const oauthUrl = {
  getOAuthSession: (token: string) => `/v1/oauth/sessions/${token}`,
  postOAuthCode: () => '/v1/oauth/code',
  postOAuthToken: () => '/oauth/token', // Next.js Route Handler (client_secret 숨김)
  postOAuthTokenRefresh: () => '/v1/oauth/token', // 토큰 갱신 (통합 엔드포인트)
} as const;
