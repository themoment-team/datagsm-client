// @vitest-environment node
import { NextRequest } from 'next/server';

import { HttpResponse, http, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createOAuthCallbackHandler } from './oauthCallback';

const OAUTH_BASE_URL = 'https://oauth.test';
const TOKEN_URL = `${OAUTH_BASE_URL}/v1/oauth/token`;
const ORIGIN = 'http://localhost:3000';

const NONCE = 'nonce-1';

/** 인가를 시작할 때 만든 형식(`nonce.돌아갈경로`)의 state를 쿼리 값으로 만든다. */
const stateFor = (path: string, nonce = NONCE) => encodeURIComponent(`${nonce}.${path}`);

/** 인가를 시작한 브라우저처럼 verifier와 state nonce 쿠키를 담아 콜백을 호출한다. null이면 그 쿠키를 빼고 보낸다. */
const callback = (
  GET: ReturnType<typeof createOAuthCallbackHandler>,
  query: string,
  {
    codeVerifier = 'verifier-1',
    stateNonce = NONCE,
  }: { codeVerifier?: string | null; stateNonce?: string | null } = {},
) => {
  const request = new NextRequest(`${ORIGIN}/api/callback?${query}`);
  if (codeVerifier !== null) request.cookies.set('code_verifier', codeVerifier);
  if (stateNonce !== null) request.cookies.set('oauth_state', stateNonce);
  return GET(request);
};

const mockToken = (
  respond: () => Response = () =>
    HttpResponse.json({ access_token: 'access-1', refresh_token: 'refresh-1' }),
) => {
  const bodies: unknown[] = [];
  server.use(
    http.post(TOKEN_URL, async ({ request }) => {
      bodies.push(await request.json());
      return respond();
    }),
  );
  return bodies;
};

