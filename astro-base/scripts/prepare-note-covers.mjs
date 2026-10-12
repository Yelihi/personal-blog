import { mkdir, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readNoteFiles } from './note-content.mjs';
import {
  chooseCover,
  readCoverRegistry,
  writeRegistry,
} from './note-covers.mjs';

export async function prepareNoteCovers(
  root,
  {
    accessKey,
    fetcher = fetch,
    includeDrafts = false,
    warn = console.warn,
  } = {}
) {
  const notes = (await readNoteFiles(root)).filter(
    (note) => includeDrafts || !note.data.draft
  );
  const summary = { selected: 0, reused: 0, local: 0, fallback: 0 };
  if (!notes.length) return summary;
  const lockPath = path.join(root, 'src/data/.note-covers.lock');
  await mkdir(path.dirname(lockPath), { recursive: true });
  const lock = await open(lockPath, 'wx').catch((error) => {
    if (error.code !== 'EEXIST') throw error;
    throw new Error(
      'Another cover preparation is running; inspect .note-covers.lock before retrying'
    );
  });
  try {
    const registry = await readCoverRegistry(root);
    if (!registry.default) {
      registry.default = await chooseCover(accessKey, fetcher);
      await writeRegistry(root, registry);
    }
    let stopped = false;
    for (const note of notes) {
      if (note.data.coverImage) {
        summary.local++;
        continue;
      }
      if (registry.notes[note.id]) {
        summary.reused++;
        continue;
      }
      if (!stopped) {
        let cover;
        try {
          cover = await chooseCover(accessKey, fetcher);
        } catch (error) {
          stopped = Boolean(error.stopRequests);
          warn(
            `[notes:${note.id}] ${error.message}; using default for this build only`
          );
        }
        if (cover) {
          registry.notes[note.id] = cover;
          await writeRegistry(root, registry);
          summary.selected++;
          continue;
        }
      }
      // A transient failure must not freeze the default as this note's selection.
      summary.fallback++;
    }
    return summary;
  } finally {
    try {
      await lock.close();
    } finally {
      await unlink(lockPath);
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  if (
    process.argv.includes('--local-only') &&
    process.env.CI &&
    process.env.CI !== 'false'
  ) {
    console.log('CI uses committed note-covers.json; no random selection.');
  } else {
    try {
      process.loadEnvFile();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const summary = await prepareNoteCovers(process.cwd(), {
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      includeDrafts: process.argv.includes('--include-drafts'),
    });
    console.log('Note covers prepared:', summary);
  }
}
