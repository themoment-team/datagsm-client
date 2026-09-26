'use client';

import { useCallback } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const useURLFilters = <T extends object>() => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateURL = useCallback(
    (newFilters: Partial<T>, newPage?: number) => {
      const params = new URLSearchParams(searchParams.toString());

      // 필터 업데이트
      Object.entries(newFilters as Record<string, unknown>).forEach(([key, value]) => {
        // 0과 false는 값으로 보고, undefined·null·빈 문자열·'all'만 지운다
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      // 페이지 업데이트
      if (newPage !== undefined) {
        if (newPage === 0) {
          params.delete('page');
        } else {
          params.set('page', newPage.toString());
        }
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { updateURL };
};
