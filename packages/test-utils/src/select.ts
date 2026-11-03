import { waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/**
 * 트리거의 `aria-controls`가 가리키는 팝업(Select 목록, Popover 내용)이 열릴 때까지 기다렸다가 돌려준다.
 *
 * 항목은 이 안에서만 찾는다. 문서 전체에서 role로 찾으면 큰 폼일수록 접근성 계산이 느려져
 * CI에서 항목을 여러 번 고르는 테스트가 제한 시간을 넘기고, 다른 목록이 함께 열려 있으면 엉뚱한 항목을 잡는다.
 */
export const findControlledPopup = (trigger: HTMLElement) =>
  waitFor(() => {
    const element = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    if (!element) {
      throw new Error(
        `트리거(${trigger.textContent?.trim() || trigger.outerHTML})의 aria-controls가 가리키는 팝업이 열리지 않았습니다.`,
      );
    }
    return element;
  });

/**
 * Radix Select에서 항목을 고른다.
 *
 * jsdom에는 레이아웃이 없어 포인터 좌표가 NaN으로 계산된다. 앞선 테스트에서 포인터를 움직였다면
 * Radix가 이를 드래그로 보고 트리거를 클릭하자마자 목록을 닫으므로, 키보드로 연다.
 */
export const selectOption = async (user: UserEvent, trigger: HTMLElement, optionName: string) => {
  trigger.focus();
  await user.keyboard('{ArrowDown}');
  const listbox = await findControlledPopup(trigger);
  await user.click(await within(listbox).findByRole('option', { name: optionName }));
};
