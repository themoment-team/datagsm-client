// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { NO_CLUB_ID, buildDataEditSchema, toDataEditPayload, withNoClubOption } from './schema';

type Fields = Parameters<typeof buildDataEditSchema>[0];

const firstIssue = (fields: Fields, values: object) => {
  const result = buildDataEditSchema(fields).safeParse(values);
  return result.success ? undefined : result.error.issues[0]?.message;
};

describe('buildDataEditSchema', () => {
  it('요청된 항목만 검사한다', () => {
    expect(firstIssue(['DORMITORY_ROOM_NUMBER'], { DORMITORY_ROOM_NUMBER: '305' })).toBeUndefined();
  });

  describe('학번', () => {
    it.each(['1101', '2410', '3118'])('%s는 통과한다', (value) => {
      expect(firstIssue(['STUDENT_NUMBER'], { STUDENT_NUMBER: value })).toBeUndefined();
    });

    it.each([
      ['', '학번을 입력하세요.'],
      ['210', '학번은 4자리입니다.'],
      ['21a3', '학번은 4자리입니다.'],
      ['4101', '학년은 1~3만 가능합니다.'],
      ['0101', '학년은 1~3만 가능합니다.'],
      ['2501', '반은 1~4만 가능합니다.'],
      ['2100', '번호는 1~18만 가능합니다.'],
      ['2119', '번호는 1~18만 가능합니다.'],
    ])('"%s"는 거부한다', (value, message) => {
      expect(firstIssue(['STUDENT_NUMBER'], { STUDENT_NUMBER: value })).toBe(message);
    });
  });

  describe('기숙사 호실', () => {
    it.each(['201', '518', '333'])('%s는 통과한다', (value) => {
      expect(
        firstIssue(['DORMITORY_ROOM_NUMBER'], { DORMITORY_ROOM_NUMBER: value }),
      ).toBeUndefined();
    });

    it.each([
      ['200', '201호 ~ 518호 사이로 입력하세요.'],
      ['519', '201호 ~ 518호 사이로 입력하세요.'],
      ['30', '호실은 3자리입니다.'],
    ])('%s는 거부한다', (value, message) => {
      expect(firstIssue(['DORMITORY_ROOM_NUMBER'], { DORMITORY_ROOM_NUMBER: value })).toBe(message);
    });
  });

  it('동아리는 선택하지 않으면 거부하고, 무소속은 통과한다', () => {
    expect(firstIssue(['MAJOR_CLUB'], { MAJOR_CLUB: '' })).toBe('동아리를 선택하세요.');
    expect(
      firstIssue(['AUTONOMOUS_CLUB'], { AUTONOMOUS_CLUB: String(NO_CLUB_ID) }),
    ).toBeUndefined();
  });
});

describe('toDataEditPayload', () => {
  it('학번 4자리를 학년·반·번호로 나누고 나머지는 숫자로 바꾼다', () => {
    const fields: Fields = [
      'STUDENT_NUMBER',
      'DORMITORY_ROOM_NUMBER',
      'MAJOR_CLUB',
      'AUTONOMOUS_CLUB',
    ];

    expect(
      toDataEditPayload(fields, {
        STUDENT_NUMBER: '2103',
        DORMITORY_ROOM_NUMBER: '305',
        MAJOR_CLUB: '12',
        AUTONOMOUS_CLUB: String(NO_CLUB_ID),
      }),
    ).toEqual({
      studentGrade: 2,
      studentClass: 1,
      studentNumber: 3,
      dormitoryRoomNumber: 305,
      majorClubId: 12,
      autonomousClubId: NO_CLUB_ID,
    });
  });

  it('요청되지 않았거나 비어 있는 항목은 보내지 않는다', () => {
    expect(
      toDataEditPayload(['MAJOR_CLUB'], { MAJOR_CLUB: '', DORMITORY_ROOM_NUMBER: '305' }),
    ).toEqual({});
  });
});

describe('withNoClubOption', () => {
  it('맨 앞에 무소속을 두고, 서버가 보낸 무소속은 중복으로 넣지 않는다', () => {
    expect(
      withNoClubOption([
        { value: 3, label: '더모먼트' },
        { value: NO_CLUB_ID, label: '없음' },
      ]),
    ).toEqual([
      { value: NO_CLUB_ID, label: '무소속' },
      { value: 3, label: '더모먼트' },
    ]);
  });

  it('선택지가 없어도 무소속 하나는 둔다', () => {
    expect(withNoClubOption()).toEqual([{ value: NO_CLUB_ID, label: '무소속' }]);
  });
});
