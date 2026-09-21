'use client';

import { FormEvent, useState } from 'react';

import { Search } from 'lucide-react';

import { Button, FilterSelect, Input } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { PROJECT_SORT_OPTIONS, PROJECT_STATUS_FILTER_OPTIONS } from '@/entities/project';

interface ProjectListFilterProps {
  defaultSearch: string;
  status: string;
  sort: string;
  onSearchSubmit: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

const ProjectListFilter = ({
  defaultSearch,
  status,
  sort,
  onSearchSubmit,
  onStatusChange,
  onSortChange,
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

      <div className={cn('flex items-center gap-2')}>
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
