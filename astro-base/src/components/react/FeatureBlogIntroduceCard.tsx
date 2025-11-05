import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import ImageWithFallback from '@/components/react/ImageWithFallback';

import type { FeatureBlogIntroduceCardProps } from '@/components/react/interface';

const FeatureBlogIntroduceCard = ({
  featuredPost,
  href,
}: FeatureBlogIntroduceCardProps) => {
  return (
    <motion.a
      href={href}
      aria-label={featuredPost.title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="group cursor-pointer"
    >
      <div className="grid grid-cols-12 gap-8">
        {/* Image */}
        <div className="col-span-12 lg:col-span-7 order-2 lg:order-1">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted border border-border group-hover:border-foreground transition-colors">
            <ImageWithFallback
              src={featuredPost.coverImage?.src}
              alt={featuredPost.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Content */}
        <div className="col-span-12 lg:col-span-5 order-1 lg:order-2 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-4 text-xs uppercase tracking-wide text-muted-foreground">
            <span>{featuredPost.category}</span>
            <span className="w-px h-3 bg-border" />
            <time>{featuredPost.date}</time>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight group-hover:text-muted-foreground transition-colors">
            {featuredPost.title}
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            {featuredPost.excerpt}
          </p>

          <div className="flex items-center gap-2 text-sm pt-4 border-t border-border">
            <span className="uppercase tracking-wide">Read More</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
          </div>
        </div>
      </div>
    </motion.a>
  );
};

export default FeatureBlogIntroduceCard;
