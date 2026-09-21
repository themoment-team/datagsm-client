import Link from 'next/link';

import { DOCS_URL } from '@repo/shared/constants';
import { Button } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

const NotFound = () => {
  return (
    <div
      className={cn(
        'bg-background flex h-[calc(100vh-4.0625rem)] flex-col items-center justify-center px-4',
      )}
    >
      <div className={cn('flex max-w-md flex-col items-center text-center')}>
        <h1 className={cn('text-foreground text-8xl font-bold tracking-tighter')}>404</h1>

        <p className={cn('text-foreground mt-4 text-xl font-semibold')}>페이지를 찾을 수 없습니다</p>

        <div className={cn('mt-8 flex items-center gap-3')}>
          <Button asChild>
            <Link href="/">메인으로 돌아가기</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={DOCS_URL}>기술 문서 보기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
