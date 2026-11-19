import { NextResponse } from 'next/server';

/**
 * 서버 응답을 클라이언트로 그대로 넘긴다.
 *
 * 본문을 먼저 text로 읽어, 비어 있거나 JSON이 아니어도 상태 코드는 반드시 보존한다.
 * ok 여부를 보기 전에 response.json()을 부르면 파싱 실패가 catch로 빠져 500이 되고,
 * 그 순간 원래 상태 코드가 사라져 클라이언트가 422 같은 분기를 놓친다.
 */
export const passThroughUpstream = async (response: Response) => {
  const body = await response.text();

  if (!body) return new NextResponse(null, { status: response.status });

  try {
    return NextResponse.json(JSON.parse(body), { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'upstream_error', error_description: body },
      { status: response.status },
    );
  }
};

const INTERNAL_ERROR_DESCRIPTION = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';

/**
 * route handler가 예기치 못한 예외로 끝났을 때의 응답.
 *
 * fetch 실패 메시지에는 내부 주소나 런타임 문구가 섞일 수 있어 클라이언트에는 고정 문구만 보내고,
 * 원본 오류는 서버 로그에만 남긴다.
 */
export const internalErrorResponse = (error: unknown, context: string) => {
  console.error(`[${context}]`, error);
  return NextResponse.json(
    { error: 'server_error', error_description: INTERNAL_ERROR_DESCRIPTION },
    { status: 500 },
  );
};
