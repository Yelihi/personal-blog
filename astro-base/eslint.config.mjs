import js from '@eslint/js';
import typescript from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';

export default [
  // 기본 JavaScript 권장 설정
  js.configs.recommended,

  // TypeScript 설정
  ...typescript.configs.recommended,

  // Astro 설정
  ...astro.configs.recommended,

  // 모든 파일에 적용되는 기본 설정
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // TypeScript 관련 규칙
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // 일반적인 규칙
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  },

  // Astro 파일 전용 설정
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astro.parser,
      parserOptions: {
        parser: typescript.parser,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      ...astro.configs.recommended.rules,
      'astro/no-conflict-set-directives': 'error',
      'astro/no-unused-define-vars-in-style': 'error',
    },
  },

  // TypeScript 파일 전용 설정
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      ...typescript.configs.recommended.rules,
    },
  },

  // 설정 파일들 제외
  {
    files: ['*.config.js', '*.config.mjs', '*.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Astro 자동 생성 파일들 제외
  {
    files: ['.astro/**/*'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // Prettier와 충돌 방지
  prettier,
];
