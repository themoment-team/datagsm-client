import localFont from 'next/font/local';

import { fontVariables } from '@repo/shared/fonts';
import { TanStackProvider } from '@repo/shared/lib';
import { Header } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { docsRootMetadata } from '@/shared/lib/metadata';
import '@/shared/styles/globals.css';
import { DocsSidebar } from '@/widgets/docs';

const galmuri11 = localFont({
  src: '../../node_modules/galmuri/dist/Galmuri11-Bold.woff2',
  display: 'swap',
  variable: '--font-korean-pixel',
});

export const metadata = docsRootMetadata;

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko" className={`${fontVariables} ${galmuri11.variable}`}>
      <body>
        <TanStackProvider>
          <Header role="docs" />
          <div className={cn('container mx-auto px-4 py-12')}>
            <div className={cn('mx-auto flex max-w-7xl flex-col lg:flex-row lg:gap-8')}>
              <DocsSidebar />
              <main className={cn('min-w-0 flex-1')}>{children}</main>
            </div>
          </div>
        </TanStackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
