import type { InferEntrySchema, RenderedContent } from 'astro:content';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  coverImage?: ImageMetadata;
  readTime?: string;
  featured?: boolean;
}

export interface BlogCardProps {
  post: BlogPost;
  onClick?: () => void;
  index?: number;
  href?: string;
}

export interface FeatureBlogIntroduceCardProps {
  featuredPost: BlogPost;
  href: string;
}

export interface CategoryFilterSectionProps {
  categories: string[];
  selectCategory: (category: string) => void;
  selectedCategory: string;
}

export interface Article {
  id: string;
  body?: string;
  collection: 'articles';
  data: InferEntrySchema<'articles'>;
  rendered?: RenderedContent;
  filePath?: string;
}

export interface ArticlesContainerProps {
  initialArticles: Article[];
}

export interface ArticleCardSectionProps {
  filteredArticles: Article[];
}

export interface ArticleContainerHeaderProps {
  numberOfArticles: number;
  selectedCategory: string;
}
