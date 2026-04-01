'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CONTENT_TYPE_LABELS, ContentType } from '@/lib/types';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
  HiOutlineBookOpen,
  HiOutlineCube,
  HiOutlineXMark,
} from 'react-icons/hi2';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'history' | 'library' | 'product';
  href: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on / or Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const searchResults: SearchResult[] = [];
    const lq = q.toLowerCase();

    try {
      // Search history
      const histRes = await fetch('/api/history');
      if (histRes.ok) {
        const history = await histRes.json();
        for (const item of history) {
          const label = CONTENT_TYPE_LABELS[item.contentType as ContentType] || item.contentType;
          if (
            item.prospect?.companyName?.toLowerCase().includes(lq) ||
            label.toLowerCase().includes(lq) ||
            item.additionalContext?.toLowerCase().includes(lq)
          ) {
            searchResults.push({
              id: `h-${item.id}`,
              title: `${item.prospect?.companyName || 'Unknown'} — ${label}`,
              subtitle: new Date(item.generatedAt).toLocaleDateString(),
              category: 'history',
              href: '/history',
            });
          }
        }
      }

      // Search library
      const libRes = await fetch('/api/library');
      if (libRes.ok) {
        const library = await libRes.json();
        for (const item of library) {
          const label = CONTENT_TYPE_LABELS[item.contentType as ContentType] || item.contentType;
          if (
            item.prospect?.companyName?.toLowerCase().includes(lq) ||
            label.toLowerCase().includes(lq) ||
            item.tags?.some((t: string) => t.toLowerCase().includes(lq))
          ) {
            searchResults.push({
              id: `l-${item.id}`,
              title: `${item.prospect?.companyName || 'Unknown'} — ${label}`,
              subtitle: `Shared by ${item.sharedBy}`,
              category: 'library',
              href: '/library',
            });
          }
        }
      }

      // Search products
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const products = await prodRes.json();
        for (const item of products) {
          if (
            item.name?.toLowerCase().includes(lq) ||
            item.shortDescription?.toLowerCase().includes(lq)
          ) {
            searchResults.push({
              id: `p-${item.id}`,
              title: item.name,
              subtitle: item.shortDescription || 'Product',
              category: 'product',
              href: '/products',
            });
          }
        }
      }
    } catch {
      // Non-critical
    }

    setResults(searchResults.slice(0, 15));
    setSelectedIndex(0);
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => search(query), 250);
    return () => clearTimeout(timeout);
  }, [query, search]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href);
      setOpen(false);
    }
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'history': return <HiOutlineClock className="text-sm" />;
      case 'library': return <HiOutlineBookOpen className="text-sm" />;
      case 'product': return <HiOutlineCube className="text-sm" />;
      default: return null;
    }
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'history': return 'History';
      case 'library': return 'Library';
      case 'product': return 'Products';
      default: return '';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Search panel */}
      <div
        className="relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <HiOutlineMagnifyingGlass className="text-lg flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search history, library, products..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-black/5">
            <HiOutlineXMark style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Searching...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((result, i) => (
                <button
                  key={result.id}
                  onClick={() => { router.push(result.href); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor: i === selectedIndex ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span style={{ color: i === selectedIndex ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {categoryIcon(result.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {result.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {result.subtitle}
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {categoryLabel(result.category)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!query && !loading && (
            <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">G</kbd> Generate</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">H</kbd> History</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">L</kbd> Library</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">R</kbd> ROI Calculator</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">P</kbd> Products</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">K</kbd> Knowledge Base</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">/</kbd> Search</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">Esc</kbd> Close</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">?</kbd> Show shortcuts</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t text-[10px] flex items-center gap-4" style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
          <span><kbd className="px-1 py-0.5 rounded bg-black/5 font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-black/5 font-mono">↵</kbd> Open</span>
          <span><kbd className="px-1 py-0.5 rounded bg-black/5 font-mono">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
