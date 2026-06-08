'use client';

import { useState } from 'react';

import { PageHeader } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { CreateWebhookData, MAX_WEBHOOKS_PER_ACCOUNT, Webhook } from '@/entities/webhooks';
import { useGetWebhooks } from '@/views/webhooks';
import { WebhookFormDialog, WebhookList, WebhookSuccessDialog } from '@/widgets/webhooks';

const WebhooksPage = () => {
  const { data: webhooksData, isLoading } = useGetWebhooks();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState<CreateWebhookData | null>(null);

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setIsEditDialogOpen(true);
  };

  const handleCreateSuccess = (data: CreateWebhookData) => {
    setCreatedWebhook(data);
    setIsSuccessDialogOpen(true);
  };

  const webhooks = webhooksData?.data.webhooks || [];
  const isAtLimit = webhooks.length >= MAX_WEBHOOKS_PER_ACCOUNT;

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageHeader
          breadcrumb="DATAGSM / Webhook"
          title="웹훅"
          action={
            <WebhookFormDialog
              mode="create"
              onCreateSuccess={handleCreateSuccess}
              disabled={isAtLimit}
            />
          }
        />

        {isAtLimit && (
          <p className={cn('text-muted-foreground mb-3 font-mono text-xs')}>
            {'>'} 계정당 최대 {MAX_WEBHOOKS_PER_ACCOUNT}개의 웹훅을 등록할 수 있습니다.
          </p>
        )}

        <div className={cn('border-foreground pixel-shadow border-2')}>
          <WebhookList webhooks={webhooks} isLoading={isLoading} onEdit={handleEdit} />
        </div>
      </main>

      <WebhookSuccessDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        webhook={createdWebhook}
      />

      <WebhookFormDialog
        mode="edit"
        webhook={editingWebhook ?? undefined}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
};

export default WebhooksPage;
