import { BlogCard } from './BlogCard';
import type { Article } from './ArticlesContainer';

interface ArticleCardSectionProps {
  filteredArticles: Article[];
}

const ArticleCardSection = ({ filteredArticles }: ArticleCardSectionProps) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <a key={article.id} href={`/articles/${article.id}`}>
              <BlogCard
                index={index}
                post={{
                  id: article.id,
                  title: article.data.title,
                  excerpt: article.data.excerpt,
                  coverImage: article.data.coverImage,
                  date: article.data.date,
                  category: article.data.category,
                  readTime: article.data.readTime,
                  featured: article.data.featured,
                }}
                href={`/articles/${article.id}`}
              />
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">
            해당 카테고리에 글이 없습니다.
          </p>
          <a
            href="/articles"
            className="inline-block mt-6 text-sm underline hover:text-foreground transition-colors"
          >
            전체 글 보기
          </a>
        </div>
      )}
    </section>
  );
};

export default ArticleCardSection;
