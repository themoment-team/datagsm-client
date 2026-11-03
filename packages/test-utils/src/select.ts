import { waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/**
 * Radix Select에서 항목을 고른다.
 *
 * jsdom에는 레이아웃이 없어 포인터 좌표가 NaN으로 계산된다. 앞선 테스트에서 포인터를 움직였다면
 * Radix가 이를 드래그로 보고 트리거를 클릭하자마자 목록을 닫으므로, 키보드로 연다.
 *
 * 항목은 열린 목록 안에서만 찾는다. 문서 전체에서 role로 찾으면 큰 폼일수록 접근성 계산이 느려져
 * CI에서 Select를 여러 번 고르는 테스트가 제한 시간을 넘긴다. 다른 목록이 함께 열려 있어도 헷갈리지 않도록
 * 트리거의 `aria-controls`가 가리키는 목록을 쓴다.
 */
export const selectOption = async (user: UserEvent, trigger: HTMLElement, optionName: string) => {
  trigger.focus();
  await user.keyboard('{ArrowDown}');
  const listbox = await waitFor(() => {
    const element = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    if (!element) {
      throw new Error(
        `'${optionName}'을(를) 고르려 했지만 트리거의 aria-controls가 가리키는 목록이 열리지 않았습니다.`,
      );
    }
    return element;
  });
  await user.click(await within(listbox).findByRole('option', { name: optionName }));
};
