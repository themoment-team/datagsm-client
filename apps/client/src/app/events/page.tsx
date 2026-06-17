import { Suspense } from 'react';

import { EventsPage } from '@/views/events';

const Events = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventsPage />
    </Suspense>
  );
};

export default Events;
