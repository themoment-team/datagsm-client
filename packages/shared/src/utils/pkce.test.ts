// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { generateCodeChallenge, generateCodeVerifier } from './pkce';

const BASE64URL_43 = /^[A-Za-z0-9_-]{43}$/;

describe('generateCodeVerifier', () => {
  it('32바이트를 패딩 없는 base64url 43자로 만든다', () => {
    expect(generateCodeVerifier()).toMatch(BASE64URL_43);
  });

  it('호출할 때마다 다른 값을 만든다', () => {
    const verifiers = new Set(Array.from({ length: 20 }, generateCodeVerifier));
    expect(verifiers.size).toBe(20);
  });
});

describe('generateCodeChallenge', () => {
  it('RFC 7636 부록 B 예시와 같은 S256 challenge를 만든다', async () => {
    await expect(
      generateCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    ).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('생성한 verifier로 만든 challenge도 base64url 43자다', async () => {
    await expect(generateCodeChallenge(generateCodeVerifier())).resolves.toMatch(BASE64URL_43);
  });
});
