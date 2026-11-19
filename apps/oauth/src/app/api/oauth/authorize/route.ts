import { NextRequest, NextResponse } from 'next/server';

import { internalErrorResponse, passThroughUpstream } from '@/shared/lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;

    if (!oauthBaseUrl) {
      return internalErrorResponse(
        new Error('NEXT_PUBLIC_OAUTH_BASE_URL 환경 변수가 설정되지 않았습니다.'),
        'POST /api/oauth/authorize',
      );
    }

    const response = await fetch(`${oauthBaseUrl}/v1/oauth/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      redirect: 'manual',
    });

    if (response.status === 302) {
      const location = response.headers.get('Location');

      if (!location) {
        return NextResponse.json(
          { error: 'invalid_response', error_description: 'Redirect location missing' },
          { status: 500 },
        );
      }

      return NextResponse.json({ redirect_url: location }, { status: 200 });
    }

    if (!response.ok) {
      return passThroughUpstream(response);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return internalErrorResponse(error, 'POST /api/oauth/authorize');
  }
}
