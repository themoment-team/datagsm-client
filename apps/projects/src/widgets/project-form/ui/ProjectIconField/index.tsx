'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { PROJECT_ICON_ACCEPT } from '@/entities/project';

import { useUploadProjectIcon } from '../../model/useUploadProjectIcon';

interface ProjectIconFieldProps {
  initialUrl?: string | null;
  onChange: (iconKey: string | null) => void;
  disabled?: boolean;
}

const ProjectIconField = ({ initialUrl, onChange, disabled }: ProjectIconFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const { mutate: upload, isPending } = useUploadProjectIcon();

  useEffect(() => {
    setPreview(initialUrl ?? null);
  }, [initialUrl]);

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    upload(file, {
      onSuccess: (iconKey) => {
        setPreview(localUrl);
        onChange(iconKey);
      },
      onError: (error) => {
        URL.revokeObjectURL(localUrl);
        toast.error(error instanceof Error ? error.message : '아이콘 업로드에 실패했습니다.');
      },
    });
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
  };

  return (
    <div className={cn('flex items-center gap-3')}>
      <div
        className={cn(
          'border-foreground bg-muted flex h-16 w-16 flex-shrink-0 items-center justify-center border-2',
        )}
      >
        {isPending ? (
          <Loader2 className={cn('text-muted-foreground h-5 w-5 animate-spin')} />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="아이콘 미리보기" className={cn('h-full w-full object-cover')} />
        ) : (
          <ImagePlus className={cn('text-muted-foreground h-5 w-5')} />
        )}
      </div>

      <div className={cn('flex items-center gap-2')}>
        <input
          ref={inputRef}
          type="file"
          accept={PROJECT_ICON_ACCEPT}
          className={cn('hidden')}
          onChange={handleSelect}
          disabled={disabled || isPending}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isPending}
        >
          {preview ? '변경' : '업로드'}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isPending}
            aria-label="아이콘 제거"
          >
            <X className={cn('h-4 w-4')} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectIconField;
