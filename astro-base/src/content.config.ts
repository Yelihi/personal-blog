import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const unsplashUrl = (host: string) =>
  z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        url.hostname === host &&
        !url.username &&
        !url.password &&
        !url.port
      );
    }, `Expected an HTTPS ${host} URL`);

const articles = defineCollection({
  // Load Markdown and MDX files in the `src/content/articles/` directory.
  // `**/*.{md,mdx}` 패턴은 모든 하위 폴더를 재귀적으로 검색합니다.
  // 예시 구조:
  // 글 ID는 파일 경로에서 자동 생성하므로 frontmatter에 categoryId를 쓰지 않습니다.
  //   - src/content/articles/react-19/index.mdx → id: "react-19"
  //   - src/content/articles/typescript-5/index.mdx → id: "typescript-5"
  //   - src/content/articles/example-post.mdx → id: "example-post"
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  // Type-check frontmatter using a schema,
  schema: ({ image }) =>
    z.object({
      // 필수 필드
      title: z.string(),
      excerpt: z.string(),
      date: z.string(), // "2025.10.15" 형식
      category: z.string(),

      // 선택 필드
      coverImage: image().optional(),
      unsplashCover: z
        .object({
          source: z.literal('unsplash'),
          src: unsplashUrl('images.unsplash.com'),
          width: z.number().int().positive().max(50000),
          height: z.number().int().positive().max(50000),
          alt: z.string(),
          attribution: z.object({
            photoId: z.string().min(1),
            photographer: z.string().min(1),
            photographerUrl: unsplashUrl('unsplash.com'),
            photoUrl: unsplashUrl('unsplash.com'),
          }),
        })
        .optional(),
      readTime: z.string().optional(),
      tags: z.array(z.string()).optional(),

      // SEO
      description: z.string().optional(),

      // 작성자 정보 (향후 확장)
      author: z.string().optional(),
    }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string().trim().min(1),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((date) => {
        const value = new Date(date + 'T00:00:00Z');
        return (
          !Number.isNaN(value.getTime()) &&
          value.toISOString().slice(0, 10) === date
        );
      }, 'Use a real YYYY-MM-DD date'),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    excerpt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, notes };
