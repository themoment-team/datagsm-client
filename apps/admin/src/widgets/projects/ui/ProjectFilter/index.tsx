import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_LABEL,
  parseProjectCategory,
} from '@repo/shared/constants';
import { Club } from '@repo/shared/types';
import { FilterOption, FilterSelect, Input } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { Search } from 'lucide-react';
import { Control, Controller } from 'react-hook-form';

import { ProjectFilterType } from '@/entities/project';

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'ACTIVE', label: '운영 중' },
  { value: 'ENDED', label: '운영 종료' },
];

/** 서버가 미분류만 조회하는 방법을 주지 않아 미분류 선택지는 없다. */
const CATEGORY_OPTIONS: FilterOption[] = [
  { value: 'all', label: '전체' },
  ...PROJECT_CATEGORIES.map((category) => ({
    value: category,
    label: PROJECT_CATEGORY_LABEL[category],
  })),
];

interface ProjectFilterProps {
  control: Control<ProjectFilterType>;
  clubs: Club[];
}

const ProjectFilter = ({ control, clubs }: ProjectFilterProps) => {
  const clubOptions: FilterOption[] = [
    { value: 'all', label: '전체' },
    ...clubs.map((club) => ({ value: String(club.id), label: club.name })),
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-2')}>
      <div className={cn('relative w-[320px] max-w-full')}>
        <Search
          className={cn('text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2')}
        />
        <Controller
          control={control}
          name="projectName"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="프로젝트 이름으로 검색하세요"
              className={cn('border-foreground rounded-none pl-9')}
              onChange={field.onChange}
              value={field.value ?? ''}
            />
          )}
        />
      </div>

      <div className={cn('ml-auto flex flex-wrap items-center justify-end gap-2')}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <FilterSelect
              label="상태"
              options={STATUS_OPTIONS}
              value={field.value ?? 'ACTIVE'}
              onChange={field.onChange}
              className={cn('w-[200px]')}
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <FilterSelect
              label="카테고리"
              options={CATEGORY_OPTIONS}
              value={field.value ?? 'all'}
              onChange={(value) => field.onChange(parseProjectCategory(value))}
              className={cn('w-[200px]')}
            />
          )}
        />

        <Controller
          control={control}
          name="clubId"
          render={({ field }) => (
            <FilterSelect
              label="동아리"
              options={clubOptions}
              value={field.value ? String(field.value) : 'all'}
              onChange={(value) => field.onChange(value === 'all' ? undefined : Number(value))}
              className={cn('w-[240px]')}
            />
          )}
        />
      </div>
    </div>
  );
};

export default ProjectFilter;
