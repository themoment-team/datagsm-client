// @vitest-environment node
import { HttpResponse, http, server } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';

import { fetchHealthStatus } from './fetchHealthStatus';

const ORIGIN = 'https://status.test';

type Respond = () => Response;

const mockHealth = ({
  web = () => HttpResponse.json({ code: 200 }),
  openApi = () => HttpResponse.json({ code: 200 }),
  oauthAuthorization = () => HttpResponse.json({ code: 200 }),
  oauthResource = () => HttpResponse.json({ code: 200 }),
}: {
  web?: Respond;
  openApi?: Respond;
  oauthAuthorization?: Respond;
  oauthResource?: Respond;
} = {}) => {
  server.use(
    http.get(`${ORIGIN}/api/server1/v1/health`, web),
    http.get(`${ORIGIN}/api/server2/v1/health`, openApi),
    http.get(`${ORIGIN}/api/server3/v1/health`, oauthAuthorization),
    http.get(`${ORIGIN}/api/server4/v1/health`, oauthResource),
  );
};

describe('fetchHealthStatus', () => {
  it('서버 네 곳을 확인해 이름·설명·상태·응답 시간을 돌려준다', async () => {
    mockHealth();

    const result = await fetchHealthStatus({ baseOrigin: ORIGIN });

    expect(result.servers.map(({ name, status }) => [name, status])).toEqual([
      ['Web', 200],
      ['OpenAPI', 200],
      ['OAuth Authorization', 200],
      ['OAuth Resource', 200],
    ]);
    expect(result.servers[1]).toMatchObject({
      description: '학생/동아리/프로젝트 데이터 API 서버',
      responseTime: expect.any(Number),
    });
    expect(new Date(result.checkedAt).toISOString()).toBe(result.checkedAt);
  });

  it('HTTP 상태보다 응답 본문의 code를 먼저 본다', async () => {
    mockHealth({ openApi: () => HttpResponse.json({ code: 503 }, { status: 200 }) });

    const { servers } = await fetchHealthStatus({ baseOrigin: ORIGIN });

    expect(servers[1]).toMatchObject({ status: 503, responseTime: undefined });
  });

  it('본문이 JSON이 아니면 HTTP 상태로 판정한다', async () => {
    mockHealth({ web: () => new HttpResponse('Service Unavailable', { status: 503 }) });

    const { servers } = await fetchHealthStatus({ baseOrigin: ORIGIN });

    expect(servers[0]?.status).toBe(503);
  });

  it.each([
    ['500 응답', () => new HttpResponse('error', { status: 500 })],
    ['404 응답', () => HttpResponse.json({ code: 404 }, { status: 404 })],
    ['연결 실패', () => HttpResponse.error()],
  ])('%s은 서비스 다운(502)으로 본다', async (_, respond) => {
    mockHealth({ oauthResource: respond });

    const { servers } = await fetchHealthStatus({ baseOrigin: ORIGIN });

    expect(servers[3]).toMatchObject({ name: 'OAuth Resource', status: 502 });
    expect(servers[3]?.responseTime).toBeUndefined();
  });

  it('한 서버가 실패해도 나머지 서버 결과는 그대로 돌려준다', async () => {
    mockHealth({ web: () => HttpResponse.error() });

    const { servers } = await fetchHealthStatus({ baseOrigin: ORIGIN });

    expect(servers.map(({ status }) => status)).toEqual([502, 200, 200, 200]);
  });
});
