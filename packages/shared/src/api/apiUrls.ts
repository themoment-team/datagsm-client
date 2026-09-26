import {
  ClubType,
  ProjectRequestStatus,
  ProjectStatus,
  StudentRole,
  StudentSex,
} from '@repo/shared/types';

import { AccountObjectType, AccountSortBy, AccountStatus } from '../types/account';
import { UserRoleType } from '../types/userRole';
import { buildQuery } from './buildQuery';

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
    return `/v1/students${buildQuery({
      page,
      size,
      grade,
      classNum,
      sex,
      role,
      includeGraduates,
      includeWithdrawn,
      onlyEnrolled,
      sortBy,
      name,
    })}`;
  },
  postStudent: () => '/v1/students',
  patchStudentStatus: (studentId: number) => `/v1/students/${studentId}/status`,
  postStudentBatchOperation: () => '/v1/students/batch-operations',
  postStudentImport: () => '/v1/students/imports',
  getStudentExport: () => '/v1/students/exports/excel',
  postGraduateThirdGrade: () => '/v1/students/graduate/third-grade',
  postStudentDataEditRequests: () => '/v1/students/data-edit-requests',
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
    return `/v1/auth/api-keys${buildQuery({
      page: params.page,
      size: params.size,
      id: params.id,
      accountId: params.accountId,
      scope: params.scope,
      isExpired: params.isExpired,
      isRenewable: params.isRenewable,
    })}`;
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
    return `/v1/projects${buildQuery({
      page: params.page,
      size: params.size,
      projectName: params.projectName,
      clubId: params.clubId,
      status: params.status,
    })}`;
  },
  postProject: () => '/v1/projects',
} as const;

export const publicProjectUrl = {
  getPublicProjects: (params: {
    projectName?: string;
    clubId?: number;
    status?: ProjectStatus;
    page?: number;
    size?: number;
    sortBy?: 'ID' | 'NAME';
    sortDirection?: 'ASC' | 'DESC';
  }) => {
    const urlParams = new URLSearchParams();

    if (params.projectName) urlParams.append('projectName', params.projectName);
    if (params.clubId !== undefined) urlParams.append('clubId', params.clubId.toString());
    if (params.status !== undefined) urlParams.append('status', params.status);
    if (params.page !== undefined) urlParams.append('page', params.page.toString());
    if (params.size !== undefined) urlParams.append('size', params.size.toString());
    if (params.sortBy !== undefined) urlParams.append('sortBy', params.sortBy);
    if (params.sortDirection !== undefined)
      urlParams.append('sortDirection', params.sortDirection);

    const queryString = urlParams.toString();
    return queryString ? `/v1/public/projects?${queryString}` : '/v1/public/projects';
  },
  getPublicProjectById: (projectId: number) => `/v1/public/projects/${projectId}`,
} as const;

export const meProjectUrl = {
  getMyProjects: (requestStatus?: ProjectRequestStatus) => {
    const params = new URLSearchParams();

    if (requestStatus !== undefined) params.append('requestStatus', requestStatus);

    const queryString = params.toString();
    return queryString ? `/v1/students/me/projects?${queryString}` : '/v1/students/me/projects';
  },
  postMyProject: () => '/v1/students/me/projects',
  putMyProject: (projectId: number) => `/v1/students/me/projects/${projectId}`,
  postIconUploadUrl: () => '/v1/students/me/projects/icons/upload-url',
} as const;

export const projectRequestUrl = {
  getProjectRequests: (params: {
    requestStatus?: ProjectRequestStatus;
    page?: number;
    size?: number;
  }) => {
    const urlParams = new URLSearchParams();

    if (params.requestStatus !== undefined)
      urlParams.append('requestStatus', params.requestStatus);
    if (params.page !== undefined) urlParams.append('page', params.page.toString());
    if (params.size !== undefined) urlParams.append('size', params.size.toString());

    const queryString = urlParams.toString();
    return queryString ? `/v1/projects/requests?${queryString}` : '/v1/projects/requests';
  },
  getProjectRequestById: (requestId: number) => `/v1/projects/requests/${requestId}`,
  postAcceptProjectRequest: (requestId: number) => `/v1/projects/requests/${requestId}/accept`,
  postRejectProjectRequest: (requestId: number) => `/v1/projects/requests/${requestId}/reject`,
} as const;

export const clubUrl = {
  putClubById: (clubId: number) => `/v1/clubs/${clubId}`,
  deleteClubById: (clubId: number) => `/v1/clubs/${clubId}`,
  getClubs: (page?: number, size?: number, type?: ClubType, clubName?: string, status?: string) => {
    return `/v1/clubs${buildQuery({ page, size, clubType: type, clubName, clubStatus: status })}`;
  },
  postClub: () => '/v1/clubs',
  postClubImport: () => '/v1/clubs/imports',
  getClubExport: () => '/v1/clubs/exports/excel',
} as const;

export const clientUrl = {
  getClientsSearch: (page?: number, size?: number, clientName?: string) => {
    return `/v1/clients${buildQuery({ clientName, page, size })}`;
  },
  postClient: () => '/v1/clients',
  deleteClientById: (clientId: string) => `/v1/clients/${clientId}`,
  patchClientById: (clientId: string) => `/v1/clients/${clientId}`,
  getClients: (page?: number, size?: number) => {
    return `/v1/clients/my${buildQuery({ page, size })}`;
  },
  getAvailableScopes: () => '/v1/clients/available-scopes',
} as const;

export const applicationUrl = {
  getApplications: (params: { page?: number; size?: number; name?: string; id?: string }) => {
    return `/v1/applications${buildQuery({
      page: params.page,
      size: params.size,
      name: params.name,
      id: params.id,
    })}`;
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
  getAccounts: (params: {
    page?: number;
    size?: number;
    email?: string;
    role?: UserRoleType;
    objectType?: AccountObjectType;
    status?: AccountStatus;
    sortBy?: AccountSortBy;
  }) => {
    return `/v1/accounts${buildQuery({
      page: params.page,
      size: params.size,
      email: params.email,
      role: params.role,
      objectType: params.objectType,
      status: params.status,
      sortBy: params.sortBy,
    })}`;
  },
  patchAccountRole: (accountId: number) => `/v1/accounts/${accountId}/role`,
  patchAccountApproval: (accountId: number) => `/v1/accounts/${accountId}/approval`,
} as const;

export const oauthUrl = {
  getOAuthSession: (token: string) => `/v1/oauth/sessions/${token}`,
  postOAuthCode: () => '/v1/oauth/code',
  postOAuthTokenRefresh: () => '/v1/oauth/token', // 토큰 갱신 (통합 엔드포인트)
  postAuthorizeConsent: () => '/v1/oauth/authorize/consent',
  postLogout: () => '/v1/oauth/logout',
  getIdpSessions: () => '/v1/oauth/idp-sessions',
  deleteIdpSession: (sessionId: string) => `/v1/oauth/idp-sessions/${sessionId}`,
} as const;
