import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue}'],
  theme: { extend: {} },
  darkMode: 'selector',
  plugins: [typography],
};
