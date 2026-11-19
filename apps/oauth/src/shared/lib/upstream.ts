import { NextResponse } from 'next/server';

export const INTERNAL_ERROR_DESCRIPTION = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';

const internalErrorBody = (error: string) => ({
  error,
  error_description: INTERNAL_ERROR_DESCRIPTION,
});

/**
 * 서버 응답을 클라이언트로 넘긴다.
 *
 * 본문을 먼저 text로 읽어, 비어 있거나 JSON이 아니어도 상태 코드는 반드시 보존한다.
 * ok 여부를 보기 전에 response.json()을 부르면 파싱 실패가 catch로 빠져 500이 되고,
 * 그 순간 원래 상태 코드가 사라져 클라이언트가 422 같은 분기를 놓친다.
 *
 * 5xx의 JSON이 아닌 본문은 게이트웨이 오류 페이지라 내부 호스트명이나 요청 ID가 섞일 수 있어
 * 고정 문구로 바꾸고 원문은 서버 로그에만 남긴다. 4xx 본문은 클라이언트가 분기에 쓰므로 그대로 넘긴다.
 */
export const passThroughUpstream = async (response: Response) => {
  let body: string;
  try {
    body = await response.text();
  } catch (error) {
    console.error('[passThroughUpstream] 서버 응답 본문을 읽지 못했습니다.', error);
    return NextResponse.json(internalErrorBody('upstream_error'), { status: response.status });
  }

  if (!body) return new NextResponse(null, { status: response.status });

  try {
    return NextResponse.json(JSON.parse(body), { status: response.status });
  } catch {
    if (response.status >= 500) {
      console.error(`[passThroughUpstream] JSON이 아닌 ${response.status} 응답`, body);
      return NextResponse.json(internalErrorBody('upstream_error'), { status: response.status });
    }

    return NextResponse.json(
      { error: 'upstream_error', error_description: body },
      { status: response.status },
    );
  }
};

/**
 * route handler가 예기치 못한 예외로 끝났을 때의 응답.
 *
 * fetch 실패 메시지에는 내부 주소나 런타임 문구가 섞일 수 있어 클라이언트에는 고정 문구만 보내고,
 * 원본 오류는 서버 로그에만 남긴다.
 *
 * 요청 본문 파싱 실패를 포함해 모든 예외를 500으로 낸다. 로그인 폼은 authorize의 400을
 * 세션 만료로 처리하므로, 입력 오류를 400으로 바꾸면 엉뚱하게 세션이 만료된다.
 */
export const internalErrorResponse = (error: unknown, context: string) => {
  console.error(`[${context}]`, error);
  return NextResponse.json(internalErrorBody('server_error'), { status: 500 });
};
