import { Suspense } from 'react';

import { LoginCanceledWindow } from '@repo/shared/ui';

// projects는 미들웨어 없이 둘러보는 공개 앱이라 원래 경로로 가도 로그인이 시작되지 않는다.
// startLogin과 같이 /api/login으로 로그인을 시작한다.
const LoginCanceled = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginCanceledWindow loginPath="/api/login" />
    </Suspense>
  );
};

export default LoginCanceled;
