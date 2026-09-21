'use client';

import { useState } from 'react';

import type { BaseApiResponse, ProjectEditRequest } from '@repo/shared/types';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@repo/shared/ui';
import { cn, formatDate } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PROJECT_REQUEST_STATUS_LABEL, STUDENT_MAJOR_LABEL } from '@/entities/project';

import { useAcceptProjectRequest } from '../../model/useAcceptProjectRequest';
import { useRejectProjectRequest } from '../../model/useRejectProjectRequest';

interface RequestReviewDialogProps {
  request: ProjectEditRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABEL_STYLE = 'text-muted-foreground font-mono text-[10px] uppercase tracking-widest';

const RequestReviewDialog = ({ request, open, onOpenChange }: RequestReviewDialogProps) => {
  const queryClient = useQueryClient();
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const reset = () => {
    setIsRejecting(false);
    setReason('');
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const handleError = (error: unknown) => {
    const message = (error as { response?: { data?: BaseApiResponse } })?.response?.data?.message;
    toast.error(message || '요청을 처리하지 못했습니다.');
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project-requests'] });

  const { mutate: accept, isPending: isAccepting } = useAcceptProjectRequest({
    onSuccess: () => {
      invalidate();
      toast.success('신청을 수락했습니다.');
      close();
    },
    onError: handleError,
  });

  const { mutate: reject, isPending: isRejectPending } = useRejectProjectRequest({
    onSuccess: () => {
      invalidate();
      toast.success('신청을 거절했습니다.');
      close();
    },
    onError: handleError,
  });

  if (!request) return null;

  const isProcessing = isAccepting || isRejectPending;
  const canReview = request.requestStatus === 'PENDING';
  const isEdit = request.originalProjectId !== null;

  const handleReject = () => {
    if (reason.trim().length === 0) {
      toast.error('거절 사유를 입력해 주세요.');
      return;
    }
    reject({ requestId: request.id, reason: reason.trim() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className={cn('flex max-h-[90vh] flex-col p-0 sm:max-w-xl')}>
        <DialogHeader className={cn('border-foreground shrink-0 border-b-2 px-6 py-5')}>
          <DialogTitle className={cn('flex items-center gap-2 font-pixel text-[14px] leading-none')}>
            {request.name}
            <Badge variant="outline">{isEdit ? '수정' : '신규'}</Badge>
            <Badge variant={request.requestStatus === 'REJECTED' ? 'destructive' : 'secondary'}>
              {PROJECT_REQUEST_STATUS_LABEL[request.requestStatus]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className={cn('min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6')}>
          <div className={cn('space-y-1')}>
            <p className={cn(LABEL_STYLE)}>신청자</p>
            <p className={cn('text-foreground text-sm')}>
              {request.requestedBy.name}
              <span className={cn('text-muted-foreground ml-2 font-mono text-xs')}>
                {STUDENT_MAJOR_LABEL[request.requestedBy.major]} · {request.requestedBy.studentNumber}
              </span>
            </p>
            <p className={cn('text-muted-foreground font-mono text-xs')}>
              신청일 {formatDate(request.requestedAt)}
            </p>
          </div>

          <div className={cn('space-y-1')}>
            <p className={cn(LABEL_STYLE)}>설명</p>
            <p className={cn('text-foreground whitespace-pre-wrap text-sm leading-relaxed')}>
              {request.description}
            </p>
          </div>

          <div className={cn('grid grid-cols-2 gap-4')}>
            <div className={cn('space-y-1')}>
              <p className={cn(LABEL_STYLE)}>동아리</p>
              <p className={cn('text-foreground text-sm')}>{request.club?.name ?? '무소속'}</p>
            </div>
            <div className={cn('space-y-1')}>
              <p className={cn(LABEL_STYLE)}>시작 연도</p>
              <p className={cn('text-foreground text-sm')}>{request.startYear}</p>
            </div>
          </div>

          {request.participants.length > 0 && (
            <div className={cn('space-y-1')}>
              <p className={cn(LABEL_STYLE)}>참여자</p>
              <div className={cn('flex flex-wrap gap-1')}>
                {request.participants.map((participant) => (
                  <Badge key={participant.id} variant="outline">
                    {participant.name} · {STUDENT_MAJOR_LABEL[participant.major]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {request.techStacks.length > 0 && (
            <div className={cn('space-y-1')}>
              <p className={cn(LABEL_STYLE)}>기술 스택</p>
              <div className={cn('flex flex-wrap gap-1')}>
                {request.techStacks.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {request.repositories.length > 0 && (
            <div className={cn('space-y-1')}>
              <p className={cn(LABEL_STYLE)}>리포지토리</p>
              <ul className={cn('flex flex-col gap-1')}>
                {request.repositories.map((repo) => (
                  <li key={repo}>
                    <a
                      href={repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('text-muted-foreground hover:text-foreground break-all font-mono text-xs')}
                    >
                      {repo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {request.requestStatus === 'REJECTED' && request.rejectReason && (
            <div className={cn('border-destructive text-destructive border-l-2 pl-2 font-mono text-xs')}>
              거절 사유: {request.rejectReason}
            </div>
          )}
        </div>

        {canReview && (
          <div className={cn('border-foreground shrink-0 space-y-3 border-t-2 px-6 py-4')}>
            {isRejecting ? (
              <>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="거절 사유를 입력해 주세요"
                  className={cn('border-foreground rounded-none font-mono')}
                  disabled={isProcessing}
                />
                <div className={cn('flex justify-end gap-2')}>
                  <Button
                    variant="outline"
                    onClick={() => setIsRejecting(false)}
                    disabled={isProcessing}
                  >
                    취소
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                    거절 확정
                  </Button>
                </div>
              </>
            ) : (
              <div className={cn('flex justify-end gap-2')}>
                <Button
                  variant="outline"
                  onClick={() => setIsRejecting(true)}
                  disabled={isProcessing}
                >
                  거절
                </Button>
                <Button onClick={() => accept(request.id)} disabled={isProcessing}>
                  {isAccepting ? '처리 중...' : '수락'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestReviewDialog;
