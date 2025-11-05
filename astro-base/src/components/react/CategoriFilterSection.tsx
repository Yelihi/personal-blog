import type { CategoryFilterSectionProps } from '@/components/react/interface';

const CategoryFilterSection = ({
  categories,
  selectCategory,
  selectedCategory,
}: CategoryFilterSectionProps) => {
  const changeRoute = (category: string) => {
    selectCategory(category);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-border">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground mr-4">
          Filter:
        </span>
        {categories.map((category) => (
          <div
            role="link"
            key={category}
            className={`px-4 py-2 text-sm border transition-colors cursor-pointer ${
              selectedCategory === category
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground'
            }`}
            onClick={() => changeRoute(category)}
          >
            {category}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryFilterSection;
