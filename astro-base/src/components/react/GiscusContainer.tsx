import Giscus from '@giscus/react';

const GiscusContainer = () => {
  return (
    <div className="giscus-wrapper mt-16 pt-16 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-px bg-foreground"></div>
          <h2 className="text-2xl tracking-tight">댓글</h2>
        </div>

        <Giscus
          repo="Yelihi/personal-blog"
          repoId="R_kgD0QG9veA"
          category="blog_comments"
          categoryId="DIC_kwD0QG9veM4CxXlt"
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme="preferred_color_scheme"
          lang="ko"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default GiscusContainer;
