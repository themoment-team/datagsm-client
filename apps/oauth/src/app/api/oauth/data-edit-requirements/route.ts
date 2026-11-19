import { NextRequest } from 'next/server';

import { internalErrorResponse, passThroughUpstream } from '@/shared/lib';

/**
 * 정보 수정이 필요해 로그인이 막힌 계정의, 입력받아야 할 필드 목록을 조회한다.
 * 자격증명을 다시 검증하는 엔드포인트라 authorize와 동일하게 서버로 프록시한다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;

    if (!oauthBaseUrl) {
      return internalErrorResponse(
        new Error('NEXT_PUBLIC_OAUTH_BASE_URL 환경 변수가 설정되지 않았습니다.'),
        'POST /api/oauth/data-edit-requirements',
      );
    }

    const response = await fetch(`${oauthBaseUrl}/v1/oauth/authorize/data-edit-requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return passThroughUpstream(response);
  } catch (error: unknown) {
    return internalErrorResponse(error, 'POST /api/oauth/data-edit-requirements');
  }
}
