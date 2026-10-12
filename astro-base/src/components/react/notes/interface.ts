export interface NoteImage {
  src: string;
  thumbnailSrc?: string;
  width: number;
  height: number;
  alt: string;
  source: 'local' | 'unsplash';
  attribution?: {
    photoId: string;
    photographer: string;
    photographerUrl: string;
    photoUrl: string;
  };
}
export interface NoteSummary {
  id: string;
  href: string;
  title: string;
  dateISO: string;
  dateLabel: string;
  excerpt: string;
  cover: NoteImage;
}
export interface NoteIndex {
  revision: string;
  notes: readonly NoteSummary[];
  fallbackCover: NoteImage | null;
}
