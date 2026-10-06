'use client';

import { useMemo, useRef, useState } from 'react';

import type { ParticipantCandidate } from '@repo/shared/types';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { ChevronDown } from 'lucide-react';

import { STUDENT_MAJOR_LABEL } from '@/entities/project';

interface ParticipantFieldProps {
  /** 선택된 학생 ID */
  value: number[];
  onChange: (participantIds: number[]) => void;
  /** 고를 수 있는 학생과 이미 선택된 학생을 모두 담은 목록. 명단의 이름도 여기서 찾는다. */
  candidates: ParticipantCandidate[];
  isLoading?: boolean;
  isError?: boolean;
  disabled?: boolean;
}

/** 동명이인을 구분할 수 있도록 학번·이름·학과를 함께 보여준다. */
const describeCandidate = ({ name, studentNumber, major }: ParticipantCandidate) =>
  [studentNumber, name, major && STUDENT_MAJOR_LABEL[major]].filter(Boolean).join(' · ');

/** 이름·학번으로 학생을 검색해 여러 명 고르고, 고른 학생을 명단에서 X로 제외하는 입력. */
const ParticipantField = ({
  value,
  onChange,
  candidates,
  isLoading,
  isError,
  disabled,
}: ParticipantFieldProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => candidates.filter((candidate) => value.includes(candidate.id)),
    [candidates, value],
  );

  const options = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return candidates.filter(
      (candidate) =>
        !value.includes(candidate.id) &&
        (!keyword ||
          candidate.name.toLowerCase().includes(keyword) ||
          (candidate.studentNumber?.toString().includes(keyword) ?? false)),
    );
  }, [candidates, value, searchTerm]);

  const emptyMessage = isLoading
    ? '학생 목록을 불러오는 중...'
    : isError
      ? '학생 목록을 불러오지 못했습니다.'
      : '검색 결과가 없습니다.';

  return (
    <div className={cn('flex flex-col gap-1.5')}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearchTerm('');
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label="참여자 추가"
            disabled={disabled}
            className={cn(
              'border-foreground bg-background text-muted-foreground flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-none border px-3 text-left font-mono text-sm outline-none transition-colors focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            이름 또는 학번으로 검색
            <ChevronDown className={cn('size-4 shrink-0 opacity-50')} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'border-foreground w-(--radix-popover-trigger-width) rounded-none border-2 p-0',
          )}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              ref={searchRef}
              placeholder="이름 또는 학번 검색..."
              className={cn('text-sm')}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {options.map((candidate) => (
                <CommandItem
                  key={candidate.id}
                  value={candidate.id.toString()}
                  // 여러 명을 이어서 고를 수 있도록 목록은 열어 두고 검색어만 비운다.
                  onSelect={() => {
                    onChange([...value, candidate.id]);
                    setSearchTerm('');
                  }}
                >
                  {describeCandidate(candidate)}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul aria-label="선택된 참여자" className={cn('flex flex-wrap gap-1.5')}>
          {selected.map((candidate) => (
            <li
              key={candidate.id}
              className={cn(
                'border-foreground bg-background flex max-w-full items-center gap-1.5 border px-2 py-1',
              )}
            >
              <span className={cn('text-muted-foreground truncate font-mono text-xs leading-4')}>
                {describeCandidate(candidate)}
              </span>
              {!disabled && (
                <button
                  type="button"
                  className={cn(
                    'text-foreground shrink-0 cursor-pointer font-mono text-xs leading-4 tracking-[0.1em] transition-opacity hover:opacity-60',
                  )}
                  onClick={() => onChange(value.filter((id) => id !== candidate.id))}
                >
                  X<span className={cn('sr-only')}>{candidate.name} 제외</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ParticipantField;
