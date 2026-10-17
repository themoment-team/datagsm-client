import { createOAuthCallbackHandler } from '@repo/shared/server';

export const GET = createOAuthCallbackHandler({
  getClientSecret: () => process.env.DATAGSM_CLIENT_SECRET,
});
