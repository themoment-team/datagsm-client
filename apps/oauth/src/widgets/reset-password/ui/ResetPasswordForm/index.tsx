'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { EMAIL_DOMAIN } from '@repo/shared/constants';
import { useDebounce } from '@repo/shared/hooks';
import { AuthWindow, Button, FormErrorMessage, Input } from '@repo/shared/ui';
import {
  cn,
  formatEmailWithDomain,
  getApiErrorCode,
  getRateLimitMessage,
  minutesToMs,
} from '@repo/shared/utils';
import { Eye, EyeOff } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ResetPasswordFormSchema, ResetPasswordFormType } from '@/entities/reset-password';
import {
  useChangePassword,
  useSendPasswordResetEmail,
  useVerifyPasswordResetCode,
} from '@/widgets/reset-password';

const ERROR_MESSAGE_CLASS = "text-destructive text-xs leading-4 before:mr-1 before:content-['>']";
const FIELD_CLASS =
  'border-foreground focus-visible:border-foreground aria-invalid:border-destructive aria-invalid:text-destructive rounded-none focus-visible:ring-0';

const RESEND_COOLDOWN_MS = minutesToMs(5);
const STORAGE_KEY = 'password_reset_verification_timestamp';

const ResetPasswordForm = () => {
  const [codeSent, setCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
    setValue,
  } = useForm<ResetPasswordFormType>({
    resolver: zodResolver(ResetPasswordFormSchema),
  });

  const codeValue = watch('code');
  const emailValue = watch('email');
  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');
  const debouncedCode = useDebounce(codeValue, 1000);
  const lastCheckedCode = useRef('');
  const hasShownExpiredToast = useRef(false);

  const isFormValid = ResetPasswordFormSchema.safeParse({
    email: emailValue,
    password: passwordValue,
    code: codeValue,
    confirmPassword: confirmPasswordValue,
  }).success;

  useEffect(() => {
    const lastSentTime = localStorage.getItem(STORAGE_KEY);
    if (lastSentTime) {
      const elapsed = Date.now() - parseInt(lastSentTime, 10);
      if (elapsed < RESEND_COOLDOWN_MS) {
        setCodeSent(true);
        setRemainingTime(Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === 1) {
            localStorage.removeItem(STORAGE_KEY);
            setCodeSent(false);
            if (!isCodeVerified) {
              setIsCodeVerified(false);
              lastCheckedCode.current = '';
              setValue('code', '');
              if (!hasShownExpiredToast.current) {
                hasShownExpiredToast.current = true;
                toast.error('인증 시간이 만료되었습니다. 다시 인증해주세요.');
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime, setValue, isCodeVerified]);

  const { mutate: sendEmailCode, isPending: isSendingCode } = useSendPasswordResetEmail({
    onSuccess: () => {
      const timestamp = Date.now();
      localStorage.setItem(STORAGE_KEY, timestamp.toString());
      setCodeSent(true);
      setRemainingTime(RESEND_COOLDOWN_MS / 1000);
      hasShownExpiredToast.current = false;
      toast.success('인증 코드가 이메일로 전송되었습니다.');
    },
    onError: (error: unknown) => {
      const statusCode = getApiErrorCode(error);
      switch (statusCode) {
        case 404:
          toast.error('존재하지 않는 이메일입니다.');
          break;
        case 429:
          toast.error(getRateLimitMessage(error));
          break;
        default:
          toast.error('인증 코드 전송에 실패했습니다.');
      }
    },
  });

  const { mutate: checkEmailCode } = useVerifyPasswordResetCode({
    onSuccess: () => {
      setIsCodeVerified(true);
      toast.success('인증 코드가 확인되었습니다.');
    },
    onError: (error: unknown) => {
      const statusCode = getApiErrorCode(error);
      switch (statusCode) {
        case 400:
          setIsCodeVerified(false);
          toast.error('인증 코드가 일치하지 않습니다.');
          break;
        case 404:
          setIsCodeVerified(false);
          toast.error('인증 코드가 만료되었거나 존재하지 않습니다.');
          break;
        case 429:
          setIsCodeVerified(false);
          toast.error(getRateLimitMessage(error));
          break;
        default:
          setIsCodeVerified(false);
          toast.error('인증 코드 확인에 실패했습니다.');
      }
    },
  });

  useEffect(() => {
    if (
      codeSent &&
      debouncedCode &&
      debouncedCode.length === 8 &&
      lastCheckedCode.current !== debouncedCode
    ) {
      lastCheckedCode.current = debouncedCode;
      checkEmailCode({ email: formatEmailWithDomain(emailValue), code: debouncedCode });
    }
  }, [codeSent, debouncedCode, emailValue, checkEmailCode]);

  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword({
    onSuccess: () => {
      router.push('/success?page=reset');
    },
    onError: (error: unknown) => {
      const statusCode = getApiErrorCode(error);
      switch (statusCode) {
        case 400:
          toast.error('이전 비밀번호와 동일합니다.');
          break;
        case 404:
          toast.error('계정이 존재하지 않습니다.');
          break;
        case 429:
          toast.error(getRateLimitMessage(error));
          break;
        default:
          toast.error('비밀번호 변경에 실패했습니다.');
      }
    },
  });

  const handleSendCode = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;
    const email = getValues('email');
    sendEmailCode({ email: formatEmailWithDomain(email) });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canResend = remainingTime === 0;
  const isButtonDisabled =
    isSendingCode || !emailValue || (codeSent && !canResend) || isCodeVerified;

  const onSubmit: SubmitHandler<ResetPasswordFormType> = (data) => {
    if (!isCodeVerified) {
      toast.error('이메일 인증을 완료해주세요.');
      return;
    }
    const { email, code, password } = data;
    changePassword({ email: formatEmailWithDomain(email), code, newPassword: password });
  };

  return (
    <AuthWindow
      windowLabel="Reset Password"
      title="비밀번호 초기화"
      description={
        <>
          <span className={cn('font-mono font-bold')}>{EMAIL_DOMAIN}</span> 도메인 계정만 사용
          가능합니다.
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={cn('flex flex-col gap-5 px-5 pt-5')}>
          {/* 이메일 인증 */}
          <div className={cn('flex flex-col gap-2')}>
            <p className={cn('text-foreground text-sm font-medium')}>이메일 인증</p>

            <div className={cn('flex items-start gap-2')}>
              <div className={cn('flex flex-1 flex-col gap-1.5')}>
                <div className={cn('flex')}>
                  <Input
                    id="email"
                    type="text"
                    aria-label="이메일"
                    aria-invalid={!!errors.email}
                    placeholder="이메일을 입력하세요"
                    {...register('email')}
                    disabled={remainingTime > 0 || isCodeVerified}
                    className={cn(FIELD_CLASS, 'flex-1')}
                  />
                  <span
                    className={cn(
                      'border-foreground bg-muted text-muted-foreground flex items-center whitespace-nowrap border border-l-0 px-3 font-mono text-sm',
                    )}
                  >
                    {EMAIL_DOMAIN}
                  </span>
                </div>
                <FormErrorMessage error={errors.email} className={cn(ERROR_MESSAGE_CLASS)} />
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={isButtonDisabled}
                className={cn(
                  'border-foreground bg-foreground text-background hover:bg-background hover:text-foreground h-9 flex-shrink-0 cursor-pointer border px-3 font-mono text-xs tracking-[1.2px] transition-all disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {isSendingCode
                  ? '전송 중'
                  : codeSent && !canResend
                    ? formatTime(remainingTime)
                    : codeSent && canResend
                      ? '재전송'
                      : '코드전송'}
              </button>
            </div>

            <div className={cn('flex flex-col gap-1.5')}>
              <Input
                id="code"
                type="text"
                aria-label="인증 코드"
                aria-invalid={!!errors.code}
                placeholder="인증 코드를 입력하세요"
                {...register('code')}
                disabled={!codeSent || isCodeVerified}
                className={cn(FIELD_CLASS)}
              />
              {isCodeVerified ? (
                <p
                  className={cn(
                    "text-xs leading-4 text-green-600 before:mr-1 before:content-['>']",
                  )}
                >
                  인증 완료
                </p>
              ) : (
                <FormErrorMessage error={errors.code} className={cn(ERROR_MESSAGE_CLASS)} />
              )}
            </div>
          </div>

          {/* 새로운 비밀번호 */}
          <div className={cn('flex flex-col gap-2')}>
            <p className={cn('text-foreground text-sm font-medium')}>새로운 비밀번호</p>

            <div className={cn('flex flex-col gap-1.5')}>
              <div className={cn('relative')}>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  aria-label="새로운 비밀번호"
                  aria-invalid={!!errors.password}
                  placeholder="새로운 비밀번호를 입력하세요"
                  {...register('password')}
                  disabled={!isCodeVerified || isChangingPassword}
                  className={cn(FIELD_CLASS, 'pr-10')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    'text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                    (!isCodeVerified || isChangingPassword) && 'cursor-not-allowed opacity-50',
                  )}
                  disabled={!isCodeVerified || isChangingPassword}
                >
                  {showPassword ? (
                    <EyeOff className={cn('size-4')} />
                  ) : (
                    <Eye className={cn('size-4')} />
                  )}
                </button>
              </div>
              <FormErrorMessage error={errors.password} className={cn(ERROR_MESSAGE_CLASS)} />
            </div>

            <div className={cn('flex flex-col gap-1.5')}>
              <div className={cn('relative')}>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  aria-label="비밀번호 확인"
                  aria-invalid={!!errors.confirmPassword}
                  placeholder="비밀번호를 다시 입력하세요"
                  {...register('confirmPassword')}
                  disabled={!isCodeVerified || isChangingPassword}
                  className={cn(FIELD_CLASS, 'pr-10')}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={cn(
                    'text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                    (!isCodeVerified || isChangingPassword) && 'cursor-not-allowed opacity-50',
                  )}
                  disabled={!isCodeVerified || isChangingPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className={cn('size-4')} />
                  ) : (
                    <Eye className={cn('size-4')} />
                  )}
                </button>
              </div>
              <FormErrorMessage
                error={errors.confirmPassword}
                className={cn(ERROR_MESSAGE_CLASS)}
              />
            </div>
          </div>
        </div>

        <div className={cn('flex flex-col items-center gap-4 p-5')}>
          <Button
            type="submit"
            variant="pixel-solid"
            size="lg"
            className={cn('w-full')}
            disabled={isChangingPassword || !isCodeVerified || !isFormValid}
          >
            {isChangingPassword ? 'PROCESSING...' : 'RESET PASSWORD'}
          </Button>

          <button
            type="button"
            onClick={() => window.close()}
            className={cn(
              'text-foreground cursor-pointer text-xs leading-4 underline underline-offset-2',
            )}
          >
            비밀번호가 기억나셨나요?
          </button>
        </div>
      </form>
    </AuthWindow>
  );
};

export default ResetPasswordForm;
