import { z } from 'zod';

import { AccountObjectType, AccountStatus } from './account';
import { ApiResponse } from './base';
import { Student } from './student';
import { Teacher } from './teacher';
import { UserRoleType } from './userRole';

export interface Account {
  id: number;
  email: string;
  role: UserRoleType;
}

export interface MyAccount extends Account {
  status: AccountStatus;
  objectType: AccountObjectType | null;
  student?: Student;
  teacher?: Teacher;
}

export type AccountResponse = ApiResponse<Account>;

export type MyAccountResponse = ApiResponse<MyAccount>;

export interface WithdrawalRequest {
  password: string;
}

interface SignInResponseData {
  accessToken: string;
  refreshToken: string;
}

export type SignInResponse = ApiResponse<SignInResponseData>;

export const SignInFormSchema = z.object({
  email: z.string().min(1, { message: '이메일을 입력해주세요.' }),
  password: z
    .string()
    .min(1, { message: '비밀번호를 입력해주세요.' })
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, {
      message: '비밀번호는 영문과 숫자를 포함해야 합니다.',
    }),
});

export type SignInFormType = z.infer<typeof SignInFormSchema>;

export interface ApiKeyData {
  apiKey: string;
  expiresAt: string;
  expiresInDays: number;
  scopes: string[];
  description: string;
}

export type ApiKeyResponse = ApiResponse<ApiKeyData>;

export interface AvailableScopeData {
  scope: string;
  description: string;
}

export interface AvailableScopeGroupData {
  title: string;
  scopes: AvailableScopeData[];
}

export type AvailableScopeListResponse = ApiResponse<{
  list: AvailableScopeGroupData[];
}>;

export const ApiKeyFormSchema = z.object({
  scopes: z.array(z.string()).min(1, { message: '권한 범위를 최소 1개 이상 선택해주세요.' }),
  description: z.string().min(1, { message: '설명을 입력해주세요.' }),
});

export type ApiKeyFormType = z.infer<typeof ApiKeyFormSchema>;

export interface ClientAvailableScope {
  scope: string;
  description: string;
  applicationName: string;
}

export type ClientAvailableScopesResponse = ApiResponse<{
  list: ClientAvailableScope[];
}>;

export interface OAuthSessionData {
  serviceName: string;
  expiresAt: number;
  requestedScopes: ClientAvailableScope[];
}

export type OAuthSessionResponse = ApiResponse<OAuthSessionData>;

export interface OAuthCodeRequest {
  email: string;
  password: string;
  clientId: string;
  redirectUrl: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256';
}

interface OAuthCodeResponseData {
  code: string;
}

export type OAuthCodeResponse = ApiResponse<OAuthCodeResponseData>;

export interface OAuthTokenRequest {
  code: string;
  code_verifier: string;
}

interface OAuthTokenResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
}

export type OAuthTokenResponse = ApiResponse<OAuthTokenResponseData>;

export interface RefreshTokenRequest {
  grant_type: 'refresh_token';
  refresh_token: string;
}

export type RefreshTokenResponse = ApiResponse<OAuthTokenResponseData>;

export interface OAuthConsentRequest {
  token: string;
  approved: boolean;
}

export interface IdpSession {
  sessionId: string;
  userAgent: string | null;
  createdAt: string | null;
  current: boolean;
}

export type IdpSessionListResponse = ApiResponse<{
  sessions: IdpSession[];
}>;

export interface ApiKey {
  id: number;
  apiKey: string;
  expiresAt: string;
  expiresInDays: number;
  scopes: string[];
  description: string;
}

export interface ApiKeyListData {
  totalPages: number;
  totalElements: number;
  apiKeys: ApiKey[];
}

export type ApiKeyListResponse = ApiResponse<ApiKeyListData>;
