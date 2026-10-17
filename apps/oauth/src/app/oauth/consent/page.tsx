import { Suspense } from 'react';

import { OAuthConsentPage } from '@/views/consent';

const OAuthConsent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OAuthConsentPage />
    </Suspense>
  );
};

export default OAuthConsent;
