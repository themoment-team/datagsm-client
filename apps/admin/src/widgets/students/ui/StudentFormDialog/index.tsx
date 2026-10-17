import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { SPECIALTY_OPTIONS } from '@repo/shared/constants';
import { ClubListData, Student } from '@repo/shared/types';
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogWindow,
  FORM_FIELD_STYLE,
  FORM_TRIGGER_STYLE,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AddStudentSchema, AddStudentType } from '@/entities/student';
import { useCreateStudent, useUpdateStudent, useUpdateStudentStatus } from '@/widgets/students';

const DISABLED_STYLE = 'border-foreground/30 bg-muted h-9 w-full cursor-not-allowed border';

interface StudentFormDialogProps {
  clubs?: ClubListData;
  mode: 'create' | 'edit';
  student?: Student;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoadingClubs?: boolean;
}

const StudentFormDialog = ({
  clubs,
  mode,
  student,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  isLoadingClubs = false,
}: StudentFormDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isCustomSpecialty, setIsCustomSpecialty] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const queryClient = useQueryClient();

  const { isPending: isCreating, mutate: createStudent } = useCreateStudent({
    onSuccess: () => {
      setOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('학생 등록에 성공했습니다.');
    },
    onError: (error) => {
      console.error('학생 등록 실패:', error);
      toast.error('학생 등록에 실패했습니다.');
    },
  });

  const { isPending: isUpdating, mutate: updateStudent } = useUpdateStudent({
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('학생 데이터가 수정되었습니다.');
    },
    onError: (error) => {
      console.error('학생 데이터 수정 실패:', error);
      toast.error('학생 데이터 수정에 실패했습니다.');
    },
  });

  const { isPending: isUpdatingStatus, mutate: updateStatus } = useUpdateStudentStatus({
    onError: (error) => {
      console.error('학생 상태 수정 실패:', error);
      toast.error('학생 상태 수정에 실패했습니다.');
    },
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<AddStudentType>({
    resolver: zodResolver(AddStudentSchema),
    defaultValues:
      mode === 'edit' && student
        ? {
            name: student.name,
            sex: student.sex,
            email: student.email,
            grade: student.grade,
            classNum: student.classNum,
            number: student.number,
            role: student.role,
            dormitoryRoomNumber: student.dormitoryRoom,
            specialty: student.specialty ?? null,
            githubId: student.githubId ?? null,
            majorClubId: student.majorClub?.id || null,
            autonomousClubId: student.autonomousClub?.id || null,
          }
        : undefined,
  });

  useEffect(() => {
    if (mode === 'edit' && student && open) {
      const isCustom =
        !!student.specialty &&
        !SPECIALTY_OPTIONS.includes(student.specialty as (typeof SPECIALTY_OPTIONS)[number]);
      setIsCustomSpecialty(isCustom);
      reset({
        name: student.name,
        sex: student.sex,
        email: student.email,
        grade: student.grade,
        classNum: student.classNum,
        number: student.number,
        role: student.role,
        dormitoryRoomNumber: student.dormitoryRoom,
        specialty: student.specialty ?? null,
        githubId: student.githubId ?? null,
        majorClubId: student.majorClub?.id || null,
        autonomousClubId: student.autonomousClub?.id || null,
      });
    }
    if (!open) {
      setIsCustomSpecialty(false);
    }
  }, [mode, student, open, reset]);

  const currentRole = watch('role');
  const isInactive = currentRole === 'GRADUATE' || currentRole === 'WITHDRAWN';

  const onSubmit: SubmitHandler<AddStudentType> = (data) => {
    if (mode === 'create') {
      createStudent(data);
      return;
    }

    if (mode === 'edit' && student) {
      const isRoleChanged = !!dirtyFields.role;
      const isOtherDataChanged = Object.keys(dirtyFields).some((key) => key !== 'role');

      if (isRoleChanged) {
        updateStatus(
          { studentId: student.id, role: data.role },
          {
            onSuccess: () => {
              if (isOtherDataChanged) {
                updateStudent({ studentId: student.id, data });
              } else {
                setOpen(false);
                queryClient.invalidateQueries({ queryKey: ['students'] });
                toast.success('학생 상태가 수정되었습니다.');
              }
            },
          },
        );
      } else if (isOtherDataChanged) {
        updateStudent({ studentId: student.id, data });
      }
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // 바뀐 값이 없으면 검증을 거치지 않고 바로 안내한다. 기존 데이터가 AddStudentSchema를
    // 통과하지 못하는 경우(예: 호실이 없는 통학생)에도 무변경 제출은 항상 안내되어야 한다.
    if (mode === 'edit' && Object.keys(dirtyFields).length === 0) {
      event.preventDefault();
      setOpen(false);
      toast.info('변경사항이 없습니다.');
      return;
    }
    handleSubmit(onSubmit)(event);
  };

  const windowTitle = mode === 'create' ? 'Add Student' : 'Edit Student';
  const heading = mode === 'create' ? '학생 추가' : '학생 정보 수정';
  const description =
    mode === 'create'
      ? '이름, 성별, 이메일, 학년등 모두 작성해주세요'
      : '수정이 필요한 정보를 변경한 뒤 저장하세요';

  const getPendingState = () => {
    if (mode === 'create') return isCreating;
    return isUpdating || isUpdatingStatus;
  };

  const getSubmitText = () => {
    if (mode === 'create') return '+ Add Student';
    if (currentRole === 'WITHDRAWN') return '자퇴생 처리';
    if (currentRole === 'GRADUATE') return '졸업생 처리';
    return '수정';
  };

  const getLoadingText = () => {
    if (mode === 'create') return '추가 중...';
    if (currentRole === 'WITHDRAWN') return '처리 중...';
    if (currentRole === 'GRADUATE') return '처리 중...';
    return '수정 중...';
  };

  const isPending = getPendingState();
  const submitText = getSubmitText();
  const loadingText = getLoadingText();

  const defaultTrigger =
    mode === 'create' ? (
      <Button variant="pixel-primary" className={cn('px-3')} disabled={isLoadingClubs}>
        + 학생 추가
      </Button>
    ) : (
      <Button variant="pixel" className={cn('h-6 border px-2')} disabled={isLoadingClubs}>
        Edit
      </Button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      {!isControlled && <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>}
      <DialogWindow windowTitle={windowTitle} heading={heading} description={description}>
        <form onSubmit={handleFormSubmit}>
          <div className={cn('grid grid-cols-2 gap-4 px-5 pb-2.5 pt-5')}>
            <FormField label="이름" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                placeholder="이름을 입력하세요"
                className={cn(FORM_FIELD_STYLE)}
                {...register('name')}
              />
            </FormField>

            <FormField label="이메일" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                placeholder="이메일을 입력하세요"
                className={cn(FORM_FIELD_STYLE)}
                {...register('email')}
              />
            </FormField>

            <FormField label="성별" htmlFor="sex" error={errors.sex}>
              <Controller
                control={control}
                name="sex"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sex" className={cn(FORM_TRIGGER_STYLE)}>
                      <SelectValue placeholder="성별을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAN">남</SelectItem>
                      <SelectItem value="WOMAN">여</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="구분" htmlFor="role" error={errors.role}>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role" className={cn(FORM_TRIGGER_STYLE)}>
                      <SelectValue placeholder="구분을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL_STUDENT">일반학생</SelectItem>
                      <SelectItem value="STUDENT_COUNCIL">학생회</SelectItem>
                      <SelectItem value="DORMITORY_MANAGER">기자위</SelectItem>
                      {mode === 'edit' && (
                        <>
                          <SelectItem value="GRADUATE">졸업생</SelectItem>
                          <SelectItem value="WITHDRAWN">자퇴생</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="반"
              htmlFor="classNum"
              error={isInactive ? undefined : errors.classNum}
            >
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Controller
                  control={control}
                  name="classNum"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger id="classNum" className={cn(FORM_TRIGGER_STYLE)}>
                        <SelectValue placeholder="반을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1반</SelectItem>
                        <SelectItem value="2">2반</SelectItem>
                        <SelectItem value="3">3반</SelectItem>
                        <SelectItem value="4">4반</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField label="학년" htmlFor="grade" error={isInactive ? undefined : errors.grade}>
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Controller
                  control={control}
                  name="grade"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger id="grade" className={cn(FORM_TRIGGER_STYLE)}>
                        <SelectValue placeholder="학년을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1학년</SelectItem>
                        <SelectItem value="2">2학년</SelectItem>
                        <SelectItem value="3">3학년</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField
              label="기숙사 호실"
              htmlFor="dormitoryRoomNumber"
              error={isInactive ? undefined : errors.dormitoryRoomNumber}
            >
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Input
                  id="dormitoryRoomNumber"
                  type="number"
                  placeholder="호실을 입력하세요"
                  className={cn(FORM_FIELD_STYLE)}
                  {...register('dormitoryRoomNumber', { valueAsNumber: true })}
                />
              )}
            </FormField>

            {/* 번호: Figma 시안에는 없지만 학생 등록/수정 API 필수 값이라 유지 */}
            <FormField label="번호" htmlFor="number" error={isInactive ? undefined : errors.number}>
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Input
                  id="number"
                  type="number"
                  placeholder="번호를 입력하세요"
                  className={cn(FORM_FIELD_STYLE)}
                  {...register('number', { valueAsNumber: true })}
                />
              )}
            </FormField>

            <FormField
              label="전공 동아리"
              htmlFor="majorClubId"
              error={isInactive ? undefined : errors.majorClubId}
            >
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Controller
                  control={control}
                  name="majorClubId"
                  render={({ field }) => (
                    <Select
                      value={
                        field.value === null && mode === 'edit'
                          ? 'none'
                          : field.value
                            ? String(field.value)
                            : undefined
                      }
                      onValueChange={(val) => field.onChange(val === 'none' ? null : Number(val))}
                    >
                      <SelectTrigger id="majorClubId" className={cn(FORM_TRIGGER_STYLE)}>
                        <SelectValue placeholder="전공 동아리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className={cn('text-muted-foreground')}>
                          선택 안 함
                        </SelectItem>
                        {clubs?.clubs
                          .filter((club) => club.type === 'MAJOR_CLUB')
                          .map((club) => (
                            <SelectItem key={club.id} value={String(club.id)}>
                              {club.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField
              label="자율 동아리"
              htmlFor="autonomousClubId"
              error={isInactive ? undefined : errors.autonomousClubId}
            >
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Controller
                  control={control}
                  name="autonomousClubId"
                  render={({ field }) => (
                    <Select
                      value={
                        field.value === null && mode === 'edit'
                          ? 'none'
                          : field.value
                            ? String(field.value)
                            : undefined
                      }
                      onValueChange={(val) => field.onChange(val === 'none' ? null : Number(val))}
                    >
                      <SelectTrigger id="autonomousClubId" className={cn(FORM_TRIGGER_STYLE)}>
                        <SelectValue placeholder="자율 동아리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className={cn('text-muted-foreground')}>
                          선택 안 함
                        </SelectItem>
                        {clubs?.clubs
                          .filter((club) => club.type === 'AUTONOMOUS_CLUB')
                          .map((club) => (
                            <SelectItem key={club.id} value={String(club.id)}>
                              {club.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField
              label="전공"
              htmlFor="specialty"
              error={isInactive ? undefined : errors.specialty}
              className={cn('col-start-1')}
            >
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Controller
                  control={control}
                  name="specialty"
                  render={({ field }) =>
                    isCustomSpecialty ? (
                      <div className={cn('flex gap-2')}>
                        <Input
                          id="specialty"
                          placeholder="전공을 입력하세요"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          className={cn(FORM_FIELD_STYLE, 'flex-1')}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="pixel"
                          className={cn('h-9 px-3')}
                          onClick={() => {
                            setIsCustomSpecialty(false);
                            field.onChange(null);
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={field.value ?? 'none'}
                        onValueChange={(val) => {
                          if (val === 'custom') {
                            setIsCustomSpecialty(true);
                            field.onChange('');
                          } else if (val === 'none') {
                            field.onChange(null);
                          } else {
                            field.onChange(val);
                          }
                        }}
                      >
                        <SelectTrigger id="specialty" className={cn(FORM_TRIGGER_STYLE)}>
                          <SelectValue placeholder="전공을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className={cn('text-muted-foreground')}>
                            선택 안 함
                          </SelectItem>
                          {SPECIALTY_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">직접 입력...</SelectItem>
                        </SelectContent>
                      </Select>
                    )
                  }
                />
              )}
            </FormField>

            <FormField
              label="Git Hub ID"
              htmlFor="githubId"
              error={isInactive ? undefined : errors.githubId}
              className={cn('col-start-1')}
            >
              {isInactive ? (
                <div className={cn(DISABLED_STYLE)} />
              ) : (
                <Input
                  id="githubId"
                  placeholder="Git Hub 아이디를 입력하세요"
                  className={cn(FORM_FIELD_STYLE)}
                  {...register('githubId', { setValueAs: (v) => (v === '' ? null : v) })}
                />
              )}
            </FormField>
          </div>

          <div className={cn('flex flex-col items-end justify-center p-5')}>
            <Button
              type="submit"
              disabled={isPending}
              variant={isInactive ? 'pixel-destructive' : 'pixel-primary'}
              className={cn('h-11 w-full px-3')}
            >
              {isPending ? loadingText : submitText}
            </Button>
          </div>
        </form>
      </DialogWindow>
    </Dialog>
  );
};

export default StudentFormDialog;
