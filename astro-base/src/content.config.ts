import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  // Load Markdown and MDX files in the `src/content/articles/` directory.
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
      featured: z.boolean().default(false),
      readTime: z.string().optional(),
      tags: z.array(z.string()).optional(),

      // SEO
      description: z.string().optional(),

      // 작성자 정보 (향후 확장)
      author: z.string().optional(),
    }),
});

export const collections = { articles };
