'use client';

import { Pencil } from 'lucide-react';

import type { MyProject, ProjectRequestStatus } from '@repo/shared/types';
import { Badge, Button } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { PROJECT_REQUEST_STATUS_LABEL } from '@/entities/project';

interface MyProjectCardProps {
  project: MyProject;
  onEdit: (project: MyProject) => void;
}

const STATUS_BADGE_VARIANT: Record<ProjectRequestStatus, 'default' | 'secondary' | 'destructive'> = {
  ACCEPTED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive',
};

const MyProjectCard = ({ project, onEdit }: MyProjectCardProps) => {
  const { name, description, iconUrl, club, startYear, endYear, requestStatus, rejectReason } =
    project;

  // 승인본이 있는 상태(projectId 존재)에서 심사 대기면 수정 심사 중이다.
  const isEditUnderReview = requestStatus === 'PENDING' && project.projectId !== null;

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

        <Badge variant={STATUS_BADGE_VARIANT[requestStatus]}>
          {PROJECT_REQUEST_STATUS_LABEL[requestStatus]}
        </Badge>
      </div>

      {isEditUnderReview && (
        <p className={cn('text-muted-foreground font-mono text-xs')}>
          수정 심사 중 · 아래 내용은 수정안 기준입니다.
        </p>
      )}

      <p className={cn('text-muted-foreground line-clamp-2 text-sm')}>{description}</p>

      {requestStatus === 'REJECTED' && rejectReason && (
        <div className={cn('border-destructive text-destructive border-l-2 pl-2 font-mono text-xs')}>
          거절 사유: {rejectReason}
        </div>
      )}

      <div className={cn('mt-auto flex justify-end')}>
        <Button variant="outline" size="sm" onClick={() => onEdit(project)} className={cn('gap-1.5')}>
          <Pencil className={cn('h-3 w-3')} />
          수정
        </Button>
      </div>
    </div>
  );
};

export default MyProjectCard;
