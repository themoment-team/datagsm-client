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

import { getProjectRequestStatusLabel, getSafeDeploymentUrl } from '@/entities/project';
import { getMajorLabel } from '@/entities/student';
import { useAcceptProjectRequest, useRejectProjectRequest } from '@/views/project-requests/model';

interface RequestReviewDialogProps {
  request: ProjectEditRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABEL_STYLE = 'text-muted-foreground font-mono text-[10px] uppercase tracking-widest';
const EMPTY_STYLE = 'text-muted-foreground/70 font-mono text-xs';
const REJECT_REASON_MAX_LENGTH = 500;

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project-requests'] });
    // 수락하면 원본 프로젝트가 갱신되므로 관리 목록도 함께 무효화한다.
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

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
  const deploymentUrl = getSafeDeploymentUrl(request.deploymentUrl);

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
          <DialogTitle
            className={cn('font-pixel flex items-center gap-2 text-[14px] leading-none')}
          >
            {request.name}
            <Badge variant="outline">{isEdit ? '수정' : '신규'}</Badge>
            <Badge variant={request.requestStatus === 'REJECTED' ? 'destructive' : 'secondary'}>
              {getProjectRequestStatusLabel(request.requestStatus)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className={cn('min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6')}>
          <div className={cn('flex items-start gap-3')}>
            {request.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.iconUrl}
                alt={`${request.name} 아이콘`}
                className={cn('border-foreground h-14 w-14 flex-shrink-0 border-2 object-cover')}
              />
            ) : (
              <div
                className={cn(
                  'border-foreground bg-muted text-foreground font-pixel flex h-14 w-14 flex-shrink-0 items-center justify-center border-2 text-sm',
                )}
              >
                {request.name.charAt(0)}
              </div>
            )}

            <div className={cn('min-w-0 flex-1 space-y-1')}>
              <p className={cn(LABEL_STYLE)}>신청자</p>
              <p className={cn('text-foreground text-sm')}>
                {request.requestedBy.name}
                <span className={cn('text-muted-foreground ml-2 font-mono text-xs')}>
                  {getMajorLabel(request.requestedBy.major)} · {request.requestedBy.studentNumber}
                </span>
              </p>
              <p className={cn('text-muted-foreground break-all font-mono text-xs')}>
                {request.requestedBy.email}
              </p>
              <p className={cn('text-muted-foreground font-mono text-xs')}>
                신청일 {formatDate(request.requestedAt)}
                {request.processedAt && ` · 처리일 ${formatDate(request.processedAt)}`}
              </p>
            </div>
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

          {/* 아래 항목은 비어 있어도 섹션을 남긴다. "신청자가 입력하지 않음"과 "화면에 없음"을 구분해야 하기 때문. */}
          <div className={cn('space-y-1')}>
            <p className={cn(LABEL_STYLE)}>배포 URL</p>
            {deploymentUrl ? (
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'text-muted-foreground hover:text-foreground break-all font-mono text-xs',
                )}
              >
                {deploymentUrl}
              </a>
            ) : (
              <p className={cn(EMPTY_STYLE)}>입력하지 않음</p>
            )}
          </div>

          <div className={cn('space-y-1')}>
            <p className={cn(LABEL_STYLE)}>참여자</p>
            {request.participants.length > 0 ? (
              <div className={cn('flex flex-wrap gap-1')}>
                {request.participants.map((participant) => (
                  <Badge key={participant.id} variant="outline">
                    {participant.name} · {getMajorLabel(participant.major)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className={cn(EMPTY_STYLE)}>입력하지 않음</p>
            )}
          </div>

          <div className={cn('space-y-1')}>
            <p className={cn(LABEL_STYLE)}>기술 스택</p>
            {request.techStacks.length > 0 ? (
              <div className={cn('flex flex-wrap gap-1')}>
                {request.techStacks.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className={cn(EMPTY_STYLE)}>입력하지 않음</p>
            )}
          </div>

          <div className={cn('space-y-1')}>
            <p className={cn(LABEL_STYLE)}>리포지토리</p>
            {request.repositories.length > 0 ? (
              <ul className={cn('flex flex-col gap-1')}>
                {request.repositories.map((repo) => (
                  <li key={repo}>
                    <a
                      href={repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'text-muted-foreground hover:text-foreground break-all font-mono text-xs',
                      )}
                    >
                      {repo}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn(EMPTY_STYLE)}>입력하지 않음</p>
            )}
          </div>

          {request.requestStatus === 'REJECTED' && request.rejectReason && (
            <div
              className={cn(
                'border-destructive text-destructive border-l-2 pl-2 font-mono text-xs',
              )}
            >
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
                  maxLength={REJECT_REASON_MAX_LENGTH}
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
