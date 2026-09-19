'use client';

import { MyAccountResponse } from '@repo/shared/types';
import { PageHeader, Skeleton } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { useGetMy } from '@/shared/hooks';
import { ProfileInfo, SessionManagement, WithdrawalSection } from '@/widgets/myinfo';

interface MyInfoPageProps {
  initialData: MyAccountResponse | undefined;
}

const MyInfoPage = ({ initialData }: MyInfoPageProps) => {
  const { data: myData, isLoading, isError } = useGetMy({ initialData });

  if (isLoading && !initialData) {
    return (
      <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
        <main className={cn('container mx-auto px-4 py-8')}>
          <div className={cn('border-foreground mb-6 border-b-2 pb-4')}>
            <Skeleton className={cn('mb-2 h-3 w-32')} />
            <Skeleton className={cn('h-5 w-24')} />
          </div>
          <div className={cn('mx-auto max-w-2xl space-y-4')}>
            <Skeleton className={cn('h-28 w-full')} />
            <Skeleton className={cn('h-64 w-full')} />
            <Skeleton className={cn('h-48 w-full')} />
          </div>
        </main>
      </div>
    );
  }

  if (isError || !myData?.data) {
    return (
      <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
        <main className={cn('container mx-auto px-4 py-8')}>
          <div className={cn('border-foreground border-2 px-6 py-12 text-center')}>
            <p className={cn('font-pixel text-[12px]')}>오류</p>
            <p className={cn('text-muted-foreground mt-3 font-mono text-sm')}>
              로그인 상태를 확인하거나 잠시 후 다시 시도해주세요.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto px-4 py-8')}>
        {/* Page header */}
        <PageHeader breadcrumb="DATAGSM / My Account" title="내 정보" />
        <div className={cn('mx-auto max-w-2xl space-y-4 pb-16')}>
          <ProfileInfo data={myData.data} />
          <SessionManagement />
          <WithdrawalSection />
        </div>
      </main>
    </div>
  );
};

export default MyInfoPage;
