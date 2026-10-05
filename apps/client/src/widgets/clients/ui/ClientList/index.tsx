'use client';

import { useCopyToClipboard } from '@repo/shared/hooks';
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
import { cn, getAfterColon } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Client } from '@/entities/clients';
import { useDeleteClient } from '@/widgets/clients';

interface ClientListProps {
  clients?: Client[];
  isLoading?: boolean;
  onEdit: (client: Client) => void;
}

interface ClientListItemProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

const ClientListItem = ({ client, onEdit, onDelete }: ClientListItemProps) => {
  const { copied, copy } = useCopyToClipboard({
    successMessage: '클라이언트 ID가 복사되었습니다.',
  });

  return (
    <TableRow>
      <TableCell className={cn('font-medium')}>{client.clientName}</TableCell>
      <TableCell className={cn('text-muted-foreground')}>{client.serviceName}</TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-2')}>
          <code className={cn('bg-muted px-2 py-1 font-mono text-xs')}>{client.id}</code>
          <PixelIconButton
            size="sm"
            onClick={() => copy(client.id)}
            aria-label={`${client.clientName} (${client.id}) 클라이언트 ID 복사`}
          >
            {copied ? <Check className={cn('h-3 w-3')} /> : <Copy className={cn('h-3 w-3')} />}
          </PixelIconButton>
        </div>
      </TableCell>
      <TableCell>
        <div className={cn('flex flex-wrap gap-1')}>
          {client.redirectUrl.map((url, index) => (
            <span
              key={index}
              className={cn(
                'border-foreground/25 text-muted-foreground border px-1.5 py-0.5 font-mono text-xs',
              )}
            >
              {url}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className={cn('flex flex-wrap gap-1')}>
          {client.scopes.map((scope, index) => (
            <span
              key={index}
              className={cn(
                'bg-foreground text-background px-1.5 py-0.5 font-mono text-xs uppercase',
              )}
            >
              {getAfterColon(scope)}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-1')}>
          <PixelIconButton
            onClick={() => onEdit(client)}
            aria-label={`${client.clientName} (${client.id}) 클라이언트 수정`}
          >
            <Pencil className={cn('h-3.5 w-3.5')} />
          </PixelIconButton>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <PixelIconButton
                variant="destructive"
                aria-label={`${client.clientName} (${client.id}) 클라이언트 삭제`}
              >
                <Trash2 className={cn('h-3.5 w-3.5')} />
              </PixelIconButton>
            </AlertDialogTrigger>
            <AlertDialogContent className={cn('border-foreground pixel-shadow border-2')}>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-pixel text-[12px] leading-[1.8]">
                  클라이언트 삭제
                </AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 &apos;{client.clientName}&apos; 클라이언트를 삭제하시겠습니까? 이 작업은
                  되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(client.id)}
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

const ClientList = ({ clients, isLoading, onEdit }: ClientListProps) => {
  const queryClient = useQueryClient();

  const { mutate: deleteClient } = useDeleteClient({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('클라이언트가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('클라이언트 삭제에 실패했습니다.');
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>클라이언트 이름</TableHead>
          <TableHead>서비스 명칭</TableHead>
          <TableHead>클라이언트 ID</TableHead>
          <TableHead>리다이렉트 URL</TableHead>
          <TableHead>권한 범위</TableHead>
          <TableHead className={cn('w-24')}>작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className={cn('h-4 w-32')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-4 w-24')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-6 w-48')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-4 w-60')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-4 w-24')} />
              </TableCell>
              <TableCell>
                <Skeleton className={cn('h-7 w-16')} />
              </TableCell>
            </TableRow>
          ))
        ) : clients && clients.length > 0 ? (
          clients.map((client) => (
            <ClientListItem
              key={client.id}
              client={client}
              onEdit={onEdit}
              onDelete={(id) => deleteClient(id)}
            />
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={6}
              className={cn('text-muted-foreground h-24 text-center font-mono')}
            >
              {'>'} 등록된 클라이언트가 없습니다.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default ClientList;
