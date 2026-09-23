type QueryValue = string | number | boolean | null | undefined;

/**
 * 쿼리 스트링을 만든다. 값이 있으면 `?a=1&b=2`, 없으면 빈 문자열을 돌려준다.
 * `undefined`, `null`, 빈 문자열은 뺀다. `0`과 `false`는 값으로 보고 넣는다.
 */
export const buildQuery = (params: Record<string, QueryValue>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};
