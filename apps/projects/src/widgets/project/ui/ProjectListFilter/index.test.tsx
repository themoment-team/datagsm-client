import type { ComponentProps } from 'react';

import { renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ProjectListFilter from '.';

type FilterProps = ComponentProps<typeof ProjectListFilter>;

const baseProps: FilterProps = {
  defaultSearch: '',
  status: 'all',
  sort: 'ID:DESC',
  clubId: 'all',
  clubOptions: [{ value: 'all', label: '전체' }],
  onSearchSubmit: () => {},
  onStatusChange: () => {},
  onSortChange: () => {},
  onClubChange: () => {},
};

const searchInput = () => screen.getByPlaceholderText('프로젝트 이름 검색');

describe('ProjectListFilter', () => {
  it('검색어를 입력해 제출하면 앞뒤 공백을 지운 값으로 onSearchSubmit을 호출한다', async () => {
    const onSearchSubmit = vi.fn();
    const { user } = renderWithProviders(
      <ProjectListFilter {...baseProps} onSearchSubmit={onSearchSubmit} />,
    );

    await user.type(searchInput(), '  gsm  ');
    await user.click(screen.getByRole('button', { name: '검색' }));

    expect(onSearchSubmit).toHaveBeenCalledWith('gsm');
  });

  it('URL의 검색어가 바뀌면 입력창도 그 값으로 맞춘다', () => {
    const { rerender } = renderWithProviders(
      <ProjectListFilter {...baseProps} defaultSearch="gsm" />,
    );
    expect(searchInput()).toHaveValue('gsm');

    // 상단 링크나 뒤로 가기로 검색어 없는 주소에 돌아온 경우
    rerender(<ProjectListFilter {...baseProps} defaultSearch="" />);

    expect(searchInput()).toHaveValue('');
  });

  it('검색어가 아닌 필터가 바뀌면 제출하지 않은 입력을 그대로 둔다', async () => {
    const { user, rerender } = renderWithProviders(<ProjectListFilter {...baseProps} />);

    await user.type(searchInput(), 'data');
    rerender(<ProjectListFilter {...baseProps} status="ACTIVE" />);

    expect(searchInput()).toHaveValue('data');
  });
});
