import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import onlyWarn from 'eslint-plugin-only-warn';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': [
        'warn',
        {
          allowList: ['^NODE_ENV$'],
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ['dist/**'],
  },
];

/**
 * 테스트 파일에서만 완화하는 규칙. React 플러그인을 등록한 설정에서 펼쳐 쓴다.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const testFilesConfig = {
  files: ['**/*.test.{ts,tsx}'],
  rules: {
    // 응답 본문처럼 형태를 검사하지 않는 값을 다룰 때가 많다.
    '@typescript-eslint/no-explicit-any': 'off',
    // 테스트 안에서 만드는 wrapper·stub 컴포넌트에 이름을 붙일 필요가 없다.
    'react/display-name': 'off',
  },
};
