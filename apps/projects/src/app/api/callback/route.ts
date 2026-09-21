import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_KEYS } from '@repo/shared/constants';
import { isValidRelativePath } from '@repo/shared/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const oauthBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
    const clientId = process.env.NEXT_PUBLIC_DATAGSM_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_DATAGSM_REDIRECT_URI;
    const codeVerifier = request.cookies.get('code_verifier')?.value;

    if (!oauthBaseUrl || !clientId || !redirectUri) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const tokenResponse = await fetch(`${oauthBaseUrl}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const tokenData = await tokenResponse.json();

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const targetPath = state && isValidRelativePath(state) ? state : '/';
    const redirectUrl = new URL(targetPath, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // 쿠키 설정
    response.cookies.set(COOKIE_KEYS.ACCESS_TOKEN, accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1시간
    });

    response.cookies.set(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    response.cookies.delete('code_verifier');

    return response;
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
