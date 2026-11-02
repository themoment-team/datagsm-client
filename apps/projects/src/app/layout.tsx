import localFont from 'next/font/local';

import { fontVariables } from '@repo/shared/fonts';
import { TanStackProvider, ToastProvider } from '@repo/shared/lib';
import { Header, TooltipProvider } from '@repo/shared/ui';
import type { Metadata } from 'next';

import '@/shared/styles/globals.css';

const galmuri11 = localFont({
  src: '../../node_modules/galmuri/dist/Galmuri11-Bold.woff2',
  display: 'swap',
  variable: '--font-korean-pixel',
});

export const metadata: Metadata = {
  title: 'DataGSM Projects',
  description: '광주소프트웨어마이스터고등학교 학생 프로젝트 아카이브',
  openGraph: {
    title: 'DataGSM Projects',
    description: '광주소프트웨어마이스터고등학교 학생 프로젝트 아카이브',
    url: 'https://projects.datagsm.kr/',
    siteName: 'DataGSM Projects',
    type: 'website',
  },
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
            <TooltipProvider>
              <Header role="projects" />
              {children}
            </TooltipProvider>
          </ToastProvider>
        </TanStackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
