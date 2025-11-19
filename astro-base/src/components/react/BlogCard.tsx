import { motion } from 'motion/react';
import { Calendar, Tag, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

import type { BlogCardProps } from '@/components/react/interface';

export function BlogCard({ post, onClick, index, href }: BlogCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  /**
   * 해당 post 의 링크를 복사하는 함수
   */
  const copyPostLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 클릭 이벤트가 상위로 전파되지 않도록 처리
    e.stopPropagation();
    navigator.clipboard.writeText(href || window.location.href);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index ? index * 0.1 : 0, duration: 0.5 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer border border-border hover:border-foreground transition-colors"
    >
      {post.coverImage && (
        <div className="relative aspect-[16/10] overflow-hidden bg-muted border-b border-border">
          <img
            src={post.coverImage.src}
            alt={post.title}
            width={post.coverImage.width}
            height={post.coverImage.height}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute top-4 right-4 flex gap-2"
          >
            <button
              onClick={copyPostLink}
              className="p-2.5 bg-background/90 backdrop-blur-sm border border-border hover:bg-background hover:border-foreground transition-colors"
              aria-label="Copy link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3" />
            <span>{post.category}</span>
          </div>
          <span className="w-px h-3 bg-border" />
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <time>{post.date}</time>
          </div>
        </div>

        <h3 className="text-xl line-clamp-2 group-hover:text-muted-foreground transition-colors">
          {post.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed overflow-hidden text-ellipsis max-h-[40px] min-h-[40px]">
          {post.excerpt}
        </p>

        {post.readTime && (
          <div className="pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {post.readTime}
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
}
