import { UserRoleType } from '../types/userRole';

export const studentQueryKeys = {
  putStudentById: () => ['students', 'update'] as const,
  getStudents: (
    page?: number,
    size?: number,
    grade?: number,
    classNum?: number,
    sex?: string,
    role?: string,
    includeGraduates?: boolean,
    includeWithdrawn?: boolean,
    onlyEnrolled?: boolean,
    sortBy?: string,
    name?: string,
  ) =>
    [
      'students',
      'list',
      {
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
      },
    ] as const,
  postStudent: () => ['students', 'create'] as const,
  patchStudentStatus: () => ['students', 'status', 'update'] as const,
  postStudentBatchOperation: () => ['students', 'batch-operations'] as const,
  postStudentImport: () => ['students', 'imports'] as const,
  getStudentExport: () => ['students', 'exports', 'excel'] as const,
  postGraduateThirdGrade: () => ['students', 'graduate', 'third-grade'] as const,
  patchMySpecialty: () => ['students', 'me', 'specialty', 'update'] as const,
  patchMyGithubId: () => ['students', 'me', 'github-id', 'update'] as const,
} as const;

export const authQueryKeys = {
  getApiKey: () => ['auth', 'api-keys', 'my', 'get'] as const,
  putApiKey: () => ['auth', 'api-keys', 'my', 'update'] as const,
  postApiKey: () => ['auth', 'api-keys', 'my', 'create'] as const,
  postRotateApiKey: () => ['auth', 'api-keys', 'my', 'rotate'] as const,
  deleteApiKey: () => ['auth', 'api-keys', 'my', 'delete'] as const,
  getApiKeys: (params: {
    page?: number;
    size?: number;
    id?: number;
    accountId?: number;
    scope?: string;
    isExpired?: boolean;
    isRenewable?: boolean;
  }) => ['auth', 'api-keys', 'list', params] as const,
  getApiScope: (scopeName: string) => ['auth', 'api-keys', 'scopes', scopeName] as const,
  getAvailableScope: (userRole: UserRoleType) =>
    ['auth', 'api-keys', 'available-scopes', userRole] as const,
  deleteApiKeyById: () => ['auth', 'api-keys', 'delete'] as const,
  patchApiKeyExpirationById: () => ['auth', 'api-keys', 'expiration', 'update'] as const,
} as const;

export const projectQueryKeys = {
  putProjectById: () => ['projects', 'update'] as const,
  deleteProjectById: () => ['projects', 'delete'] as const,
  postProjectEndById: () => ['projects', 'end'] as const,
  postProjectReactivateById: () => ['projects', 'reactivate'] as const,
  getProjects: (params: {
    page?: number;
    size?: number;
    projectName?: string;
    clubId?: number;
    status?: string;
  }) =>
    ['projects', 'list', params] as const,
  postProject: () => ['projects', 'create'] as const,
} as const;

export const clubQueryKeys = {
  putClubById: () => ['clubs', 'update'] as const,
  deleteClubById: () => ['clubs', 'delete'] as const,
  getClubs: (page?: number, size?: number, type?: string, clubName?: string, status?: string) =>
    ['clubs', 'list', { page, size, type, clubName, status }] as const,
  postClub: () => ['clubs', 'create'] as const,
  postClubImport: () => ['clubs', 'imports'] as const,
  getClubExport: () => ['clubs', 'exports', 'excel'] as const,
} as const;

export const clientQueryKeys = {
  getClientsSearch: (page?: number, size?: number, clientName?: string) =>
    ['clients', 'search', { page, size, clientName }] as const,
  postClient: () => ['clients', 'create'] as const,
  deleteClientById: () => ['clients', 'delete'] as const,
  patchClientById: () => ['clients', 'update'] as const,
  getClients: (page?: number, size?: number) => ['clients', 'my', { page, size }] as const,
  getAvailableScopes: () => ['clients', 'available-scopes'] as const,
} as const;

export const applicationQueryKeys = {
  getApplications: (params: { page?: number; size?: number; name?: string; id?: string }) =>
    ['applications', 'list', params] as const,
  postApplication: () => ['applications', 'create'] as const,
  deleteApplicationById: () => ['applications', 'delete'] as const,
  patchApplication: () => ['applications', 'update'] as const,
  patchApplicationScope: () => ['applications', 'scopes', 'update'] as const,
  deleteApplicationScope: () => ['applications', 'scopes', 'delete'] as const,
  postApplicationScope: () => ['applications', 'scopes', 'create'] as const,
} as const;

export const eventQueryKeys = {
  getEvents: () => ['events', 'my'] as const,
  postEvent: () => ['events', 'create'] as const,
  patchEvent: () => ['events', 'update'] as const,
  deleteEvent: () => ['events', 'delete'] as const,
} as const;

export const healthQueryKeys = {
  getHealth: () => ['health', 'check'] as const,
} as const;

export const accountQueryKeys = {
  postEmailVerification: () => ['accounts', 'email-verifications'] as const,
  postEmailVerificationVerify: () => ['accounts', 'email-verifications', 'verify'] as const,
  postAccount: () => ['accounts', 'create'] as const,
  getMy: () => ['accounts', 'my'] as const,
  deleteMy: () => ['accounts', 'delete'] as const,
  postPasswordReset: () => ['accounts', 'password-resets'] as const,
  postPasswordResetVerification: () => ['accounts', 'password-resets', 'verification'] as const,
  putPassword: () => ['accounts', 'password', 'update'] as const,
} as const;

export const oauthQueryKeys = {
  getOAuthSession: (token: string) => ['oauth', 'session', token] as const,
  postOAuthTokenRefresh: () => ['oauth', 'token', 'refresh'] as const,
  postOAuthToken: () => ['oauth', 'token'] as const,
  postOAuthCode: () => ['oauth', 'code'] as const,
} as const;
