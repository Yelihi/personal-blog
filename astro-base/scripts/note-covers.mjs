import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export function allowedUrl(value, host) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== host ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error(`Invalid ${host} URL`);
  }
  return url;
}
export function validateCover(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Missing Unsplash cover');
  allowedUrl(value.src, 'images.unsplash.com');
  if (value.thumbnailSrc) allowedUrl(value.thumbnailSrc, 'images.unsplash.com');
  for (const size of [value.width, value.height]) {
    if (!Number.isInteger(size) || size <= 0 || size > 50000)
      throw new Error('Invalid image dimensions');
  }
  const a = value.attribution;
  if (
    !a ||
    ![a.photoId, a.photographer].every(
      (v) => typeof v === 'string' && v.length > 0
    )
  ) {
    throw new Error('Missing Unsplash attribution');
  }
  allowedUrl(a.photographerUrl, 'unsplash.com');
  allowedUrl(a.photoUrl, 'unsplash.com');
  if (value.source !== 'unsplash' || typeof value.alt !== 'string')
    throw new Error('Invalid cover source');
  return value;
}
export async function readCoverRegistry(root) {
  const value = JSON.parse(
    await readFile(path.join(root, 'src/data/note-covers.json'), 'utf8')
  );
  if (
    value.version !== 1 ||
    !value.notes ||
    Array.isArray(value.notes) ||
    typeof value.notes !== 'object'
  )
    throw new Error('Invalid cover registry');
  if (value.default) validateCover(value.default);
  for (const image of Object.values(value.notes)) validateCover(image);
  return value;
}
export async function writeRegistry(root, registry) {
  const file = path.join(root, 'src/data/note-covers.json');
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temp, `${JSON.stringify(registry, null, 2)}\n`, {
      flag: 'wx',
    });
    await rename(temp, file);
  } finally {
    await rm(temp, { force: true });
  }
}
export async function chooseCover(accessKey, fetcher = fetch) {
  if (!accessKey) {
    const error = new Error(
      'Set UNSPLASH_ACCESS_KEY in .env to prepare note covers'
    );
    error.stopRequests = true;
    throw error;
  }
  const request = async (url) => {
    allowedUrl(url, 'api.unsplash.com');
    const response = await fetcher(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    if (!response.ok) {
      const error = new Error(`Unsplash request failed (${response.status})`);
      error.stopRequests =
        [401, 403, 429].includes(response.status) || response.status >= 500;
      throw error;
    }
    return response.json();
  };
  const subjects = [
    'forest landscape',
    'ocean landscape',
    'mountain landscape',
    'clouds sky',
    'abstract texture',
  ];
  let photo;
  // Descriptions can miss people; these filters are not a no-person guarantee.
  for (let attempt = 0; attempt < 3; attempt++) {
    const url = new URL('https://api.unsplash.com/photos/random');
    url.search = new URLSearchParams({
      query: subjects[Math.floor(Math.random() * subjects.length)],
      orientation: 'landscape',
      content_filter: 'high',
    }).toString();
    const candidate = await request(url.href);
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
      throw new Error('Invalid Unsplash photo response');
    const description = `${candidate.description ?? ''} ${candidate.alt_description ?? ''}`;
    if (
      /\b(person|people|human|man|men|woman|women|boy|girl|child|children|portrait|crowd)\b/i.test(
        description
      )
    )
      continue;
    photo = candidate;
    break;
  }
  if (!photo)
    throw new Error('No suitable nature/object photo in three candidates');
  const referral = (value) => {
    const url = allowedUrl(value, 'unsplash.com');
    url.searchParams.set('utm_source', 'yelihi_notes');
    url.searchParams.set('utm_medium', 'referral');
    return url.href;
  };
  const cover = validateCover({
    source: 'unsplash',
    src: photo.urls?.regular,
    width: photo.width,
    height: photo.height,
    alt: photo.alt_description ?? 'Unsplash 자연·사물 사진',
    attribution: {
      photoId: photo.id,
      photographer: photo.user?.name,
      photographerUrl: referral(photo.user?.links?.html),
      photoUrl: referral(photo.links?.html),
    },
  });
  await verifyCoverImage(cover, fetcher);
  // Choosing a blog cover is a download-like event under the API guidelines.
  await request(photo.links.download_location);
  return cover;
}

export async function verifyCoverImage(cover, fetcher = fetch) {
  validateCover(cover);
  const response = await fetcher(cover.src, {
    signal: AbortSignal.timeout(10000),
    redirect: 'error',
  });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error('Unsplash image is unavailable');
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 20 * 1024 * 1024)
        throw new Error('Unsplash image exceeds 20MB');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const decoded = await sharp(Buffer.concat(chunks), {
    limitInputPixels: 40000000,
  }).stats();
  if (!decoded.channels.length) throw new Error('Invalid Unsplash image');
  return cover;
}
