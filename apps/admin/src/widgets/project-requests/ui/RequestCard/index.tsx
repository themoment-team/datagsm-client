'use client';

import type { ProjectEditRequest } from '@repo/shared/types';
import { Badge } from '@repo/shared/ui';
import { cn, formatDate } from '@repo/shared/utils';

import { getProjectRequestStatusLabel, getProjectRequestStatusVariant } from '@/entities/project';

interface RequestCardProps {
  request: ProjectEditRequest;
  onSelect: (request: ProjectEditRequest) => void;
}

const RequestCard = ({ request, onSelect }: RequestCardProps) => {
  const isEdit = request.originalProjectId !== null;

  return (
    <button
      type="button"
      onClick={() => onSelect(request)}
      className={cn(
        'border-foreground bg-card hover:bg-muted flex flex-col gap-2 border p-4 text-left transition-colors',
      )}
    >
      <div className={cn('flex items-start justify-between gap-2')}>
        {request.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={request.iconUrl}
            alt={`${request.name} 아이콘`}
            className={cn('border-foreground h-10 w-10 flex-shrink-0 border object-cover')}
          />
        ) : (
          <div
            className={cn(
              'border-foreground bg-muted text-foreground font-pixel flex h-10 w-10 flex-shrink-0 items-center justify-center border text-xs',
            )}
          >
            {request.name.charAt(0)}
          </div>
        )}

        <div className={cn('min-w-0 flex-1')}>
          <h3 className={cn('text-foreground truncate font-semibold')}>{request.name}</h3>
          <p className={cn('text-muted-foreground mt-0.5 truncate font-mono text-xs')}>
            {request.requestedBy.name} · {formatDate(request.requestedAt)}
          </p>
        </div>
        <div className={cn('flex flex-shrink-0 items-center gap-1')}>
          <Badge variant="outline">{isEdit ? '수정' : '신규'}</Badge>
          <Badge variant={getProjectRequestStatusVariant(request.requestStatus)}>
            {getProjectRequestStatusLabel(request.requestStatus)}
          </Badge>
        </div>
      </div>

      <p className={cn('text-muted-foreground line-clamp-2 text-sm')}>{request.description}</p>
    </button>
  );
};

export default RequestCard;
