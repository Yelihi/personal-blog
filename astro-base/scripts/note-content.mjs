import { parseFrontmatter } from '@astrojs/markdown-remark';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export function noteSlug(id) {
  const slug = id.replace(/\.mdx$/, '').replace(/\/index$/, '');
  if (!slug || slug.split('/').some((s) => !/^[a-z0-9][a-z0-9-]*$/.test(s))) {
    throw new Error(`Invalid note slug: ${id}`);
  }
  return slug;
}
export async function readNoteFiles(root) {
  const base = path.join(root, 'src/content/notes');
  const files = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.name.endsWith('.mdx')) {
        const { frontmatter } = parseFrontmatter(await readFile(file, 'utf8'));
        files.push({
          id: noteSlug(path.relative(base, file)),
          file,
          data: frontmatter,
        });
      }
    }
  }
  await visit(base);
  const ids = new Set();
  for (const note of files) {
    if (ids.has(note.id)) throw new Error(`Duplicate note slug: ${note.id}`);
    ids.add(note.id);
  }
  return files;
}
// Only text descendants of paragraphs become a preview; expressions are never evaluated.
export function remarkNoteExcerpt() {
  return (tree, file) => {
    if (!String(file.path).replaceAll('\\', '/').includes('/content/notes/'))
      return;
    const checkImages = (node) => {
      if (
        ['image', 'imageReference'].includes(node.type) ||
        (node.type.startsWith('mdxJsx') &&
          ['img', 'Image', 'Picture', 'picture', 'svg', 'video'].includes(
            node.name
          ))
      ) {
        file.fail(
          'Notes use one representative image. Move this image to coverImage in frontmatter.',
          node
        );
      }
      for (const child of node.children ?? []) checkImages(child);
    };
    checkImages(tree);
    const text = (node) => {
      if (['text', 'inlineCode'].includes(node.type)) return node.value;
      if (
        node.type.startsWith('mdx') ||
        node.type === 'html' ||
        node.type === 'image'
      )
        return '';
      return (node.children ?? []).map(text).join('');
    };
    const paragraph = tree.children.find(
      (n) => n.type === 'paragraph' && text(n).trim()
    );
    file.data.astro.frontmatter.noteExcerpt = paragraph
      ? text(paragraph).trim().slice(0, 260)
      : '';
  };
}
