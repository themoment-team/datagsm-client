import localFont from 'next/font/local';

import { fontVariables } from '@repo/shared/fonts';
import { TanStackProvider, ToastProvider } from '@repo/shared/lib';
import { Header, TooltipProvider } from '@repo/shared/ui';
import type { Metadata } from 'next';

import { GoogleAnalytics } from '@/shared/lib';
import { SoundModeProvider } from '@/shared/sound-mode';
import '@/shared/styles/globals.css';

const galmuri11 = localFont({
  src: '../../node_modules/galmuri/dist/Galmuri11-Bold.woff2',
  display: 'swap',
  variable: '--font-korean-pixel',
});

export const metadata: Metadata = {
  title: 'DataGSM',
  description: '광주소프트웨어마이스터고등학교 OpenAPI & OAuth 플랫폼',
  openGraph: {
    title: 'DataGSM',
    description: '광주소프트웨어마이스터고등학교 OpenAPI & OAuth 플랫폼',
    url: 'https://www.datagsm.kr/',
    siteName: 'DataGSM',
    images: 'https://www.datagsm.kr/images/og-image.png',
    type: 'website',
  },
};

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko" className={`${fontVariables} ${galmuri11.variable}`}>
      <body>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
        <TanStackProvider>
          <ToastProvider>
            <TooltipProvider>
              <SoundModeProvider>
                <Header role="client" />
                {children}
              </SoundModeProvider>
            </TooltipProvider>
          </ToastProvider>
        </TanStackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