describe('createOAuthCallbackHandler', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_BASE_URL', OAUTH_BASE_URL);
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_CLIENT_ID', 'client-app');
    vi.stubEnv('NEXT_PUBLIC_DATAGSM_REDIRECT_URI', `${ORIGIN}/api/callback`);
  });

  describe('시크릿 없이 교환하는 클라이언트', () => {
    const GET = createOAuthCallbackHandler();

    it('code와 verifier로 토큰을 교환하고 쿠키를 심은 뒤 state 경로로 보낸다', async () => {
      const bodies = mockToken();

      const response = await callback(GET, `code=code-1&state=${stateFor('/students')}`);

      expect(bodies).toEqual([
        {
          grant_type: 'authorization_code',
          code: 'code-1',
          client_id: 'client-app',
          redirect_uri: `${ORIGIN}/api/callback`,
          code_verifier: 'verifier-1',
        },
      ]);
      expect(response.headers.get('location')).toBe(`${ORIGIN}/students`);
      expect(response.cookies.get('accessToken')).toMatchObject({
        value: 'access-1',
        maxAge: 3600,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
      expect(response.cookies.get('refreshToken')).toMatchObject({
        value: 'refresh-1',
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
      // 한 번 쓴 verifier와 state nonce는 지워, 같은 값으로 다시 콜백을 통과하지 못하게 한다.
      expect(response.cookies.get('code_verifier')?.value).toBe('');
      expect(response.cookies.get('oauth_state')?.value).toBe('');
    });

    describe('이 브라우저에서 시작한 로그인이 아니면 교환하지 않고 /로 보낸다 (로그인 CSRF)', () => {
      it.each([
        [
          'state의 nonce가 쿠키와 다르면',
          `code=code-1&state=${stateFor('/students', 'attacker-nonce')}`,
          {},
        ],
        [
          'state nonce 쿠키가 없으면',
          `code=code-1&state=${stateFor('/students')}`,
          { stateNonce: null },
        ],
        ['state에 nonce 없이 경로만 있으면', 'code=code-1&state=%2Fstudents', {}],
        ['state가 없으면', 'code=code-1', {}],
        [
          'code_verifier 쿠키가 없으면',
          `code=code-1&state=${stateFor('/students')}`,
          { codeVerifier: null },
        ],
      ])('%s', async (_, query, cookies) => {
        const bodies = mockToken();

        const response = await callback(GET, query, cookies);

        expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
        expect(bodies).toEqual([]);
        expect(response.cookies.get('accessToken')).toBeUndefined();
      });
    });

    it.each([
      ['state가 없으면', 'code=code-1'],
      ['state가 다른 호스트면', `code=code-1&state=${stateFor('//evil.com')}`],
      ['state가 절대 URL이면', `code=code-1&state=${stateFor('https://evil.com')}`],
    ])('%s /로 보낸다', async (_, query) => {
      mockToken();

      const response = await callback(GET, query);

      expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
    });

    it('state가 /\\evil.com이면 다른 호스트로 보내지 않는다', async () => {
      mockToken();

      const response = await callback(GET, `code=code-1&state=${stateFor('/\\evil.com')}`);

      expect(new URL(response.headers.get('location')!).host).toBe('localhost:3000');
    });

    describe('토큰 없이 /로 돌려보내는 경우', () => {
      it('code가 없으면 교환을 시도하지 않는다', async () => {
        const bodies = mockToken();

        const response = await callback(GET, `state=${stateFor('/students')}`);

        expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
        expect(bodies).toEqual([]);
      });

      it.each([
        'NEXT_PUBLIC_OAUTH_BASE_URL',
        'NEXT_PUBLIC_DATAGSM_CLIENT_ID',
        'NEXT_PUBLIC_DATAGSM_REDIRECT_URI',
      ])('%s가 없으면 교환을 시도하지 않는다', async (key) => {
        vi.stubEnv(key, '');
        const bodies = mockToken();

        const response = await callback(GET, `code=code-1&state=${stateFor('/students')}`);

        expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
        expect(bodies).toEqual([]);
      });

      it.each([
        ['교환이 실패하면', () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 })],
        ['refresh_token이 없으면', () => HttpResponse.json({ access_token: 'access-1' })],
        ['응답이 JSON이 아니면', () => new HttpResponse('oops', { status: 200 })],
        ['서버에 연결하지 못하면', () => HttpResponse.error()],
      ])('%s 쿠키를 심지 않는다', async (_, respond) => {
        mockToken(respond);

        const response = await callback(GET, `code=code-1&state=${stateFor('/students')}`);

        expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
        expect(response.cookies.get('accessToken')).toBeUndefined();
      });
    });

    describe('인가 서버가 error를 돌려준 경우', () => {
      const parseLocation = (response: Response) => {
        const location = new URL(response.headers.get('location')!);
        return {
          path: location.origin + location.pathname,
          params: Object.fromEntries(location.searchParams),
        };
      };

      it('동의를 거부했으면 교환하지 않고 원래 경로를 담아 로그인 취소 화면으로 보낸다', async () => {
        const bodies = mockToken();

        const response = await callback(
          GET,
          `error=access_denied&error_description=${encodeURIComponent('사용자가 접근 권한 요청을 거부했습니다.')}&state=${stateFor('/students')}`,
        );

        // /로 보내면 미들웨어가 곧바로 인가를 다시 시작해, 방금 거부한 동의 화면이 다시 뜬다.
        expect(parseLocation(response)).toEqual({
          path: `${ORIGIN}/login/canceled`,
          params: { error: 'access_denied', returnTo: '/students' },
        });
        expect(bodies).toEqual([]);
        expect(response.cookies.get('accessToken')).toBeUndefined();
        expect(response.cookies.get('refreshToken')).toBeUndefined();
      });

      it('그 외 error도 교환하지 않고, 안내 화면이 문구를 고를 수 있게 그 값을 넘긴다', async () => {
        const bodies = mockToken();

        const response = await callback(GET, `error=server_error&state=${stateFor('/students')}`);

        expect(parseLocation(response)).toEqual({
          path: `${ORIGIN}/login/canceled`,
          params: { error: 'server_error', returnTo: '/students' },
        });
        expect(bodies).toEqual([]);
      });

      it('code가 함께 와도 error가 있으면 교환하지 않는다', async () => {
        const bodies = mockToken();

        const response = await callback(
          GET,
          `code=code-1&error=access_denied&state=${stateFor('/students')}`,
        );

        expect(parseLocation(response).path).toBe(`${ORIGIN}/login/canceled`);
        expect(bodies).toEqual([]);
        expect(response.cookies.get('accessToken')).toBeUndefined();
      });

      it.each([
        ['state가 없으면', 'error=access_denied'],
        ['state가 다른 호스트면', `error=access_denied&state=${stateFor('//evil.com')}`],
        ['state가 절대 URL이면', `error=access_denied&state=${stateFor('https://evil.com')}`],
        ['state가 /\\evil.com이면', `error=access_denied&state=${stateFor('/\\evil.com')}`],
        [
          'state의 nonce가 쿠키와 다르면',
          `error=access_denied&state=${stateFor('/students', 'attacker-nonce')}`,
        ],
      ])('%s 돌아갈 경로를 /로 넘긴다', async (_, query) => {
        const response = await callback(GET, query);

        expect(parseLocation(response)).toEqual({
          path: `${ORIGIN}/login/canceled`,
          params: { error: 'access_denied', returnTo: '/' },
        });
      });
    });
  });

  describe('시크릿을 함께 보내는 클라이언트', () => {
    const GET = createOAuthCallbackHandler({ getClientSecret: () => 'client-secret' });

    it('토큰 교환에 client_secret을 함께 보낸다', async () => {
      const bodies = mockToken();

      const response = await callback(GET, `code=code-1&state=${stateFor('/students')}`);

      expect(bodies).toEqual([
        {
          grant_type: 'authorization_code',
          code: 'code-1',
          client_id: 'client-app',
          client_secret: 'client-secret',
          redirect_uri: `${ORIGIN}/api/callback`,
          code_verifier: 'verifier-1',
        },
      ]);
      expect(response.headers.get('location')).toBe(`${ORIGIN}/students`);
    });

    it('code_verifier 쿠키가 없으면 시크릿이 있어도 교환하지 않는다', async () => {
      // 시크릿 클라이언트는 서버가 PKCE를 강제하지 않을 수 있어, 공격자가 PKCE 없이 받은 code를
      // 피해자 브라우저의 콜백으로 보내면 시크릿만으로 교환이 성공할 수 있었다(#267).
      const bodies = mockToken();

      const response = await callback(GET, 'code=attacker-code&state=%2F', {
        codeVerifier: null,
        stateNonce: null,
      });

      expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
      expect(bodies).toEqual([]);
    });

    it('시크릿이 비어 있으면 교환을 시도하지 않는다', async () => {
      const bodies = mockToken();
      const handler = createOAuthCallbackHandler({ getClientSecret: () => undefined });

      const response = await callback(handler, `code=code-1&state=${stateFor('/students')}`);

      expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
      expect(bodies).toEqual([]);
    });
  });

  describe('production', () => {
    const GET = createOAuthCallbackHandler();

    const callbackWithCookies = (query: string, cookies: Record<string, string>) => {
      const request = new NextRequest(`${ORIGIN}/api/callback?${query}`);
      Object.entries(cookies).forEach(([name, value]) => request.cookies.set(name, value));
      return GET(request);
    };

    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('__Host- 접두사 쿠키로 대조해 교환하고, Secure를 붙여 지운다', async () => {
      const bodies = mockToken();

      const response = await callbackWithCookies(`code=code-1&state=${stateFor('/students')}`, {
        '__Host-code_verifier': 'verifier-1',
        '__Host-oauth_state': NONCE,
      });

      expect(response.headers.get('location')).toBe(`${ORIGIN}/students`);
      expect(bodies).toHaveLength(1);
      // __Host- 쿠키는 Secure가 없는 Set-Cookie로는 지워지지 않는다.
      ['__Host-code_verifier', '__Host-oauth_state'].forEach((name) => {
        expect(response.cookies.get(name)).toMatchObject({
          value: '',
          maxAge: 0,
          secure: true,
          path: '/',
        });
      });
    });

    it('다른 서브도메인이 심을 수 있는 접두사 없는 쿠키는 대조에 쓰지 않는다', async () => {
      const bodies = mockToken();

      const response = await callbackWithCookies(`code=attacker-code&state=${stateFor('/')}`, {
        code_verifier: 'planted-verifier',
        oauth_state: NONCE,
      });

      expect(response.headers.get('location')).toBe(`${ORIGIN}/`);
      expect(bodies).toEqual([]);
    });
  });
});
