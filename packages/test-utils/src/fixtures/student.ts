import type { ClubMember, Student, StudentListData } from '@repo/shared/types';

import { nextId } from './sequence';

/** 기본값은 1학년 1반 재학생이다. 학번은 grade·classNum·number에서 계산한다. */
export const createStudent = (overrides: Partial<Student> = {}): Student => {
  const id = overrides.id ?? nextId();
  const grade = overrides.grade ?? 1;
  const classNum = overrides.classNum ?? 1;
  const number = overrides.number ?? id;

  return {
    id,
    name: `학생${id}`,
    sex: 'MAN',
    email: `student${id}@gsm.hs.kr`,
    grade,
    classNum,
    number,
    studentNumber: grade * 1000 + classNum * 100 + number,
    major: 'SW_DEVELOPMENT',
    specialty: null,
    githubId: null,
    githubUrl: null,
    role: 'GENERAL_STUDENT',
    dormitoryFloor: 2,
    dormitoryRoom: 200 + id,
    majorClub: null,
    autonomousClub: null,
    ...overrides,
  };
};

/** 동아리·프로젝트 참여자 형태로 바꾼다. */
export const toClubMember = ({
  id,
  name,
  email,
  studentNumber,
  major,
  sex,
}: Student): ClubMember => ({ id, name, email, studentNumber, major, sex });

export const createClubMember = (overrides: Partial<ClubMember> = {}): ClubMember => ({
  ...toClubMember(createStudent()),
  ...overrides,
});

export const createStudentListData = (
  students: Student[] = [createStudent()],
  overrides: Partial<StudentListData> = {},
): StudentListData => ({
  totalPages: 1,
  totalElements: students.length,
  students,
  ...overrides,
});
