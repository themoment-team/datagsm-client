import { createTokenRefreshHandler } from '@repo/shared/server';

export const POST = createTokenRefreshHandler({
  getClientSecret: () => process.env.DATAGSM_CLIENT_SECRET,
});
