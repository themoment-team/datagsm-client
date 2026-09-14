'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuthWindow,
  Button,
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
import { Controller, useForm } from 'react-hook-form';

import {
  DATA_EDIT_FIELD_META,
  DataEditFieldSpec,
  DataEditFormType,
  DataEditPayload,
  buildDataEditSchema,
  toDataEditPayload,
  withNoClubOption,
} from '@/entities/data-edit';

interface DataEditFormProps {
  /** 어드민이 수정을 요청한 항목. 여기 없는 항목은 렌더하지 않는다. */
  fields: DataEditFieldSpec[];
  isPending?: boolean;
  onSubmit: (payload: DataEditPayload) => void;
}

const isSelectField = (spec: DataEditFieldSpec) =>
  spec.name === 'MAJOR_CLUB' || spec.name === 'AUTONOMOUS_CLUB';

const DataEditForm = ({ fields, isPending = false, onSubmit }: DataEditFormProps) => {
  const fieldNames = fields.map((field) => field.name);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataEditFormType>({
    resolver: zodResolver(buildDataEditSchema(fieldNames)),
  });

  const handleFormSubmit = handleSubmit((values) => {
    onSubmit(toDataEditPayload(fieldNames, values));
  });

  return (
    <AuthWindow
      windowLabel="Update Info"
      title="정보 변경"
      description={
        <>
          <p className={cn('leading-[18px]')}>관리자가 정보 변경을 요청했습니다.</p>
          <p className={cn('leading-[18px]')}>
            변경된 정보가 없다면 기존 정보를 그대로 입력하세요.
          </p>
        </>
      }
      isPending={isPending}
    >
      <form onSubmit={handleFormSubmit}>
        <div className={cn('flex flex-col gap-5 px-5 pt-5')}>
          {fields.map((spec) => {
            const { name, options } = spec;
            const { label, placeholder, maxLength } = DATA_EDIT_FIELD_META[name];
            const error = errors[name];

            return (
              <FormField
                key={name}
                label={label}
                htmlFor={name}
                error={error}
                className={cn('gap-2')}
              >
                {isSelectField(spec) ? (
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id={name}
                          aria-invalid={!!error}
                          disabled={isPending}
                          className={cn(FORM_TRIGGER_STYLE)}
                        >
                          <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {withNoClubOption(options).map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Input
                    id={name}
                    inputMode="numeric"
                    maxLength={maxLength}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    disabled={isPending}
                    className={cn(FORM_FIELD_STYLE)}
                    {...register(name)}
                  />
                )}
              </FormField>
            );
          })}
        </div>

        <div className={cn('p-5')}>
          <Button
            type="submit"
            variant="pixel-solid"
            size="lg"
            disabled={isPending}
            className={cn('w-full')}
          >
            Enter
          </Button>
        </div>
      </form>
    </AuthWindow>
  );
};

export default DataEditForm;
