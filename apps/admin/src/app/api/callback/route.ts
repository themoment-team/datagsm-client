import { createOAuthCallbackHandler } from '@repo/shared/server';

export const GET = createOAuthCallbackHandler({
  getClientSecret: () => process.env.NEXT_PUBLIC_DATAGSM_CLIENT_SECRET,
});
