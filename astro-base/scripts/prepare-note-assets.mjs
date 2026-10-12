import { createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { readNoteFiles } from './note-content.mjs';
import { readCoverRegistry, verifyCoverImage } from './note-covers.mjs';

export async function prepareNoteAssets(
  root,
  {
    includeDrafts = true,
    verifyRemote = false,
    fetcher = fetch,
    warn = console.warn,
  } = {}
) {
  const registry = await readCoverRegistry(root);
  const notes = (await readNoteFiles(root)).filter(
    (note) => includeDrafts || !note.data.draft
  );
  const base = await realpath(path.join(root, 'src/content/notes'));
  const covers = {};
  const available = new Map();
  if (verifyRemote && notes.length) {
    const images = new Map();
    if (registry.default) images.set(registry.default.src, registry.default);
    for (const note of notes) {
      const image = registry.notes[note.id];
      if (!note.data.coverImage && image) images.set(image.src, image);
    }
    const unique = [...images.values()];
    // Bound downloads and decode memory; check duplicate URLs only once per build.
    for (let i = 0; i < unique.length; i += 4) {
      await Promise.all(
        unique.slice(i, i + 4).map(async (image) => {
          try {
            await verifyCoverImage(image, fetcher);
            available.set(image.src, true);
          } catch (error) {
            available.set(image.src, false);
            warn(`[notes:${image.attribution.photoId}] ${error.message}`);
          }
        })
      );
    }
  }
  const fallback =
    registry.default && available.get(registry.default.src) !== false
      ? registry.default
      : null;
  const prepared = new Map();
  await mkdir(path.join(root, 'public/notes-media'), { recursive: true });
  for (const note of notes) {
    if (!note.data.coverImage) {
      const selected = registry.notes[note.id];
      covers[note.id] =
        selected && available.get(selected.src) !== false ? selected : fallback;
      if (!covers[note.id])
        throw new Error(
          `[notes:${note.id}] No cover. Run node scripts/prepare-note-covers.mjs with UNSPLASH_ACCESS_KEY, or provide coverImage.`
        );
      continue;
    }
    try {
      if (typeof note.data.coverImage !== 'string')
        throw new Error('coverImage must be a local path');
      const file = await realpath(
        path.resolve(path.dirname(note.file), note.data.coverImage)
      );
      if (!file.startsWith(`${base}${path.sep}`))
        throw new Error('Image must be inside content/notes');
      const data = await readFile(file);
      const meta = await sharp(data, { limitInputPixels: 40000000 }).metadata();
      if (
        !['jpeg', 'png', 'webp', 'avif'].includes(meta.format) ||
        !meta.width ||
        !meta.height
      )
        throw new Error('Unsupported or invalid image');
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 20);
      let result = prepared.get(hash);
      if (!result) {
        result = await sharp(data)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true });
        const output = path.join(root, `public/notes-media/${hash}.webp`);
        await writeFile(output, result.data);
        const thumbnail = await sharp(result.data)
          .resize({ width: 320, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
        await writeFile(
          path.join(root, `public/notes-media/${hash}-320.webp`),
          thumbnail
        );
        prepared.set(hash, result);
      }
      covers[note.id] = {
        source: 'local',
        thumbnailSrc: `/notes-media/${hash}-320.webp`,
        src: `/notes-media/${hash}.webp`,
        width: result.info.width,
        height: result.info.height,
        alt: note.data.coverAlt ?? note.data.title,
      };
    } catch (error) {
      if (!fallback)
        throw new Error(
          `[notes:${note.id}] ${error.message}. Prepare the Unsplash default cover first.`
        );
      warn(
        `[notes:${note.id}] Invalid local cover; using saved Unsplash default`
      );
      covers[note.id] = fallback;
    }
  }
  await mkdir(path.join(root, '.cache/notes'), { recursive: true });
  await writeFile(
    path.join(root, '.cache/notes/covers.json'),
    JSON.stringify({ covers, fallback })
  );
}

export async function pruneNoteBuildAssets(root, output) {
  const { covers } = JSON.parse(
    await readFile(path.join(root, '.cache/notes/covers.json'), 'utf8')
  );
  const activeFiles = new Set(
    Object.values(covers)
      .filter((cover) => cover.source === 'local')
      .flatMap((cover) => [
        path.basename(cover.src),
        path.basename(cover.thumbnailSrc),
      ])
  );
  for (const file of await readdir(path.join(output, 'notes-media')).catch(
    (error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  )) {
    if (/^[a-f0-9]{20}(-320)?\.webp$/.test(file) && !activeFiles.has(file))
      await rm(path.join(output, 'notes-media', file));
  }
}
