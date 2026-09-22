'use client';

import { FormEvent, useState } from 'react';

import { Button, type FilterOption, FilterSelect, Input } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { Search } from 'lucide-react';

import { PROJECT_SORT_OPTIONS, PROJECT_STATUS_FILTER_OPTIONS } from '@/entities/project';

interface ProjectListFilterProps {
  defaultSearch: string;
  status: string;
  sort: string;
  clubId: string;
  /** '전체'를 포함한 동아리 선택지. 목록을 못 불러오면 전체만 남아 필터가 숨겨진다. */
  clubOptions: FilterOption[];
  onSearchSubmit: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClubChange: (value: string) => void;
}

const ProjectListFilter = ({
  defaultSearch,
  status,
  sort,
  clubId,
  clubOptions,
  onSearchSubmit,
  onStatusChange,
  onSortChange,
  onClubChange,
}: ProjectListFilterProps) => {
  const [search, setSearch] = useState(defaultSearch);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit(search.trim());
  };

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
      <form onSubmit={handleSubmit} className={cn('flex w-full items-center gap-2 sm:max-w-sm')}>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="프로젝트 이름 검색"
          className={cn('border-foreground h-9')}
        />
        <Button type="submit" variant="outline" size="icon" aria-label="검색">
          <Search className={cn('h-4 w-4')} />
        </Button>
      </form>

      <div className={cn('flex flex-wrap items-center gap-2')}>
        {clubOptions.length > 1 && (
          <FilterSelect
            label="동아리"
            options={clubOptions}
            value={clubId}
            onChange={onClubChange}
          />
        )}
        <FilterSelect
          label="상태"
          options={PROJECT_STATUS_FILTER_OPTIONS}
          value={status}
          onChange={onStatusChange}
        />
        <FilterSelect
          label="정렬"
          options={PROJECT_SORT_OPTIONS}
          value={sort}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
};

export default ProjectListFilter;
