// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('거짓 값을 빼고 클래스를 합친다', () => {
    const isHidden = false;

    expect(cn('px-2', isHidden && 'hidden', undefined, { 'font-bold': true, italic: false })).toBe(
      'px-2 font-bold',
    );
  });

  it('충돌하는 Tailwind 클래스는 뒤에 온 것을 남긴다', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4');
  });
});
