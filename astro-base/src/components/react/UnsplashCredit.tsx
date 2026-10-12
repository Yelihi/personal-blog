import type { InferEntrySchema } from 'astro:content';

type Props = {
  cover?: InferEntrySchema<'articles'>['unsplashCover'];
};

export default function UnsplashCredit({ cover }: Props) {
  if (!cover) return null;
  const { photographer, photographerUrl, photoUrl } = cover.attribution;
  return (
    <p className="mt-2 text-xs text-muted-foreground" data-unsplash-credit>
      Photo by{' '}
      <a className="underline" href={photographerUrl}>
        {photographer}
      </a>
      {' on '}
      <a className="underline" href={photoUrl}>
        Unsplash
      </a>
    </p>
  );
}
