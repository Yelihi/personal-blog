import { Sun, Moon } from 'lucide-react';

interface Props {
  currentPage: string;
}

const navItems: { id: string; label: string; href: string }[] = [
  { id: '', label: 'Home', href: '/' },
  { id: 'articles', label: 'Articles', href: '/articles' },
  { id: 'about', label: 'About', href: '/about' },
];

const Header = ({ currentPage }: Props) => {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');

    localStorage.setItem(
      'theme',
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-background/95 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-4 items-center h-20">
          {/* Logo */}
          <div className="col-span-4 lg:col-span-3">
            <a
              href="/"
              aria-label="Home"
              className="tracking-tight flex items-center gap-3 hover:translate-x-0.5 transition-transform"
            >
              <div className="w-px h-8 bg-foreground"></div>
              <span className="text-xl">Blog</span>
            </a>
          </div>

          {/* Desktop Navigation - Only on Desktop (>= 1024px) */}
          <nav className="hidden lg:flex col-span-6 items-center justify-center gap-12">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                className={`relative text-sm tracking-wide uppercase transition-colors ${
                  currentPage === item.id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
                {currentPage === item.id && (
                  <div className="absolute -bottom-[21px] left-0 right-0 h-px bg-foreground"></div>
                )}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="col-span-8 lg:col-span-3 flex items-center justify-end gap-6">
            {/* Mobile/Tablet Navigation (< 1024px) */}
            <nav className="flex lg:hidden items-center gap-4">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  aria-label={item.label}
                  className={`text-xs tracking-wide uppercase transition-colors ${
                    currentPage === item.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              className="p-2 hover:bg-secondary transition-colors border border-border"
              aria-label="테마 전환"
              onClick={toggleTheme}
            >
              <Sun className="w-4 h-4 dark:hidden" />
              <Moon className="w-4 h-4 hidden dark:block" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
