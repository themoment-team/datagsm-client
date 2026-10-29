import localFont from 'next/font/local';

import { fontVariables } from '@repo/shared/fonts';
import { TanStackProvider, ToastProvider } from '@repo/shared/lib';
import { Header } from '@repo/shared/ui';
import type { Metadata } from 'next';

import '@/shared/styles/globals.css';

import AuthGuard from './AuthGuard';

const galmuri11 = localFont({
  src: '../../node_modules/galmuri/dist/Galmuri11-Bold.woff2',
  display: 'swap',
  variable: '--font-korean-pixel',
});

export const metadata: Metadata = {
  title: {
    template: 'DataGSM Admin | %s',
    default: 'DataGSM Admin',
  },
  description: '광주소프트웨어마이스터고등학교 OpenAPI 서비스 관리 페이지',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko" className={`${fontVariables} ${galmuri11.variable}`}>
      <body>
        <TanStackProvider>
          <ToastProvider>
            <AuthGuard>
              <Header role="admin" />
              {children}
            </AuthGuard>
          </ToastProvider>
        </TanStackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
