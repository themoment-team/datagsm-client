import { fireEvent, render, screen, userEvent } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { TagInput } from '.';

const setup = (props: Partial<React.ComponentProps<typeof TagInput>> = {}) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagInput value={[]} onChange={onChange} {...props} />);

  return { onChange, user, input: screen.getByRole('textbox') };
};

describe('TagInput', () => {
  it('Enter로 앞뒤 공백을 제거한 태그를 추가하고 입력창을 비운다', async () => {
    const { onChange, user, input } = setup({ value: ['Next'] });

    await user.type(input, '  React  {Enter}');

    expect(onChange).toHaveBeenCalledWith(['Next', 'React']);
    expect(input).toHaveValue('');
  });

  it('공백만 입력하고 Enter를 누르면 추가하지 않고 입력창을 비운다', async () => {
    const { onChange, user, input } = setup();

    await user.type(input, '   {Enter}');

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('이미 있는 태그는 추가하지 않는다', async () => {
    const { onChange, user, input } = setup({ value: ['React'] });

    await user.type(input, 'React{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('한글 조합을 확정하는 Enter는 태그로 추가하지 않는다', () => {
    const { onChange, input } = setup();

    fireEvent.change(input, { target: { value: '리액트' } });
    // user-event는 IME 조합을 재현하지 못해 isComposing을 직접 넣는다.
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('리액트');
  });

  it('폼 안에서 Enter를 눌러도 폼을 제출하지 않는다', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const user = userEvent.setup();
    render(
      <form onSubmit={onSubmit}>
        <TagInput value={[]} onChange={vi.fn()} />
      </form>,
    );

    await user.type(screen.getByRole('textbox'), 'React{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('입력창을 벗어나면 입력 중인 값을 태그로 추가한다', async () => {
    const { onChange, user, input } = setup();

    await user.type(input, 'Vite');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(['Vite']);
  });

  it('입력창이 비었을 때 Backspace를 누르면 마지막 태그를 지운다', async () => {
    const { onChange, user, input } = setup({ value: ['Next', 'React'] });

    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(['Next']);
  });

  it('입력 중인 글자가 있으면 Backspace로 태그를 지우지 않는다', async () => {
    const { onChange, user, input } = setup({ value: ['Next'] });

    await user.type(input, 'ab{Backspace}');

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('a');
  });

  it('X 버튼으로 해당 태그만 지운다', async () => {
    const { onChange, user } = setup({ value: ['Next', 'React'] });

    await user.click(screen.getByRole('button', { name: /Next 제거/ }));

    expect(onChange).toHaveBeenCalledWith(['React']);
  });

  it('maxItems를 채우면 입력창을 막고 안내 문구를 보여준다', () => {
    const { input } = setup({ value: ['a', 'b'], maxItems: 2, placeholder: '입력' });

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', '최대 2개까지 추가할 수 있습니다');
  });

  it('maxLength를 넘겨 입력할 수 없다', async () => {
    const { user, input } = setup({ maxLength: 3 });

    await user.type(input, 'abcdef');

    expect(input).toHaveValue('abc');
  });

  it('disabled면 입력창을 막고 X 버튼을 숨긴다', () => {
    const { input } = setup({ value: ['Next'], disabled: true });

    expect(input).toBeDisabled();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
