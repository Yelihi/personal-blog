import { useState } from 'react';
import type { InferEntrySchema, RenderedContent } from 'astro:content';

import ArticleCardSection from './ArticleCardSection';
import CategoryFilterSection from './CategoriFilterSection';
import ArticleContainerHeader from './ArticleContainerHeader';

export interface Article {
  id: string;
  body?: string;
  collection: 'articles';
  data: InferEntrySchema<'articles'>;
  rendered?: RenderedContent;
  filePath?: string;
}

interface ArticlesContainerProps {
  initialArticles: Article[];
}

const ArticlesContainer = ({ initialArticles }: ArticlesContainerProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filterCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const categories = [
    'All',
    ...new Set(initialArticles.map((article) => article.data.category)),
  ];
  const filteredArticles =
    selectedCategory === 'All'
      ? initialArticles
      : initialArticles.filter(
          (article) => article.data.category === selectedCategory
        );

  return (
    <>
      <ArticleContainerHeader
        numberOfArticles={filteredArticles.length}
        selectedCategory={selectedCategory}
      />
      <CategoryFilterSection
        selectedCategory={selectedCategory}
        selectCategory={filterCategory}
        categories={categories}
      />
      <ArticleCardSection filteredArticles={filteredArticles} />
    </>
  );
};

export default ArticlesContainer;
