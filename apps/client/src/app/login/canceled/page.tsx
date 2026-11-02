import { Suspense } from 'react';

import { LoginCanceledWindow } from '@repo/shared/ui';

// 로그인하지 않은 채로 원래 경로에 들어가면 미들웨어가 인가를 다시 시작하므로 로그인 경로를 따로 넘기지 않는다.
const LoginCanceled = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginCanceledWindow />
    </Suspense>
  );
};

export default LoginCanceled;
