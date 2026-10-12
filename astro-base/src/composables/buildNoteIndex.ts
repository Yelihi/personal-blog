import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { render, type CollectionEntry } from 'astro:content';
import { noteSlug } from '../../scripts/note-content.mjs';
import type { NoteImage, NoteIndex } from '@/components/react/notes/interface';

export async function buildNoteIndex(
  entries: CollectionEntry<'notes'>[]
): Promise<NoteIndex> {
  const manifest = JSON.parse(
    await readFile('.cache/notes/covers.json', 'utf8')
  ) as { covers: Record<string, NoteImage>; fallback: NoteImage | null };
  const notes = await Promise.all(
    entries.map(async (entry) => {
      const id = noteSlug(entry.id);
      const { remarkPluginFrontmatter } = await render(entry);
      const cover = manifest.covers[id];
      if (!cover) throw new Error(`Missing prepared note image: ${id}`);
      return {
        id,
        href: `/notes/${id}/`,
        title: entry.data.title,
        dateISO: entry.data.date,
        dateLabel: entry.data.date.replaceAll('-', '.'),
        excerpt:
          entry.data.excerpt ??
          String(remarkPluginFrontmatter.noteExcerpt ?? ''),
        cover,
      };
    })
  );
  notes.sort(
    (a, b) => b.dateISO.localeCompare(a.dateISO) || a.id.localeCompare(b.id)
  );
  return {
    notes,
    fallbackCover: manifest.fallback,
    revision: createHash('sha256')
      .update(JSON.stringify(notes))
      .digest('hex')
      .slice(0, 16),
  };
}
