import { expect } from 'vitest';

/**
 * 정해진 시간 동안 요청이 나가지 않았는지 확인한다.
 *
 * 제출해도 에러·토스트·화면 변화가 전혀 없어서 기다릴 신호가 없는 경우에만 쓴다.
 * (예: 검증에 막혀 조용히 끝나는 폼) 화면에 변화가 생기는 경우에는 `waitFor`로 그 변화를 기다려야 한다.
 *
 * @param getCount 지금까지 나간 요청 수를 돌려주는 함수
 * @param window 기다릴 시간(ms). 기본 200ms
 */
export const expectNoRequest = async (getCount: () => number, window = 200) => {
  await new Promise((resolve) => setTimeout(resolve, window));
  expect(getCount()).toBe(0);
};
