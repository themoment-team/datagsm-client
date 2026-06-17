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

import { Event } from '@/entities/events';
import { useDeleteEvent } from '@/widgets/events';

interface EventListProps {
  events?: Event[];
  isLoading?: boolean;
  onEdit: (event: Event) => void;
}

interface EventListItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: number) => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR');
};

const EventListItem = ({ event, onEdit, onDelete }: EventListItemProps) => {
  return (
    <TableRow>
      <TableCell className={cn('max-w-xs truncate font-mono text-sm')}>
        {event.target_url}
      </TableCell>
      <TableCell>
        <div className={cn('flex flex-wrap gap-1')}>
          {event.events.map((eventType) => (
            <span
              key={eventType}
              className={cn('bg-foreground text-background px-1.5 py-0.5 font-mono text-xs')}
            >
              {eventType}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'border px-1.5 py-0.5 font-mono text-xs uppercase',
            event.is_active
              ? 'border-foreground text-foreground'
              : 'border-muted-foreground/40 text-muted-foreground',
          )}
        >
          {event.is_active ? 'active' : 'inactive'}
        </span>
      </TableCell>
      <TableCell className={cn('text-muted-foreground font-mono text-xs')}>
        {formatDate(event.created_at)}
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-1')}>
          <PixelIconButton onClick={() => onEdit(event)}>
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
                  이벤트 삭제
                </AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 이 이벤트를 삭제하시겠습니까? 삭제 후에는 해당 이벤트가 더 이상 전송되지
                  않으며, 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(event.id)}
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

const EventList = ({ events, isLoading, onEdit }: EventListProps) => {
  const queryClient = useQueryClient();

  const { mutate: deleteEvent } = useDeleteEvent({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('이벤트가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('이벤트 삭제에 실패했습니다.');
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
        ) : events && events.length > 0 ? (
          events.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={(id) => deleteEvent(id)}
            />
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className={cn('text-muted-foreground h-24 text-center font-mono')}>
              {'>'} 등록된 이벤트가 없습니다.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default EventList;
