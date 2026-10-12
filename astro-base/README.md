# Astro Starter Kit: Blog

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 새 글 작성

`src/content/articles/<분류>/<글-이름>/index.mdx`를 만들고 아래처럼 작성합니다.
`categoryId`나 숫자 ID는 입력하지 않습니다. 글 ID는 Astro의 `glob()` 로더가
파일 경로에서 자동 생성하며, 카테고리 목록은 `category` 값으로 자동 구성됩니다.

```mdx
---
title: '새 글 제목'
excerpt: '글 요약'
date: '2026.09.27'
category: 'Life'
---

본문을 작성합니다.
```

예: `life/first-diary/index.mdx` → ID `life/first-diary` → 주소 `/articles/life/first-diary`.
폴더 이름은 소문자 영문·숫자·하이픈으로 작성하고, 같은 분류 안에서는 서로 다른 글 이름을 사용합니다.
`life/example.mdx`와 `life/example/index.mdx`는 같은 ID가 되므로 함께 만들지 않습니다.
발행 후 경로를 바꾸면 글 주소도 바뀝니다.

홈에는 날짜순 최신 Article 네 개가 표시됩니다.

## Notes

생각 노트는 `src/content/notes/<이름>/index.mdx`로 작성합니다. 로컬 사진을 `coverImage`로 지정하거나 생략하면 게시 준비에서 Unsplash 자연·사물 사진을 자동으로 확보합니다. 로컬 `npm run build`는 준비를 먼저 실행하고, `CI=true` 빌드는 Git에 저장된 선택만 사용합니다. 선택 파일 `src/data/note-covers.json`도 노트와 함께 커밋하세요.

[Notes 작성·이미지·검증 안내](../docs/notes-authoring.md)

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
