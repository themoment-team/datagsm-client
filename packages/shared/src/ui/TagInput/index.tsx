'use client';

import * as React from 'react';

import { FORM_FIELD_STYLE, Input } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  id?: string;
  placeholder?: string;
  /** 넘기면 이 개수를 채웠을 때 더 이상 추가되지 않는다. */
  maxItems?: number;
  /** 넘기면 항목 하나가 이 길이를 넘도록 입력할 수 없다. */
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

/** Enter로 문자열을 하나씩 추가하고 X로 제거하는 목록 입력. 중복과 공백은 무시한다. */
const TagInput = ({
  value,
  onChange,
  id,
  placeholder,
  maxItems,
  maxLength,
  disabled,
  className,
}: TagInputProps) => {
  const [draft, setDraft] = React.useState('');

  const isFull = maxItems !== undefined && value.length >= maxItems;

  const addTag = () => {
    const tag = draft.trim();

    if (!tag || isFull || value.includes(tag)) {
      setDraft('');
      return;
    }

    onChange([...value, tag]);
    setDraft('');
  };

  const removeTag = (target: string) => onChange(value.filter((tag) => tag !== target));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // 폼 안에서 Enter가 submit으로 새지 않도록 막는다.
      event.preventDefault();

      // 한글 조합을 확정하는 Enter는 입력을 끝내려는 뜻이 아니므로 태그로 만들지 않는다.
      if (event.nativeEvent.isComposing) return;

      addTag();
      return;
    }

    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Input
        id={id}
        value={draft}
        placeholder={isFull ? `최대 ${maxItems}개까지 추가할 수 있습니다` : placeholder}
        maxLength={maxLength}
        disabled={disabled || isFull}
        className={cn(FORM_FIELD_STYLE)}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
      />

      {value.length > 0 && (
        <ul className={cn('flex flex-wrap gap-1.5')}>
          {value.map((tag) => (
            <li
              key={tag}
              className={cn(
                'border-foreground bg-background flex max-w-full items-center gap-1.5 border px-2 py-1',
              )}
            >
              <span className={cn('text-muted-foreground truncate font-mono text-xs leading-4')}>
                {tag}
              </span>
              {!disabled && (
                <button
                  type="button"
                  className={cn(
                    'text-foreground shrink-0 cursor-pointer font-mono text-xs leading-4 tracking-[0.1em] transition-opacity hover:opacity-60',
                  )}
                  onClick={() => removeTag(tag)}
                >
                  X<span className={cn('sr-only')}>{tag} 제거</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export { TagInput };
export type { TagInputProps };
