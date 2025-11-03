import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET({ params }: APIContext<{ category: string }>) {
  const category = params.category || 'All';
  const allArticles = await getCollection('articles');

  const filteredArticles = category
    ? allArticles.filter((article) => article.data.category === category)
    : allArticles;

  return new Response(JSON.stringify(filteredArticles), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
