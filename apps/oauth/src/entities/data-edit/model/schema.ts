import {
  STUDENT_DATA_EDIT_FIELDS,
  STUDENT_DATA_EDIT_FIELD_LABEL,
  StudentDataEditField,
} from '@repo/shared/constants';
import { z } from 'zod';

export { STUDENT_DATA_EDIT_FIELDS };
export type { StudentDataEditField };

export interface DataEditOption {
  value: number;
  label: string;
}

/**
 * 화면이 렌더할 항목 하나. data-edit-requirements 응답과 형태가 같다.
 * 동아리 항목에는 서버가 운영 중인 동아리 목록을 options로 실어 보낸다.
 */
export interface DataEditFieldSpec {
  name: StudentDataEditField;
  options?: DataEditOption[];
}

/** 무소속을 뜻하는 동아리 ID. 서버 NO_CLUB_ID와 대응한다. */
export const NO_CLUB_ID = 0;

const NO_CLUB_OPTION: DataEditOption = { value: NO_CLUB_ID, label: '무소속' };

/** 서버 응답에 무소속이 없어도 항상 맨 앞에 무소속 선택지를 둔다. */
export const withNoClubOption = (options: DataEditOption[] = []): DataEditOption[] => [
  NO_CLUB_OPTION,
  ...options.filter((option) => option.value !== NO_CLUB_ID),
];

/** data-edit-requirements 응답 본문. */
export interface DataEditRequirementsResponse {
  fields: DataEditFieldSpec[];
}

const GRADE_RANGE = { min: 1, max: 3 };
const CLASS_RANGE = { min: 1, max: 4 };
const NUMBER_RANGE = { min: 1, max: 18 };
const DORMITORY_ROOM_RANGE = { min: 201, max: 518 };

function withinRange(value: number, { min, max }: { min: number; max: number }) {
  return Number.isInteger(value) && value >= min && value <= max;
}

/** 학번은 `학년(1) + 반(1) + 번호(2)` 4자리로 입력받는다. 예) 2103 = 2학년 1반 3번 */
const studentNumberRule = z
  .string()
  .min(1, { message: '학번을 입력하세요.' })
  .regex(/^\d{4}$/, { message: '학번은 4자리입니다.' })
  .refine((value) => withinRange(Number(value[0]), GRADE_RANGE), {
    message: `학년은 ${GRADE_RANGE.min}~${GRADE_RANGE.max}만 가능합니다.`,
  })
  .refine((value) => withinRange(Number(value[1]), CLASS_RANGE), {
    message: `반은 ${CLASS_RANGE.min}~${CLASS_RANGE.max}만 가능합니다.`,
  })
  .refine((value) => withinRange(Number(value.slice(2)), NUMBER_RANGE), {
    message: `번호는 ${NUMBER_RANGE.min}~${NUMBER_RANGE.max}만 가능합니다.`,
  });

const dormitoryRoomRule = z
  .string()
  .min(1, { message: '기숙사 호실을 입력하세요.' })
  .regex(/^\d{3}$/, { message: '호실은 3자리입니다.' })
  .refine((value) => withinRange(Number(value), DORMITORY_ROOM_RANGE), {
    message: `${DORMITORY_ROOM_RANGE.min}호 ~ ${DORMITORY_ROOM_RANGE.max}호 사이로 입력하세요.`,
  });

/** 서버가 null을 거부하므로 "선택 안 함"은 허용하지 않는다. 무소속은 NO_CLUB_ID로 보낸다. */
const clubRule = z.string().min(1, { message: '동아리를 선택하세요.' });

const FIELD_RULES: Record<StudentDataEditField, z.ZodTypeAny> = {
  STUDENT_NUMBER: studentNumberRule,
  DORMITORY_ROOM_NUMBER: dormitoryRoomRule,
  MAJOR_CLUB: clubRule,
  AUTONOMOUS_CLUB: clubRule,
};

/** 라벨·플레이스홀더·입력 제한. 요청된 항목만 이 표를 보고 렌더한다. */
export const DATA_EDIT_FIELD_META: Record<
  StudentDataEditField,
  { label: string; placeholder: string; maxLength?: number }
> = {
  STUDENT_NUMBER: {
    label: STUDENT_DATA_EDIT_FIELD_LABEL.STUDENT_NUMBER,
    placeholder: '학번을 입력하세요',
    maxLength: 4,
  },
  DORMITORY_ROOM_NUMBER: {
    label: STUDENT_DATA_EDIT_FIELD_LABEL.DORMITORY_ROOM_NUMBER,
    placeholder: '기숙사 호실을 입력하세요',
    maxLength: 3,
  },
  MAJOR_CLUB: {
    label: STUDENT_DATA_EDIT_FIELD_LABEL.MAJOR_CLUB,
    placeholder: '전공 동아리를 선택하세요',
  },
  AUTONOMOUS_CLUB: {
    label: STUDENT_DATA_EDIT_FIELD_LABEL.AUTONOMOUS_CLUB,
    placeholder: '자율 동아리를 선택하세요',
  },
};

/** 폼 값. 키는 요청된 StudentDataEditField이고, 값은 입력 문자열이다. */
export type DataEditFormType = Record<string, string>;

/** 요청된 항목만 골라 검증 스키마를 만든다. 요청되지 않은 항목은 폼에도 없고 검증도 하지 않는다. */
export const buildDataEditSchema = (fields: StudentDataEditField[]) =>
  z.object(
    Object.fromEntries(fields.map((field) => [field, FIELD_RULES[field]])),
  ) as unknown as z.ZodType<DataEditFormType, DataEditFormType>;

/** authorize 요청에 실리는 정보 수정 값. 서버 OauthAuthorizeSubmitReqDto의 선택 필드와 대응한다. */
export interface DataEditPayload {
  studentGrade?: number;
  studentClass?: number;
  studentNumber?: number;
  dormitoryRoomNumber?: number;
  majorClubId?: number;
  autonomousClubId?: number;
}

/** 폼 값을 전송 형태로 바꾼다. 학번 4자리는 서버가 요구하는 학년/반/번호로 쪼개진다. */
export const toDataEditPayload = (
  fields: StudentDataEditField[],
  values: DataEditFormType,
): DataEditPayload =>
  fields.reduce<DataEditPayload>((payload, field) => {
    const value = values[field];
    if (!value) return payload;

    switch (field) {
      case 'STUDENT_NUMBER':
        payload.studentGrade = Number(value[0]);
        payload.studentClass = Number(value[1]);
        payload.studentNumber = Number(value.slice(2));
        break;
      case 'DORMITORY_ROOM_NUMBER':
        payload.dormitoryRoomNumber = Number(value);
        break;
      case 'MAJOR_CLUB':
        payload.majorClubId = Number(value);
        break;
      case 'AUTONOMOUS_CLUB':
        payload.autonomousClubId = Number(value);
        break;
    }

    return payload;
  }, {});
