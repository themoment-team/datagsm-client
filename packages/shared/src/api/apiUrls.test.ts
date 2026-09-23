// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  accountUrl,
  applicationUrl,
  authUrl,
  clientUrl,
  clubUrl,
  projectUrl,
  studentUrl,
} from './apiUrls';

const queryOf = (url: string) => Object.fromEntries(new URL(url, 'http://x').searchParams);

describe('studentUrl.getStudents', () => {
  it('넘긴 인자만 쿼리에 넣고 순서는 시그니처 순서를 따른다', () => {
    expect(
      studentUrl.getStudents(
        0,
        20,
        2,
        3,
        'WOMAN',
        'STUDENT_COUNCIL',
        true,
        false,
        true,
        'NAME',
        '홍길동',
      ),
    ).toBe(
      '/v1/students?page=0&size=20&grade=2&classNum=3&sex=WOMAN&role=STUDENT_COUNCIL' +
        '&includeGraduates=true&includeWithdrawn=false&onlyEnrolled=true&sortBy=NAME' +
        '&name=%ED%99%8D%EA%B8%B8%EB%8F%99',
    );
  });

  it('0과 false도 값으로 보고 쿼리에 넣는다', () => {
    expect(
      queryOf(
        studentUrl.getStudents(0, undefined, undefined, undefined, undefined, undefined, false),
      ),
    ).toEqual({
      page: '0',
      includeGraduates: 'false',
    });
  });

  it('빈 이름은 쿼리에서 뺀다', () => {
    expect(
      studentUrl.getStudents(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '',
      ),
    ).toBe('/v1/students');
  });

  it('인자가 없으면 쿼리 없이 경로만 돌려준다', () => {
    expect(studentUrl.getStudents()).toBe('/v1/students');
  });
});

describe('clubUrl.getClubs', () => {
  it('인자가 없으면 쿼리 없이 경로만 돌려준다', () => {
    expect(clubUrl.getClubs()).toBe('/v1/clubs');
  });

  it('type은 clubType, status는 clubStatus 이름으로 보낸다', () => {
    expect(queryOf(clubUrl.getClubs(1, 10, 'AUTONOMOUS_CLUB', '코딩', 'ACTIVE'))).toEqual({
      page: '1',
      size: '10',
      clubType: 'AUTONOMOUS_CLUB',
      clubName: '코딩',
      clubStatus: 'ACTIVE',
    });
  });

  it('type이 null이거나 clubName이 비어 있으면 뺀다', () => {
    expect(clubUrl.getClubs(undefined, undefined, null as never, '')).toBe('/v1/clubs');
  });
});

describe('projectUrl.getProjects', () => {
  it('인자가 없으면 쿼리 없이 경로만 돌려준다', () => {
    expect(projectUrl.getProjects({})).toBe('/v1/projects');
  });

  it('page 0과 clubId 0은 넣고, 빈 projectName은 뺀다', () => {
    expect(
      queryOf(projectUrl.getProjects({ page: 0, clubId: 0, projectName: '', status: 'ENDED' })),
    ).toEqual({
      page: '0',
      clubId: '0',
      status: 'ENDED',
    });
  });
});

describe('authUrl.getApiKeys', () => {
  it('인자가 없으면 쿼리 없이 경로만 돌려준다', () => {
    expect(authUrl.getApiKeys({})).toBe('/v1/auth/api-keys');
  });

  it('false인 불리언은 넣고, 빈 scope는 뺀다', () => {
    expect(
      queryOf(
        authUrl.getApiKeys({ id: 1, accountId: 2, scope: '', isExpired: false, isRenewable: true }),
      ),
    ).toEqual({ id: '1', accountId: '2', isExpired: 'false', isRenewable: 'true' });
  });
});

describe('accountUrl.getAccounts', () => {
  it('인자가 없으면 쿼리 없이 경로만 돌려준다', () => {
    expect(accountUrl.getAccounts({})).toBe('/v1/accounts');
  });

  it('빈 email은 빼고 나머지 필터를 넣는다', () => {
    expect(
      queryOf(
        accountUrl.getAccounts({
          email: '',
          role: 'ADMIN',
          objectType: 'TEACHER',
          status: 'PENDING',
          sortBy: 'CREATED_AT',
        }),
      ),
    ).toEqual({ role: 'ADMIN', objectType: 'TEACHER', status: 'PENDING', sortBy: 'CREATED_AT' });
  });
});

describe('clientUrl', () => {
  it('검색은 빈 clientName을 뺀다', () => {
    expect(clientUrl.getClientsSearch(undefined, undefined, '')).toBe('/v1/clients');
  });

  it('내 클라이언트 목록은 인자가 없으면 경로만 돌려준다', () => {
    expect(clientUrl.getClients()).toBe('/v1/clients/my');
    expect(clientUrl.getClients(0, 5)).toBe('/v1/clients/my?page=0&size=5');
  });
});

describe('applicationUrl.getApplications', () => {
  it('빈 name과 id는 뺀다', () => {
    expect(applicationUrl.getApplications({ name: '', id: '' })).toBe('/v1/applications');
    expect(applicationUrl.getApplications({ page: 0, id: 'abc' })).toBe(
      '/v1/applications?page=0&id=abc',
    );
  });
});

describe('id가 들어가는 경로', () => {
  it.each([
    [studentUrl.putStudentById(7), '/v1/students/7'],
    [studentUrl.patchStudentStatus(7), '/v1/students/7/status'],
    [clubUrl.deleteClubById(3), '/v1/clubs/3'],
    [projectUrl.postProjectEndById(5), '/v1/projects/5/end'],
    [authUrl.getAvailableScope('ADMIN'), '/v1/auth/api-keys/available-scopes?role=ADMIN'],
    [authUrl.patchApiKeyExpirationById(9), '/v1/auth/api-keys/9/expiration'],
    [applicationUrl.patchApplicationScope('app-1', 2), '/v1/applications/app-1/scopes/2'],
    [accountUrl.patchAccountApproval(4), '/v1/accounts/4/approval'],
  ])('%s', (actual, expected) => {
    expect(actual).toBe(expected);
  });
});
