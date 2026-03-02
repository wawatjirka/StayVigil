export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">V</span>
          </div>
          <span>Vigil Protocol</span>
        </div>
        <p>Decentralized skill verification on Base. Powered by Claude AI.</p>
      </div>
    </footer>
  );
}
