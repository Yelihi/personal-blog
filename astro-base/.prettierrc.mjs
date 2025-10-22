export default {
  // 기본 설정
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  printWidth: 80,
  endOfLine: 'lf',

  // Astro 플러그인
  plugins: ['prettier-plugin-astro'],

  // 파일별 설정
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
