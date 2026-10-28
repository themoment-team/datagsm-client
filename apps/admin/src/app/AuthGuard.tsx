'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { oauthPost, oauthUrl } from '@repo/shared/api';
import { LOGIN_CANCELED_PATH, STATUS_URL } from '@repo/shared/constants';
import { logoutLocally } from '@repo/shared/lib';
import { AuthWindow, Button } from '@repo/shared/ui';
import { cn, getIsAuthenticated } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';

import { useGetRole } from '@/entities/signin';

interface AuthGuardProps {
  children: React.ReactNode;
}

interface GuardWindowProps {
  title: string;
  description: string;
  isPending?: boolean;
  children: React.ReactNode;
}

const GuardWindow = ({ title, description, isPending, children }: GuardWindowProps) => (
  <div className={cn('bg-background flex min-h-screen items-center justify-center px-4')}>
    <AuthWindow windowLabel="Admin" title={title} description={description} isPending={isPending}>
      <div className={cn('flex items-center gap-3 p-5')}>{children}</div>
    </AuthWindow>
  </div>
);

/** 로그인한 계정이 관리자인지 확인하고, 아니면 안내 화면을 보여 준다. */
const RoleGuard = ({ children }: AuthGuardProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const isAuthenticated = getIsAuthenticated();
  const { data: role, isLoading, isError, isFetching, refetch } = useGetRole();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [pathname, isAuthenticated, refetch]);

  const handleSwitchAccount = async () => {
    setIsSwitchingAccount(true);

    try {
      // IdP 세션이 남아 있으면 다시 인가할 때 로그인 폼 없이 같은 계정으로 돌아온다.
      await oauthPost(oauthUrl.postLogout(), undefined, { withCredentials: true });
    } catch {
      // 실패해도 이 서비스의 로컬 로그아웃은 막지 않는다.
    }

    queryClient.clear();
    await logoutLocally();
    window.location.href = '/';
  };

  const forbiddenWindow = (
    <GuardWindow
      title="접근 권한 없음"
      description="지금 로그인한 계정에는 관리자 권한이 없습니다. 관리자 계정으로 다시 로그인해주세요."
      isPending={isSwitchingAccount}
    >
      <Button
        type="button"
        variant="pixel-solid"
        size="lg"
        className={cn('flex-1')}
        disabled={isSwitchingAccount}
        onClick={handleSwitchAccount}
      >
        다른 계정으로 로그인
      </Button>
    </GuardWindow>
  );

  // 쿠키를 지운 뒤 페이지를 떠나기 전까지 관리자 화면이 잠깐 보이지 않게 한다.
  if (isSwitchingAccount) {
    return forbiddenWindow;
  }

  // 서버 사이드 렌더링 결과와 클라이언트의 첫 렌더링 결과를 일치킨다.
  if (!isMounted || !isAuthenticated) {
    return <>{children}</>;
  }

  // 401은 axios 인터셉터가 갱신·재로그인을 처리하므로, 여기까지 오는 오류는 주로 서버 장애다.
  // 쿠키를 지우고 이동하면 장애가 이어지는 동안 재로그인이 반복되므로 재시도만 안내한다.
  if (isError) {
    return (
      <GuardWindow
        title="오류"
        description="계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        isPending={isFetching}
      >
        <Button asChild type="button" variant="pixel" size="lg" className={cn('flex-1')}>
          <Link href={STATUS_URL} target="_blank" rel="noopener noreferrer">
            서버 상태 확인
          </Link>
        </Button>
        <Button
          type="button"
          variant="pixel-solid"
          size="lg"
          className={cn('flex-1')}
          disabled={isFetching}
          onClick={() => refetch()}
        >
          다시 시도
        </Button>
      </GuardWindow>
    );
  }

  if (isLoading || !role) {
    return null;
  }

  if (role !== 'ADMIN' && role !== 'ROOT') {
    return forbiddenWindow;
  }

  return <>{children}</>;
};

const AuthGuard = ({ children }: AuthGuardProps) => {
  const pathname = usePathname();

  // 로그인 취소 화면은 로그인하지 않은 채로 본다. 계정을 조회하면 401로 재로그인이 시작돼
  // 거부했던 동의 화면으로 되돌아가므로, 조회하는 RoleGuard를 아예 거치지 않는다.
  if (pathname === LOGIN_CANCELED_PATH) {
    return <>{children}</>;
  }

  return <RoleGuard>{children}</RoleGuard>;
};

export default AuthGuard;
