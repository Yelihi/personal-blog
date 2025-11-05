import { useState } from 'react';

import ArticleCardSection from '@/components/react/ArticleCardSection';
import CategoryFilterSection from '@/components/react/CategoriFilterSection';
import ArticleContainerHeader from '@/components/react/ArticleContainerHeader';

import type { ArticlesContainerProps } from '@/components/react/interface';

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
