// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { INTERNAL_ERROR_DESCRIPTION, internalErrorResponse, passThroughUpstream } from './upstream';

describe('passThroughUpstream', () => {
  it('JSON 본문과 상태 코드를 그대로 넘긴다', async () => {
    const upstream = Response.json({ error: 'invalid_grant' }, { status: 422 });

    const response = await passThroughUpstream(upstream);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_grant' });
  });

  it('본문이 비어 있으면 본문 없이 상태 코드만 넘긴다', async () => {
    const response = await passThroughUpstream(new Response(null, { status: 204 }));

    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe('');
  });

  it('4xx의 JSON이 아닌 본문은 upstream_error로 감싸 그대로 넘기고 상태 코드를 지킨다', async () => {
    const upstream = new Response('잘못된 요청입니다.', { status: 400 });

    const response = await passThroughUpstream(upstream);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'upstream_error',
      error_description: '잘못된 요청입니다.',
    });
  });

  it('5xx의 JSON이 아닌 본문은 원문 대신 고정 문구를 싣고 원문은 서버 로그로만 남긴다', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const html = '<html>502 Bad Gateway - internal-alb-123.ap-northeast-2</html>';

    const response = await passThroughUpstream(new Response(html, { status: 502 }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'upstream_error',
      error_description: INTERNAL_ERROR_DESCRIPTION,
    });
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), html);
  });

  it('본문을 읽다 실패해도 원래 상태 코드를 지킨다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const upstream = new Response('{}', { status: 422 });
    vi.spyOn(upstream, 'text').mockRejectedValue(new TypeError('terminated'));

    const response = await passThroughUpstream(upstream);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: 'upstream_error',
      error_description: INTERNAL_ERROR_DESCRIPTION,
    });
  });

  it('성공 응답도 그대로 넘긴다', async () => {
    const response = await passThroughUpstream(Response.json({ fields: ['NAME'] }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ fields: ['NAME'] });
  });
});

describe('internalErrorResponse', () => {
  it('원본 오류 문구는 응답에 싣지 않고 서버 로그로만 남긴다', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new TypeError('fetch failed: connect ECONNREFUSED 10.0.0.5:8080');

    const response = internalErrorResponse(error, 'POST /api/test');

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'server_error', error_description: INTERNAL_ERROR_DESCRIPTION });
    expect(consoleError).toHaveBeenCalledWith('[POST /api/test]', error);
  });
});
