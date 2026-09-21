import { Suspense } from 'react';

import { AdminRequestsPage } from '@/views/admin-requests';

const AdminRequestsRoute = () => {
  return (
    <Suspense>
      <AdminRequestsPage />
    </Suspense>
  );
};

export default AdminRequestsRoute;
