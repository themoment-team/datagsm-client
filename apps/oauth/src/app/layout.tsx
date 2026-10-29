import { fontVariables } from '@repo/shared/fonts';
import { TanStackProvider, ToastProvider } from '@repo/shared/lib';
import { TooltipProvider } from '@repo/shared/ui';
import type { Metadata } from 'next';

import '@/shared/styles/globals.css';

export const metadata: Metadata = {
  title: 'DataGSM-OAuth',
  description: '광주소프트웨어마이스터고등학교 OpenAPI & OAuth 플랫폼 인증 서버',
};

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko" className={fontVariables}>
      <body>
        <TanStackProvider>
          <ToastProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ToastProvider>
        </TanStackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
