'use client';

import * as React from 'react';

import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABEL } from '@repo/shared/constants';
import type { ProjectCategory } from '@repo/shared/types';
import { Checkbox } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

interface ProjectCategoryCheckboxGroupProps {
  /** 고른 카테고리 */
  value: ProjectCategory[];
  onChange: (categories: ProjectCategory[]) => void;
  disabled?: boolean;
}

/** 프로젝트 카테고리를 여러 개 고르는 체크박스 묶음. 프로젝트 신청 폼과 어드민 폼이 함께 쓴다. */
const ProjectCategoryCheckboxGroup = ({
  value,
  onChange,
  disabled,
}: ProjectCategoryCheckboxGroupProps) => {
  // 한 화면에 묶음이 둘 이상 있어도 라벨이 다른 묶음의 체크박스를 가리키지 않도록 id를 따로 만든다.
  const idPrefix = React.useId();

  return (
    <div role="group" aria-label="카테고리" className={cn('flex flex-wrap gap-x-4 gap-y-2')}>
      {PROJECT_CATEGORIES.map((category) => {
        const id = `${idPrefix}-${category}`;
        const isSelected = value.includes(category);

        return (
          <div key={category} className={cn('flex items-center gap-2')}>
            <Checkbox
              id={id}
              checked={isSelected}
              onCheckedChange={() =>
                onChange(
                  isSelected
                    ? value.filter((selected) => selected !== category)
                    : [...value, category],
                )
              }
              disabled={disabled}
            />
            <label htmlFor={id} className={cn('cursor-pointer text-sm')}>
              {PROJECT_CATEGORY_LABEL[category]}
            </label>
          </div>
        );
      })}
    </div>
  );
};

export { ProjectCategoryCheckboxGroup };
export type { ProjectCategoryCheckboxGroupProps };
