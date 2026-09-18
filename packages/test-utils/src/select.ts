import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/**
 * Radix Select에서 항목을 고른다.
 *
 * jsdom에는 레이아웃이 없어 포인터 좌표가 NaN으로 계산된다. 앞선 테스트에서 포인터를 움직였다면
 * Radix가 이를 드래그로 보고 트리거를 클릭하자마자 목록을 닫으므로, 키보드로 연다.
 */
export const selectOption = async (user: UserEvent, trigger: HTMLElement, optionName: string) => {
  trigger.focus();
  await user.keyboard('{ArrowDown}');
  await user.click(await screen.findByRole('option', { name: optionName }));
};
