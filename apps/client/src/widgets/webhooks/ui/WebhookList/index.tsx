'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  PixelIconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Webhook } from '@/entities/webhooks';
import { useDeleteWebhook } from '@/widgets/webhooks';

interface WebhookListProps {
  webhooks?: Webhook[];
  isLoading?: boolean;
  onEdit: (webhook: Webhook) => void;
}

interface WebhookListItemProps {
  webhook: Webhook;
  onEdit: (webhook: Webhook) => void;
  onDelete: (id: number) => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR');
};

const WebhookListItem = ({ webhook, onEdit, onDelete }: WebhookListItemProps) => {
  return (
    <TableRow>
      <TableCell className={cn('max-w-xs truncate font-mono text-sm')}>
        {webhook.target_url}
      </TableCell>
      <TableCell>
        <div className={cn('flex flex-wrap gap-1')}>
          {webhook.events.map((event) => (
            <span
              key={event}
              className={cn('bg-foreground text-background px-1.5 py-0.5 font-mono text-xs')}
            >
              {event}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'border px-1.5 py-0.5 font-mono text-xs uppercase',
            webhook.is_active
              ? 'border-foreground text-foreground'
              : 'border-muted-foreground/40 text-muted-foreground',
          )}
        >
          {webhook.is_active ? 'active' : 'inactive'}
        </span>
      </TableCell>
      <TableCell className={cn('text-muted-foreground font-mono text-xs')}>
        {formatDate(webhook.created_at)}
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-1')}>
          <PixelIconButton onClick={() => onEdit(webhook)}>
            <Pencil className={cn('h-3.5 w-3.5')} />
          </PixelIconButton>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <PixelIconButton variant="destructive">
                <Trash2 className={cn('h-3.5 w-3.5')} />
              </PixelIconButton>
            </AlertDialogTrigger>
            <AlertDialogContent className={cn('border-foreground pixel-shadow border-2')}>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-pixel text-[12px] leading-[1.8]">
                  웹훅 삭제
                </AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 이 웹훅을 삭제하시겠습니까? 삭제 후에는 해당 이벤트가 더 이상 전송되지
                  않으며, 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(webhook.id)}
                  className={cn(
                    'bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white',
                  )}
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
};

const WebhookList = ({ webhooks, isLoading, onEdit }: WebhookListProps) => {
  const queryClient = useQueryClient();

  const { mutate: deleteWebhook } = useDeleteWebhook({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('웹훅이 삭제되었습니다.');
    },
    onError: () => {
      toast.error('웹훅 삭제에 실패했습니다.');
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>수신 URL</TableHead>
          <TableHead>구독 이벤트</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>생성일</TableHead>
          <TableHead className={cn('w-24')}>작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className={cn('h-4 w-48')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-4 w-40')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-4 w-16')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-4 w-32')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-7 w-16')} />
              </TableCell>
            </TableRow>
          ))
        ) : webhooks && webhooks.length > 0 ? (
          webhooks.map((webhook) => (
            <WebhookListItem
              key={webhook.id}
              webhook={webhook}
              onEdit={onEdit}
              onDelete={(id) => deleteWebhook(id)}
            />
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className={cn('text-muted-foreground h-24 text-center font-mono')}>
              {'>'} 등록된 웹훅이 없습니다.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default WebhookList;
