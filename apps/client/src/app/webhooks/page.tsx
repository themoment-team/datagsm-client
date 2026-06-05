import { Suspense } from 'react';

import { WebhooksPage } from '@/views/webhooks';

const Webhooks = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WebhooksPage />
    </Suspense>
  );
};

export default Webhooks;
