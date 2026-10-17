'use client';

import { cn } from '@repo/shared/utils';

import { OAuthConsentForm } from '@/widgets/oauth';

const OAuthConsentPage = () => {
  return (
    <div className={cn('bg-background flex min-h-screen items-center justify-center px-4')}>
      <OAuthConsentForm />
    </div>
  );
};

export default OAuthConsentPage;
