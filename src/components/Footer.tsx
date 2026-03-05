import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-primary/20 mt-20 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-sm text-muted-foreground">
          <p>&copy; 2026 STAYVIGIL // STAY PARANOID</p>
          <div className="flex items-center gap-6 text-xs uppercase tracking-wider">
            <Link
              href="/docs"
              className="hover:text-primary transition-colors"
            >
              API Docs
            </Link>
            <Link
              href="/auditor"
              className="hover:text-primary transition-colors"
            >
              Auditors
            </Link>
            <a
              href="https://github.com/wawatjirka/StayVigil"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://x.com/StayVigil"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
