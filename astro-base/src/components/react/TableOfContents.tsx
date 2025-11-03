import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -80% 0%',
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // H2, H3만 표시
  const tocHeadings = headings.filter((h) => h.depth === 2 || h.depth === 3);

  if (tocHeadings.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="sticky top-24"
    >
      <div className="text-xs">
        <p className="mb-3 text-muted-foreground uppercase tracking-wider">
          목차
        </p>
        <ul className="space-y-1.5 border-l border-border">
          {tocHeadings.map((heading) => (
            <li key={heading.slug}>
              <a
                href={`#${heading.slug}`}
                onClick={(e) => handleClick(e, heading.slug)}
                className={`block py-0.5 pl-3 border-l-2 -ml-[1px] transition-all ${
                  heading.depth === 3 ? 'pl-6' : ''
                } ${
                  activeId === heading.slug
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
}
