import { BookOpen, Code2, Radio, User } from 'lucide-react';

import { DocsSection } from './types';

export const docsSections: DocsSection[] = [
  {
    label: 'Overview',
    href: '/',
    icon: BookOpen,
  },
  {
    label: 'OpenAPI',
    href: '/api',
    icon: Code2,
    children: [
      {
        label: 'HTTP',
        href: '/api/http',
        children: [
          {
            label: '학생 데이터 OpenAPI',
            href: '/api/http/student',
          },
          {
            label: '동아리 데이터 OpenAPI',
            href: '/api/http/club',
          },
          {
            label: '프로젝트 데이터 OpenAPI',
            href: '/api/http/project',
          },
          {
            label: 'NEIS 데이터 OpenAPI',
            href: '/api/http/neis',
            children: [
              {
                label: '급식 데이터 API',
                href: '/api/http/neis/meals',
              },
              {
                label: '학사일정 데이터 API',
                href: '/api/http/neis/schedules',
              },
              {
                label: '시간표 데이터 API',
                href: '/api/http/neis/timetables',
              },
            ],
          },
        ],
      },
      {
        label: 'SDK',
        href: '/api/sdk',
        children: [
          {
            label: 'Java / Kotlin SDK',
            href: '/api/sdk/java',
          },
          {
            label: 'Python SDK',
            href: '/api/sdk/python',
          },
          {
            label: 'JavaScript / TypeScript SDK',
            href: '/api/sdk/javascript',
          },
          {
            label: '.NET SDK',
            href: '/api/sdk/dotnet',
          },
          {
            label: 'Go SDK',
            href: '/api/sdk/go',
          },
          {
            label: 'SDK 버저닝 컨벤션',
            href: '/api/sdk/versioning',
          },
        ],
      },
    ],
  },
  {
    label: 'OAuth',
    href: '/oauth',
    icon: User,
    children: [
      {
        label: 'PKCE 가이드',
        href: '/oauth/pkce',
      },
      {
        label: '서드파티 권한 범위',
        href: '/oauth/thirdparty-scope',
      },
      {
        label: 'Design 가이드',
        href: '/oauth/design',
      },
      {
        label: 'HTTP',
        href: '/oauth/http',
        children: [
          {
            label: '인증 흐름 시작',
            href: '/oauth/http/authorize',
          },
          {
            label: '토큰 교환',
            href: '/oauth/http/token-exchange',
          },
          {
            label: '토큰 갱신',
            href: '/oauth/http/token-refresh',
          },
          {
            label: '사용자 데이터 조회',
            href: '/oauth/http/userinfo',
          },
        ],
      },
      {
        label: 'Examples',
        href: '/oauth/examples',
        children: [
          {
            label: 'React + Spring Boot (BFF)',
            href: '/oauth/examples/react-spring-boot',
          },
          {
            label: 'Next.js + Spring Boot',
            href: '/oauth/examples/nextjs-spring-boot',
          },
          {
            label: 'React + Spring Boot (Kotlin)',
            href: '/oauth/examples/react-spring-boot-kotlin',
          },
          {
            label: 'Vanilla JS + NestJS',
            href: '/oauth/examples/vanilla-nestjs',
          },
        ],
      },
      {
        label: 'SDK',
        href: '/oauth/sdk',
        children: [
          {
            label: 'React',
            href: '/oauth/sdk/react',
          },
          {
            label: 'Java / Kotlin SDK',
            href: '/oauth/sdk/java',
          },
          {
            label: 'SDK 버저닝 컨벤션',
            href: '/oauth/sdk/versioning',
          },
        ],
      },
    ],
  },
  {
    label: 'Event',
    href: '/event',
    icon: Radio,
    children: [
      {
        label: '웹 콘솔에서 관리',
        href: '/event/console',
      },
      {
        label: '이벤트 페이로드 명세',
        href: '/event/payloads',
      },
      {
        label: '서명 검증 가이드',
        href: '/event/signature',
      },
    ],
  },
];
