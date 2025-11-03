import * as React from 'react';
import { Github, Mail, Twitter } from 'lucide-react';

const SOCIAL_LINKS: { icon: React.ElementType; href: string; label: string }[] =
  [
    {
      icon: Github,
      href: '#',
      label: 'GitHub',
    },
    {
      icon: Twitter,
      href: '#',
      label: 'Twitter',
    },
    {
      icon: Mail,
      href: '#',
      label: 'Email',
    },
  ];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-px h-8 bg-foreground"></div>
              <span className="text-xl tracking-tight">Blog</span>
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide border-l border-border pl-4">
              © {currentYear} All rights reserved
            </p>
          </div>

          <div className="col-span-12 md:col-span-6 flex items-end justify-start md:justify-end">
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="p-3 border border-border hover:border-foreground hover:-translate-y-0.5 transition-all"
                  aria-label={link.label}
                >
                  <link.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
