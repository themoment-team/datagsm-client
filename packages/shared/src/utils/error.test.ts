// @vitest-environment node
import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiErrorCode, getApiErrorMessage, getRateLimitMessage } from './error';

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

describe('getApiErrorMessage', () => {
  it('서버 응답 본문의 message를 돌려준다', () => {
    expect(getApiErrorMessage(axiosErrorWith({ code: 409, message: '중복' }))).toBe('중복');
  });

  it('응답이 없거나 본문에 message가 없으면 undefined를 돌려준다', () => {
    expect(getApiErrorMessage(new AxiosError('Network Error'))).toBeUndefined();
    expect(getApiErrorMessage(axiosErrorWith(''))).toBeUndefined();
    expect(getApiErrorMessage(axiosErrorWith({ code: 500 }))).toBeUndefined();
  });

  it('message가 빈 문자열이면 undefined를 돌려준다', () => {
    expect(getApiErrorMessage(axiosErrorWith({ code: 500, message: '' }))).toBeUndefined();
  });

  it('AxiosError가 아니면 undefined를 돌려준다', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBeUndefined();
    expect(getApiErrorMessage({ response: { data: { message: '중복' } } })).toBeUndefined();
  });
});

describe('getRateLimitMessage', () => {
  it('서버가 보낸 대기 시간 안내 문구를 그대로 돌려준다', () => {
    const message = '요청 횟수를 초과했습니다. 120초 후에 다시 시도해주세요.';

    expect(getRateLimitMessage(axiosErrorWith({ code: 429, message }))).toBe(message);
  });

  it('서버 문구가 비어 있거나 없으면 기본 문구를 돌려준다', () => {
    const fallback = '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';

    expect(getRateLimitMessage(axiosErrorWith({ code: 429, message: '' }))).toBe(fallback);
    expect(getRateLimitMessage(new AxiosError('Network Error'))).toBe(fallback);
  });
});
