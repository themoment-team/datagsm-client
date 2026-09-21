'use client';

import type { ProjectEditRequest, ProjectRequestStatus } from '@repo/shared/types';
import { Badge } from '@repo/shared/ui';
import { cn, formatDate } from '@repo/shared/utils';

import { PROJECT_REQUEST_STATUS_LABEL } from '@/entities/project';

interface RequestCardProps {
  request: ProjectEditRequest;
  onSelect: (request: ProjectEditRequest) => void;
}

const STATUS_BADGE_VARIANT: Record<ProjectRequestStatus, 'default' | 'secondary' | 'destructive'> = {
  ACCEPTED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive',
};

const RequestCard = ({ request, onSelect }: RequestCardProps) => {
  const isEdit = request.originalProjectId !== null;

  return (
    <button
      type="button"
      onClick={() => onSelect(request)}
      className={cn(
        'border-foreground pixel-shadow bg-card flex flex-col gap-2 border-2 p-4 text-left transition-transform hover:-translate-y-0.5',
      )}
    >
      <div className={cn('flex items-start justify-between gap-2')}>
        <div className={cn('min-w-0 flex-1')}>
          <h3 className={cn('text-foreground truncate font-semibold')}>{request.name}</h3>
          <p className={cn('text-muted-foreground mt-0.5 truncate font-mono text-xs')}>
            {request.requestedBy.name} · {formatDate(request.requestedAt)}
          </p>
        </div>
        <div className={cn('flex flex-shrink-0 items-center gap-1')}>
          <Badge variant="outline">{isEdit ? '수정' : '신규'}</Badge>
          <Badge variant={STATUS_BADGE_VARIANT[request.requestStatus]}>
            {PROJECT_REQUEST_STATUS_LABEL[request.requestStatus]}
          </Badge>
        </div>
      </div>

      <p className={cn('text-muted-foreground line-clamp-2 text-sm')}>{request.description}</p>
    </button>
  );
};

export default RequestCard;
