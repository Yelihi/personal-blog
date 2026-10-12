# Notes 작성과 운영

기존 Articles는 유지하며 Notes는 `/notes/`, 상세는 `/notes/{폴더명}/`에 정적으로 생성합니다. 목록의 가운데 선은 전체 스크롤 비율입니다. 상세에서 **브라우저 뒤로가기**를 사용하면 목록 위치를 복원합니다. 상세의 ‘모든 노트 보기’ 링크는 새 목록 진입입니다.

## 새 노트

`astro-base/src/content/notes/my-thought/index.mdx`와 대표 사진을 같은 폴더에 저장합니다. 폴더명에는 영문 소문자, 숫자, 하이픈을 사용합니다. 날짜는 따옴표로 감싼 `YYYY-MM-DD`입니다.
실제 게시 예시는 [`src/content/notes/first-diary/index.mdx`](../astro-base/src/content/notes/first-diary/index.mdx)이며 주소는 `/notes/first-diary/`입니다.

```mdx
---
title: 오늘 바뀐 판단 하나
date: '2026-10-11'
coverImage: ./cover.jpg
coverAlt: 창가의 책상과 펼쳐진 노트
draft: true
---

첫 문단부터 편하게 씁니다. 별도의 요약이 없으면 첫 문단의 텍스트를 미리보기에 사용합니다.

## 아직 남은 질문

결론 없이 끝나도 괜찮습니다.
```

- `draft: true`는 개발 서버에만 표시합니다. 게시하려면 `false`로 바꾸거나 삭제합니다.
- 대표 사진은 한 곳에 표시합니다. 본문 이미지 문법과 이미지 JSX는 오류로 안내합니다. 추가 MDX 컴포넌트는 제공하지 않습니다.
- 필요할 때만 `excerpt`로 미리보기 문장을 지정합니다.
- JPEG, PNG, WebP, AVIF를 지원합니다. 사진은 `content/notes` 안에 저장합니다. 빌드에서 디코딩을 검증하고 WebP로 변환합니다.
- MDX는 신뢰하는 작성자의 로컬 소스입니다. 외부 사용자가 제출한 MDX를 그대로 빌드하지 않습니다.
- `example-*` 세 노트는 개발 화면 확인용 초안입니다.

## Unsplash 자동 선택과 기본 사진

직접 저장한 사진을 우선합니다. `coverImage`를 생략하면 작성 준비 도구가 Unsplash에서 자연·사물 사진을 골라 기록합니다. 선택은 매 방문이나 빌드 때 바뀌지 않습니다. 웹 로그인·이미지 선택 화면·DB는 사용하지 않습니다.

1. `astro-base/.env`에 `UNSPLASH_ACCESS_KEY`를 설정합니다. `.env`는 git에서 제외됩니다.
2. `astro-base`에서 `npm run notes:prepare`를 실행합니다. 로컬 `npm run build`도 준비를 먼저 실행합니다. 초안까지 준비하려면 `npm run notes:prepare -- --include-drafts`를 사용합니다.
3. 변경된 `src/data/note-covers.json`을 노트와 함께 커밋합니다. 이 파일에는 사진 URL·크기·출처만 들어갑니다. 커밋과 push는 자동 실행하지 않습니다.
4. Cloudflare 등 CI에서는 `CI=true`로 `npm run build`를 실행합니다. CI는 커밋된 선택을 검증하고 빌드하며 새 random 선택을 만들지 않습니다. 처음 확보는 로컬에서 끝내므로 CI에 Unsplash 키가 없어도 됩니다.

처음 준비할 노트가 있을 때 기본 사진을 확보합니다. 이후 자동 선택 실패 또는 빌드에서 이미지 검증 실패 시 저장된 기본 사진을 사용합니다. 대체도 유효하지 않으면 빌드를 중단합니다. API 제한·키 오류는 반복 요청을 중단하고, 일시적인 기본 사진 사용은 해당 노트의 영구 선택으로 기록하지 않습니다. 다음 준비에서만 다시 확보를 시도합니다.

검색어는 숲·바다·산·하늘·추상 텍스처이며 인물 관련 설명이 있는 후보는 최대 3회까지 다시 찾습니다. **검색어와 설명만으로 사람이 전혀 없음을 보장하지 않습니다.** 엄격한 인물 제외가 필요하면 직접 검수한 로컬 사진을 지정하세요. 40개 노트 신규 확보는 random과 tracking을 각각 호출하므로 API 한도에 걸릴 수 있습니다. 준비 결과의 `fallback` 수를 확인하고 제한이 해제된 뒤 다시 실행하세요.

API 응답의 `images.unsplash.com` URL과 ixid를 유지하며, 사진 아래에 작가와 Unsplash 출처 링크를 표시합니다. 채택할 사진 검증 후 download tracking endpoint를 호출합니다. 원격 사진은 로컬 최적화 파일로 재호스팅하지 않습니다. 사진 바이트는 확보 시와 배포 빌드에서 디코딩해 검증하고 저장하지 않습니다. 같은 URL은 빌드당 한 번, 최대 4개씩 검사합니다. 개발 서버에서는 원격 검사를 반복하지 않습니다. 배포 후 이미지 실패는 기본 사진 한 번 → 텍스트 대체 표시 순서로 처리합니다.

[Unsplash API 가이드라인](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)에 맞춰 작성자가 준비 명령을 실행합니다. 키는 클라이언트에 전달하지 않습니다. 기존 선택을 바꾸려면 해당 노트의 registry 항목을 삭제한 뒤 다시 실행합니다.

## Cloudflare 주소

빌드 환경의 `SITE_URL`이 우선입니다. 없으면 Cloudflare Pages의 `main` 빌드는 `https://yelihi.pages.dev`, 다른 배포는 `CF_PAGES_URL`을 사용합니다. 둘 다 없으면 로컬 주소 `http://localhost:4321`을 사용합니다. canonical, OG, sitemap이 같은 origin을 사용합니다.

운영 도메인을 바꾸면 Cloudflare 빌드 환경변수 `SITE_URL`에 새 주소를 설정하세요. 경로나 쿼리 없이 origin만 입력합니다. `.env.example`은 설정 예시이며 `.env`의 `SITE_URL`은 CLI 실행 환경으로 내보내거나 Cloudflare 환경변수로 설정합니다.

## 확인 명령

`astro-base`에서 실행합니다.

```sh
npm run dev
npm run test:notes:unit
npm run test:notes:covers
npm run test:notes:browser
npm run check:notes
npm run lint:notes
npm run build
```

브라우저 테스트는 `.cache/notes-test/app`에 격리된 40개 fixture를 만들고 실제 정적 빌드 결과를 테스트합니다. 사진 API는 명시적인 모의 응답입니다. 스크린샷과 결과는 `.cache/notes-test/artifacts`에 저장합니다. 원본 Articles는 수정하지 않습니다. 전체 lint의 기존 실패와 구분하기 위해 변경 범위의 포맷·ESLint 검사를 별도로 실행합니다.
