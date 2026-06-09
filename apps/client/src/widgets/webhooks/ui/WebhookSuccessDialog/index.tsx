'use client';

import { useCopyToClipboard } from '@repo/shared/hooks';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Label } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { AlertTriangle, Check, Copy } from 'lucide-react';

import { CreateWebhookData } from '@/entities/webhooks';

interface WebhookSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: CreateWebhookData | null;
}

const WebhookSuccessDialog = ({ open, onOpenChange, webhook }: WebhookSuccessDialogProps) => {
  const { copied: copiedSecret, copy: copySecret } = useCopyToClipboard({
    successMessage: 'Secret이 복사되었습니다.',
  });

  if (!webhook) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-md p-0')}>
        <DialogHeader className={cn('border-foreground border-b-2 px-6 py-5')}>
          <DialogTitle
            className={cn('font-pixel flex items-center gap-2 text-[14px] leading-none')}
          >
            <Check className={cn('h-4 w-4')} />
            WEBHOOK CREATED
          </DialogTitle>
        </DialogHeader>
        <div className={cn('space-y-4 px-6 py-6')}>
          <div className={cn('border-foreground/50 bg-muted rounded-none border-2 p-4')}>
            <div className={cn('flex gap-3')}>
              <AlertTriangle className={cn('text-foreground mt-0.5 h-5 w-5 shrink-0')} />
              <div className={cn('text-sm')}>
                <p className={cn('font-mono text-xs font-medium uppercase tracking-widest')}>
                  중요: Secret을 안전하게 저장하세요
                </p>
                <p className={cn('text-muted-foreground mt-1 text-xs')}>
                  서명 검증용 secret은 이 창을 닫으면 다시 확인할 수 없습니다. 반드시 복사하여 안전한
                  곳에 보관하세요.
                </p>
              </div>
            </div>
          </div>

          <div className={cn('space-y-3')}>
            <div className={cn('space-y-1.5')}>
              <Label
                className={cn('text-muted-foreground font-mono text-xs uppercase tracking-widest')}
              >
                수신 URL
              </Label>
              <p className={cn('break-all font-mono text-sm')}>{webhook.target_url}</p>
            </div>

            <div className={cn('space-y-1.5')}>
              <Label
                className={cn('text-muted-foreground font-mono text-xs uppercase tracking-widest')}
              >
                Secret
              </Label>
              <div className={cn('flex items-center gap-2')}>
                <code
                  className={cn(
                    'bg-muted border-foreground/30 flex-1 break-all rounded-none border px-3 py-2 font-mono text-sm',
                  )}
                >
                  {webhook.secret}
                </code>
                <Button variant="outline" size="icon" onClick={() => copySecret(webhook.secret)}>
                  {copiedSecret ? (
                    <Check className={cn('h-4 w-4')} />
                  ) : (
                    <Copy className={cn('h-4 w-4')} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className={cn('flex justify-end px-6 pb-6')}>
          <Button onClick={() => onOpenChange(false)}>확인</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookSuccessDialog;
