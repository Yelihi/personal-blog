import { getImage } from 'astro:assets';
import type { InferEntrySchema } from 'astro:content';
import type { Article } from '@/components/react/ArticlesContainer';

/**
 * (현 article 형식에 따라) 이미지의 포맷을 webp 또는 avif 로 변환합니다.
 * (제네릭을 사용하지 않는 이유는 현 프로젝트에서 article 형식이 고정되어있기 때문입니다.)
 * @param articles - 변환할 article 배열
 * @param format - 변환할 포맷 (webp 또는 avif)
 * @returns 변환된 article 배열
 */
export const transferImagesFormat = async (
  articles: Article[],
  format: 'webp' | 'avif' = 'webp'
) => {
  return await Promise.all(
    articles.map(async (article) => {
      if (article.data.coverImage) {
        const image = await getImage({
          src: article.data.coverImage,
          format,
        });
        return {
          ...article,
          data: {
            ...article.data,
            coverImage: {
              src: image.src,
              width: image.rawOptions.width,
              height: image.rawOptions.height,
              format: image.rawOptions.format,
            },
          } as InferEntrySchema<'articles'>,
        };
      } else {
        return article;
      }
    })
  );
};
