// @vitest-environment node
import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiErrorCode } from './error';

const axiosErrorWith = (data: unknown) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('getApiErrorCode', () => {
  it('서버 응답 본문의 code를 돌려준다', () => {
    expect(getApiErrorCode(axiosErrorWith({ code: 409, message: '중복' }))).toBe(409);
  });

  it('응답이 없거나 본문에 code가 없으면 undefined를 돌려준다', () => {
    expect(getApiErrorCode(new AxiosError('Network Error'))).toBeUndefined();
    expect(getApiErrorCode(axiosErrorWith(''))).toBeUndefined();
  });

  it('AxiosError가 아니면 undefined를 돌려준다', () => {
    expect(getApiErrorCode(new Error('boom'))).toBeUndefined();
    expect(getApiErrorCode({ response: { data: { code: 400 } } })).toBeUndefined();
  });
});
