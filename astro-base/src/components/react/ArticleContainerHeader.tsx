interface ArticleContainerHeaderProps {
  numberOfArticles: number;
  selectedCategory: string;
}

const ArticleContainerHeader = ({
  numberOfArticles,
  selectedCategory,
}: ArticleContainerHeaderProps) => {
  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-foreground"></div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                All Articles
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl tracking-tight">
              모든 글
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl">
              개발, 디자인, 그리고 배움의 기록
            </p>
          </div>

          <div className="col-span-12 md:col-span-4 flex items-end">
            <div className="border-l border-border pl-6 space-y-2">
              <p className="text-3xl tracking-tight">{numberOfArticles}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                {selectedCategory === 'All' ? 'Total Posts' : selectedCategory}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArticleContainerHeader;
