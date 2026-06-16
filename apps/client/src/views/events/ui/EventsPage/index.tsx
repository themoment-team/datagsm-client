'use client';

import { useState } from 'react';

import { PageHeader } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { CreateEventData, Event, MAX_EVENTS_PER_ACCOUNT } from '@/entities/events';
import { useGetEvents } from '@/views/events';
import { EventFormDialog, EventList, EventSuccessDialog } from '@/widgets/events';

const EventsPage = () => {
  const { data: eventsData, isLoading } = useGetEvents();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<CreateEventData | null>(null);

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleCreateSuccess = (data: CreateEventData) => {
    setCreatedEvent(data);
    setIsSuccessDialogOpen(true);
  };

  const events = eventsData?.data.events || [];
  const isAtLimit = events.length >= MAX_EVENTS_PER_ACCOUNT;

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        <PageHeader
          breadcrumb="DATAGSM / Event"
          title="이벤트"
          action={
            <EventFormDialog
              mode="create"
              onCreateSuccess={handleCreateSuccess}
              disabled={isAtLimit}
            />
          }
        />

        {isAtLimit && (
          <p className={cn('text-muted-foreground mb-3 font-mono text-xs')}>
            {'>'} 계정당 최대 {MAX_EVENTS_PER_ACCOUNT}개의 이벤트를 등록할 수 있습니다.
          </p>
        )}

        <div className={cn('border-foreground pixel-shadow border-2')}>
          <EventList events={events} isLoading={isLoading} onEdit={handleEdit} />
        </div>
      </main>

      <EventSuccessDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        event={createdEvent}
      />

      <EventFormDialog
        mode="edit"
        event={editingEvent ?? undefined}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
};

export default EventsPage;
