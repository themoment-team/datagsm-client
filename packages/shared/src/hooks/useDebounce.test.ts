import { act, renderHook } from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('처음에는 받은 값을 바로 돌려준다', () => {
    const { result } = renderHook(() => useDebounce('a'));

    expect(result.current).toBe('a');
  });

  it('기본 500ms 동안 값이 바뀌지 않아야 새 값을 돌려준다', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('ab');
  });

  it('기다리는 중에 값이 또 바뀌면 타이머를 처음부터 다시 잰다', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'abc' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });
});
