import { DM_Sans, JetBrains_Mono, Press_Start_2P } from 'next/font/google';
import localFont from 'next/font/local';

import { TanStackProvider, ToastProvider } from '@repo/shared/lib';
import { Header, TooltipProvider } from '@repo/shared/ui';
import type { Metadata } from 'next';

import '@/shared/styles/globals.css';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

const galmuri11 = localFont({
  src: '../../node_modules/galmuri/dist/Galmuri11-Bold.woff2',
  display: 'swap',
  variable: '--font-korean-pixel',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
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
    <html
      lang="ko"
      className={`${pressStart2P.variable} ${galmuri11.variable} ${jetbrainsMono.variable} ${dmSans.variable}`}
    >
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
