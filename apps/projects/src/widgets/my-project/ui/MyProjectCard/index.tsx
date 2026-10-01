'use client';

import type { MyProject } from '@repo/shared/types';
import { Badge, Button } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { Pencil } from 'lucide-react';

import { getMyProjectDisplay } from '@/entities/project';

interface MyProjectCardProps {
  project: MyProject;
  onEdit: (project: MyProject) => void;
}

const MyProjectCard = ({ project, onEdit }: MyProjectCardProps) => {
  const { name, description, iconUrl, club, startYear, endYear, rejectReason } = project;

  const display = getMyProjectDisplay(project);

  return (
    <div className={cn('border-foreground pixel-shadow bg-card flex flex-col gap-3 border-2 p-4')}>
      <div className={cn('flex items-start gap-3')}>
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt={`${name} 아이콘`}
            className={cn('border-foreground h-12 w-12 flex-shrink-0 border-2 object-cover')}
          />
        ) : (
          <div
            className={cn(
              'border-foreground bg-muted text-foreground font-pixel flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 text-sm',
            )}
          >
            {name.charAt(0)}
          </div>
        )}

        <div className={cn('min-w-0 flex-1')}>
          <h3 className={cn('text-foreground truncate font-semibold')}>{name}</h3>
          <p className={cn('text-muted-foreground mt-0.5 truncate font-mono text-xs')}>
            {club?.name ?? '무소속'} · {startYear}
            {endYear ? `~${endYear}` : ''}
          </p>
        </div>

        <Badge variant={display.badgeVariant}>{display.badgeLabel}</Badge>
      </div>

      {display.notice && (
        <p className={cn('text-muted-foreground font-mono text-xs')}>{display.notice}</p>
      )}

      <p className={cn('text-muted-foreground line-clamp-2 text-sm')}>{description}</p>

      {display.showRejectReason && rejectReason && (
        <div
          className={cn('border-destructive text-destructive border-l-2 pl-2 font-mono text-xs')}
        >
          거절 사유: {rejectReason}
        </div>
      )}

      <div className={cn('mt-auto flex justify-end')}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(project)}
          className={cn('gap-1.5')}
        >
          <Pencil className={cn('h-3 w-3')} />
          수정
        </Button>
      </div>
    </div>
  );
};

export default MyProjectCard;
