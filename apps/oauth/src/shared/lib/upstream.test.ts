// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { passThroughUpstream } from './upstream';

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

  it('JSON이 아닌 본문은 upstream_error로 감싸되 원래 상태 코드를 지킨다', async () => {
    const upstream = new Response('<html>Bad Gateway</html>', { status: 502 });

    const response = await passThroughUpstream(upstream);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'upstream_error',
      error_description: '<html>Bad Gateway</html>',
    });
  });

  it('성공 응답도 그대로 넘긴다', async () => {
    const response = await passThroughUpstream(Response.json({ fields: ['NAME'] }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ fields: ['NAME'] });
  });
});
