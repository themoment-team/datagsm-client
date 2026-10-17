import { render, screen, userEvent } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { ProjectCategoryCheckboxGroup } from '.';

const setup = (props: Partial<React.ComponentProps<typeof ProjectCategoryCheckboxGroup>> = {}) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<ProjectCategoryCheckboxGroup value={[]} onChange={onChange} {...props} />);

  return { onChange, user };
};

const checkbox = (name: string) => screen.getByRole('checkbox', { name });

describe('ProjectCategoryCheckboxGroup', () => {
  it('고른 카테고리만 체크해서 보여 준다', () => {
    setup({ value: ['CLUB', 'NOT_DEPLOYED'] });

    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    expect(checkbox('동아리 프로젝트')).toBeChecked();
    expect(checkbox('미배포')).toBeChecked();
    expect(checkbox('팀 프로젝트')).not.toBeChecked();
  });

  it('체크하면 고른 목록 뒤에 더해 알린다', async () => {
    const { onChange, user } = setup({ value: ['TEAM'] });

    await user.click(checkbox('미배포'));

    expect(onChange).toHaveBeenCalledWith(['TEAM', 'NOT_DEPLOYED']);
  });

  it('체크된 카테고리를 다시 누르면 빼고 알린다', async () => {
    const { onChange, user } = setup({ value: ['TEAM', 'CLUB'] });

    await user.click(checkbox('팀 프로젝트'));

    expect(onChange).toHaveBeenCalledWith(['CLUB']);
  });

  it('라벨을 눌러도 체크된다', async () => {
    const { onChange, user } = setup();

    await user.click(screen.getByText('토이 프로젝트'));

    expect(onChange).toHaveBeenCalledWith(['TOY_PROJECT']);
  });

  it('disabled면 모든 체크박스를 잠근다', () => {
    setup({ disabled: true });

    for (const element of screen.getAllByRole('checkbox')) expect(element).toBeDisabled();
  });
});
