'use client';

import { UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { EventFormType } from '@/entities/events';

interface UseEventSelectionParams {
  watch: UseFormWatch<EventFormType>;
  setValue: UseFormSetValue<EventFormType>;
}

export const useEventSelection = ({ watch, setValue }: UseEventSelectionParams) => {
  const fieldName = 'events';

  const handleEventToggle = (event: string) => {
    const currentEvents = watch(fieldName) || [];

    setValue(
      fieldName,
      currentEvents.includes(event)
        ? currentEvents.filter((id) => id !== event)
        : [...currentEvents, event],
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const isEventChecked = (event: string) => {
    const currentEvents = watch(fieldName) || [];

    return currentEvents.includes(event);
  };

  return {
    handleEventToggle,
    isEventChecked,
  };
};
