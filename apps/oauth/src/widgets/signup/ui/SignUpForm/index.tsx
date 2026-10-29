'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { EMAIL_DOMAIN } from '@repo/shared/constants';
import { useDebounce } from '@repo/shared/hooks';
import {
  AuthWindow,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  FormErrorMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/shared/ui';
import { cn, formatEmailWithDomain, getApiErrorCode } from '@repo/shared/utils';
import { Eye, EyeOff } from 'lucide-react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  SignUpFormType,
  SignUpObjectType,
  TEACHER_DEPARTMENT_OPTIONS,
  getSignUpFormSchema,
  getTeacherDepartmentLabel,
} from '@/entities/signup';
import { useEmailVerification, useSignUp } from '@/widgets/signup';

import { PRIVACY_POLICY } from '../../constants/privacyPolicy';
import { getRateLimitMessage } from '../../model/rateLimit';

const ERROR_MESSAGE_CLASS = "text-destructive text-xs leading-4 before:mr-1 before:content-['>']";
const FIELD_CLASS =
  'border-foreground focus-visible:border-foreground aria-invalid:border-destructive aria-invalid:text-destructive rounded-none focus-visible:ring-0';

interface SignUpFormProps {
  objectType?: SignUpObjectType;
}

const SignUpForm = ({ objectType = 'STUDENT' }: SignUpFormProps) => {
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isTeacher = objectType === 'TEACHER';

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
    setValue,
    control,
  } = useForm<SignUpFormType>({
    resolver: zodResolver(getSignUpFormSchema(objectType)),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      code: '',
      privacyAgreed: false,
    },
  });

  const codeValue = watch('code');
  const emailValue = watch('email');
  const debouncedCode = useDebounce(codeValue, 1000);
  const lastCheckedCode = useRef('');

  const {
    codeSent,
    isCodeVerified,
    remainingTime,
    isSendingCode,
    canResend,
    sendCode,
    verifyCode,
  } = useEmailVerification({
    onCodeExpired: () => {
      lastCheckedCode.current = '';
      setValue('code', '');
    },
  });

  const handlePrivacyCheckboxClick = () => {
    const isAgreed = getValues('privacyAgreed');
    if (!isAgreed) {
      setHasScrolledToBottom(false);
      setIsPrivacyDialogOpen(true);
    } else {
      setValue('privacyAgreed', false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handlePrivacyAgree = () => {
    setValue('privacyAgreed', true);
    setIsPrivacyDialogOpen(false);
    setHasScrolledToBottom(false);
  };

  useEffect(() => {
    if (isPrivacyDialogOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isPrivacyDialogOpen]);

  useEffect(() => {
    if (
      codeSent &&
      debouncedCode &&
      debouncedCode.length === 8 &&
      lastCheckedCode.current !== debouncedCode
    ) {
      lastCheckedCode.current = debouncedCode;
      verifyCode(formatEmailWithDomain(emailValue), debouncedCode);
    }
  }, [codeSent, debouncedCode, emailValue, verifyCode]);

  const { mutate: signUp, isPending: isSigningUp } = useSignUp({
    onSuccess: () => {
      router.push(isTeacher ? '/success?page=signup-teacher' : '/success?page=signup');
    },
    onError: (error: unknown) => {
      switch (getApiErrorCode(error)) {
        case 400:
          toast.error('입력 데이터를 확인해주세요.');
          break;
        case 404:
          toast.error('인증 코드가 만료되었거나 존재하지 않습니다.');
          break;
        case 409:
          toast.error(
            isTeacher
              ? '이미 해당 이메일로 가입되었거나 신청된 계정이 있습니다.'
              : '이미 존재하는 계정입니다.',
          );
          break;
        case 429:
          // 코드 확인 API와 한도를 나눠 쓰므로 코드를 여러 번 틀린 직후에도 걸릴 수 있다.
          toast.error(getRateLimitMessage(error));
          break;
        default:
          toast.error(isTeacher ? '회원가입 신청에 실패했습니다.' : '회원가입에 실패했습니다.');
      }
    },
  });

  const handleSendCode = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;
    sendCode(formatEmailWithDomain(getValues('email')));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isSendCodeDisabled =
    isSendingCode || !emailValue || (codeSent && !canResend) || isCodeVerified;

  const onSubmit: SubmitHandler<SignUpFormType> = (data) => {
    if (!isCodeVerified) {
      toast.error('이메일 인증을 완료해주세요.');
      return;
    }
    const { email, password, code, name, department, description } = data;

    if (isTeacher) {
      if (!name?.trim() || !department) return;
      signUp({
        objectType: 'TEACHER',
        email: formatEmailWithDomain(email),
        password,
        code,
        name: name.trim(),
        department,
        ...(description?.trim() ? { description: description.trim() } : {}),
      });
      return;
    }

    signUp({ objectType: 'STUDENT', email: formatEmailWithDomain(email), password, code });
  };

  return (
    <>
      <AuthWindow
        windowLabel="Sign Up"
        title={isTeacher ? '선생님 회원가입' : '회원가입'}
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
                      placeholder="이메일을 입력해주세요"
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
                  disabled={isSendCodeDisabled}
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
                  placeholder="인증 코드를 입력해주세요"
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

            {/* 비밀번호 */}
            <div className={cn('flex flex-col gap-2')}>
              <p className={cn('text-foreground text-sm font-medium')}>비밀번호</p>

              <div className={cn('flex flex-col gap-1.5')}>
                <div className={cn('relative')}>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    aria-label="비밀번호"
                    aria-invalid={!!errors.password}
                    placeholder="비밀번호를 입력해주세요"
                    {...register('password')}
                    disabled={!isCodeVerified || isSigningUp}
                    className={cn(FIELD_CLASS, 'pr-10')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      'text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                      (!isCodeVerified || isSigningUp) && 'cursor-not-allowed opacity-50',
                    )}
                    disabled={!isCodeVerified || isSigningUp}
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
                    placeholder="비밀번호를 다시 입력해주세요"
                    {...register('confirmPassword')}
                    disabled={!isCodeVerified || isSigningUp}
                    className={cn(FIELD_CLASS, 'pr-10')}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={cn(
                      'text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                      (!isCodeVerified || isSigningUp) && 'cursor-not-allowed opacity-50',
                    )}
                    disabled={!isCodeVerified || isSigningUp}
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

            {/* 선생님 정보 */}
            {isTeacher && (
              <div className={cn('flex flex-col gap-2')}>
                <p className={cn('text-foreground text-sm font-medium')}>선생님 정보</p>

                <div className={cn('flex flex-col gap-1.5')}>
                  <Input
                    id="name"
                    type="text"
                    aria-label="성함"
                    aria-invalid={!!errors.name}
                    placeholder="성함을 입력해주세요"
                    {...register('name')}
                    disabled={!isCodeVerified || isSigningUp}
                    className={cn(FIELD_CLASS)}
                  />
                  <FormErrorMessage error={errors.name} className={cn(ERROR_MESSAGE_CLASS)} />
                </div>

                <div className={cn('flex flex-col gap-1.5')}>
                  <Controller
                    control={control}
                    name="department"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        disabled={!isCodeVerified || isSigningUp}
                      >
                        <SelectTrigger
                          id="department"
                          aria-label="소속 부서"
                          aria-invalid={!!errors.department}
                          className={cn(
                            'border-foreground aria-invalid:border-destructive w-full rounded-none',
                          )}
                        >
                          <SelectValue placeholder="소속 부서를 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEACHER_DEPARTMENT_OPTIONS.map((department) => (
                            <SelectItem key={department} value={department}>
                              {getTeacherDepartmentLabel(department)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormErrorMessage error={errors.department} className={cn(ERROR_MESSAGE_CLASS)} />
                </div>

                <div className={cn('flex flex-col gap-1.5')}>
                  <Textarea
                    id="description"
                    aria-label="설명"
                    aria-invalid={!!errors.description}
                    placeholder="설명을 입력해주세요 (예: 3학년 1반 담임선생님)"
                    {...register('description')}
                    disabled={!isCodeVerified || isSigningUp}
                    className={cn(FIELD_CLASS, 'h-[72px] resize-none')}
                  />
                  <FormErrorMessage
                    error={errors.description}
                    className={cn(ERROR_MESSAGE_CLASS)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={cn('flex flex-col items-center gap-4 p-5')}>
            {/* Privacy */}
            <div className={cn('flex w-full flex-col gap-1.5')}>
              <div className={cn('flex items-center gap-2')}>
                <Checkbox
                  id="privacy"
                  checked={watch('privacyAgreed')}
                  onCheckedChange={handlePrivacyCheckboxClick}
                  aria-invalid={!!errors.privacyAgreed}
                />
                <label
                  htmlFor="privacy"
                  className={cn('text-muted-foreground cursor-pointer text-sm leading-none')}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePrivacyCheckboxClick();
                  }}
                >
                  <span className={cn('text-foreground font-medium underline underline-offset-2')}>
                    개인정보 처리방침
                  </span>
                  에 동의합니다
                </label>
              </div>
              <FormErrorMessage error={errors.privacyAgreed} className={cn(ERROR_MESSAGE_CLASS)} />
            </div>

            <Button
              type="submit"
              variant="pixel-solid"
              size="lg"
              className={cn('w-full')}
              disabled={isSigningUp || !isCodeVerified}
            >
              {isSigningUp ? 'PROCESSING...' : 'SIGN UP'}
            </Button>

            <Link
              href={isTeacher ? '/signup' : '/signup/teacher'}
              className={cn('text-foreground text-xs leading-4 underline underline-offset-2')}
            >
              {isTeacher ? '학생으로 회원가입하나요?' : '선생님으로 회원가입하시나요?'}
            </Link>
          </div>
        </form>
      </AuthWindow>

      {/* Privacy dialog */}
      <Dialog open={isPrivacyDialogOpen} onOpenChange={setIsPrivacyDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'border-foreground sm:max-w-160 [box-shadow:none]! flex max-h-[80vh] flex-col gap-0 border-2 p-0',
          )}
        >
          <DialogHeader
            className={cn('bg-foreground flex-row items-center justify-between gap-3 px-4 py-3')}
          >
            <DialogTitle className={cn('text-background font-pixel text-[9px] font-normal')}>
              privacy policy
            </DialogTitle>
            <DialogClose
              aria-label="닫기"
              className={cn(
                'border-background/30 text-background hover:bg-background hover:text-foreground flex h-6 cursor-pointer items-center justify-center border px-2 font-mono text-xs tracking-[1.2px] transition-all',
              )}
            >
              X
            </DialogClose>
          </DialogHeader>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={cn('max-w-none flex-1 overflow-y-auto px-5 pt-4')}
          >
            <div className={cn('text-muted-foreground whitespace-pre-wrap text-[13px]')}>
              {PRIVACY_POLICY.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1
                      key={index}
                      className={cn('text-foreground mb-1 text-base font-semibold leading-[1.45]')}
                      dangerouslySetInnerHTML={{ __html: line.replace('# ', '') }}
                    />
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2
                      key={index}
                      className={cn('text-foreground mb-1 mt-4 text-sm font-medium')}
                      dangerouslySetInnerHTML={{ __html: line.replace('## ', '') }}
                    />
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3
                      key={index}
                      className={cn('text-foreground mt-2 text-sm font-medium')}
                      dangerouslySetInnerHTML={{ __html: line.replace('### ', '') }}
                    />
                  );
                }
                const trimmedLine = line.trimStart();
                const isNested = line.startsWith('  ');
                if (trimmedLine.startsWith('- ')) {
                  return (
                    <li
                      key={index}
                      className={cn('list-disc leading-[1.6]', isNested ? 'ml-10' : 'ml-5')}
                      dangerouslySetInnerHTML={{ __html: trimmedLine.substring(2) }}
                    />
                  );
                }
                if (line.startsWith('  > ')) {
                  return (
                    <li
                      key={index}
                      className={cn('ml-10 list-disc leading-[1.6]')}
                      dangerouslySetInnerHTML={{ __html: line.replace('  > ', '') }}
                    />
                  );
                }
                return (
                  <p
                    key={index}
                    className={cn('leading-[1.6]')}
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                );
              })}
            </div>
          </div>
          <div className={cn('border-border/50 flex flex-col gap-2 border-t p-5')}>
            {!hasScrolledToBottom && (
              <p className={cn("text-muted-foreground text-xs before:mr-1 before:content-['>']")}>
                내용을 끝까지 읽어주세요
              </p>
            )}
            <Button
              onClick={handlePrivacyAgree}
              disabled={!hasScrolledToBottom}
              variant="pixel-solid"
              size="lg"
              className={cn('w-full font-sans')}
            >
              동의합니다
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignUpForm;
