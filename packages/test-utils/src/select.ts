import { waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

const describeTrigger = (trigger: HTMLElement) => trigger.textContent?.trim() || trigger.outerHTML;

const getControlledId = (trigger: HTMLElement) => {
  const id = trigger.getAttribute('aria-controls');
  if (!id) {
    throw new Error(
      `트리거(${trigger.outerHTML})에 aria-controls가 없습니다. Radix 트리거를 넘겼는지 확인하세요.`,
    );
  }
  return id;
};

// 닫히는 중인 팝업은 Presence 때문에 DOM에 잠시 남으므로, 열린 상태인지까지 확인한다.
const getOpenPopup = (trigger: HTMLElement, id: string) => {
  const element = document.getElementById(id);
  if (!element || element.getAttribute('data-state') !== 'open') {
    throw new Error(
      `트리거(${describeTrigger(trigger)})의 aria-controls가 가리키는 팝업이 열리지 않았습니다.`,
    );
  }
  return element;
};

/**
 * 트리거의 `aria-controls`가 가리키는 팝업(Select 목록, Popover 내용)이 열릴 때까지 기다렸다가 돌려준다.
 *
 * 항목은 이 안에서만 찾는다. 문서 전체에서 role로 찾으면 큰 폼일수록 접근성 계산이 느려져
 * CI에서 항목을 여러 번 고르는 테스트가 제한 시간을 넘기고, 다른 목록이 함께 열려 있으면 엉뚱한 항목을 잡는다.
 */
export const findControlledPopup = async (trigger: HTMLElement) => {
  const id = getControlledId(trigger);
  return waitFor(() => getOpenPopup(trigger, id));
};

/**
 * 트리거로 이미 연 팝업에서 항목을 고른다. Popover·Command 기반 combobox는 트리거를 클릭해 연 뒤 이것을 쓴다.
 *
 * 팝업이 열리기를 기다리는 것과 항목을 찾는 것을 한 번의 `waitFor`로 처리해, 없는 항목을 찾을 때 대기 시간이 두 배가 되지 않게 한다.
 */
export const pickControlledOption = async (
  user: UserEvent,
  trigger: HTMLElement,
  optionName: string,
) => {
  const id = getControlledId(trigger);
  const option = await waitFor(() =>
    within(getOpenPopup(trigger, id)).getByRole('option', { name: optionName }),
  );
  await user.click(option);
};

/**
 * Radix Select에서 항목을 고른다.
 *
 * jsdom에는 레이아웃이 없어 포인터 좌표가 NaN으로 계산된다. 앞선 테스트에서 포인터를 움직였다면
 * Radix가 이를 드래그로 보고 트리거를 클릭하자마자 목록을 닫으므로, 키보드로 연다.
 */
export const selectOption = async (user: UserEvent, trigger: HTMLElement, optionName: string) => {
  trigger.focus();
  await user.keyboard('{ArrowDown}');
  await pickControlledOption(user, trigger, optionName);
};
