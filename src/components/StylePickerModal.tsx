'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HiOutlineXMark, HiOutlineMagnifyingGlass, HiOutlineCheck } from 'react-icons/hi2';
import { DOCUMENT_STYLES, getDefaultStyleForContentType, getStyle, getRecommendationsForContentType, StyleRecommendation } from '@/lib/documentStyles/registry';
import { STYLE_CATEGORIES } from '@/lib/documentStyles/types';
import type { DocumentStyle } from '@/lib/documentStyles/types';
import { CONTENT_TYPE_LABELS } from '@/lib/types';

interface StylePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (styleId: string) => void;
  contentType: string;
  accentColor?: string;
}

type CategoryFilter = 'all' | 'clean' | 'bold' | 'corporate' | 'creative';

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clean', label: 'Clean & Modern' },
  { key: 'bold', label: 'Bold & Impactful' },
  { key: 'corporate', label: 'Corporate & Professional' },
  { key: 'creative', label: 'Creative & Distinctive' },
];

export default function StylePickerModal({
  isOpen,
  onClose,
  onSelect,
  contentType,
  accentColor = '#6366F1',
}: StylePickerModalProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const lastClickTimeRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  // On open, auto-select default for content type
  useEffect(() => {
    if (isOpen) {
      const defaultStyleId = getDefaultStyleForContentType(contentType);
      setSelectedId(defaultStyleId);
      setSearch('');
      setCategoryFilter('all');
    }
  }, [isOpen, contentType]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const defaultStyleId = useMemo(
    () => getDefaultStyleForContentType(contentType),
    [contentType]
  );

  const filteredStyles = useMemo(() => {
    let styles = DOCUMENT_STYLES;
    if (categoryFilter !== 'all') {
      styles = styles.filter((s) => s.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      styles = styles.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.keywords.some((k) => k.toLowerCase().includes(q)) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return styles;
  }, [categoryFilter, search]);

  const selectedStyle = useMemo(
    () => DOCUMENT_STYLES.find((s) => s.id === selectedId),
    [selectedId]
  );

  const recommendations = useMemo(
    () => getRecommendationsForContentType(contentType),
    [contentType]
  );

  const recommendedStyles = useMemo(() => {
    return recommendations
      .map(rec => {
        const style = DOCUMENT_STYLES.find(s => s.id === rec.styleId);
        return style ? { ...rec, style } : null;
      })
      .filter(Boolean) as (StyleRecommendation & { style: DocumentStyle })[];
  }, [recommendations]);

  const handleThumbnailClick = useCallback(
    (style: DocumentStyle) => {
      const now = Date.now();
      const last = lastClickTimeRef.current;
      if (last.id === style.id && now - last.time < 400) {
        // Double click
        onSelect(style.id);
        return;
      }
      lastClickTimeRef.current = { id: style.id, time: now };
      setSelectedId(style.id);
    },
    [onSelect]
  );

  const handleConfirm = useCallback(() => {
    if (selectedId) onSelect(selectedId);
  }, [selectedId, onSelect]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{
          width: '90vw',
          height: '85vh',
          maxWidth: '1400px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, #e5e7eb)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--card-border, #e5e7eb)' }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary, #111827)' }}
          >
            Choose a Document Style
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--text-primary, #6b7280)' }}
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* ── Search + Category Tabs ── */}
        <div
          className="px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--card-border, #e5e7eb)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-shrink-0 sm:w-64">
              <HiOutlineMagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-secondary, #9ca3af)' }}
              />
              <input
                type="text"
                placeholder="Search styles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--card-border, #e5e7eb)',
                  backgroundColor: 'var(--content-bg, #ffffff)',
                  color: 'var(--text-primary, #111827)',
                  // @ts-expect-error CSS custom property for ring color
                  '--tw-ring-color': accentColor,
                }}
              />
            </div>
            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto flex-1">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCategoryFilter(tab.key)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors"
                  style={
                    categoryFilter === tab.key
                      ? {
                          backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                          color: accentColor,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary, #6b7280)',
                        }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredStyles.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary, #9ca3af)' }}
              >
                No styles match your search.
              </p>
            </div>
          ) : (
            <>
            {/* Recommended Section */}
            {categoryFilter === 'all' && recommendedStyles.length > 0 && !search.trim() && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  Recommended for {CONTENT_TYPE_LABELS[contentType as keyof typeof CONTENT_TYPE_LABELS] || contentType}
                </h3>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {recommendedStyles.map(({ style, reason }) => {
                    const isSelected = style.id === selectedId;
                    return (
                      <div
                        key={`rec-${style.id}`}
                        onClick={() => handleThumbnailClick(style)}
                        title={style.description}
                        className="cursor-pointer rounded-lg overflow-hidden transition-all duration-150"
                        style={{
                          border: isSelected
                            ? `2px solid ${accentColor}`
                            : `2px solid color-mix(in srgb, ${accentColor} 30%, var(--card-border, #e5e7eb))`,
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                          backgroundColor: 'var(--card-bg, #ffffff)',
                        }}
                      >
                        {/* Thumbnail */}
                        <div className="relative" style={{ height: '200px', overflow: 'hidden' }}>
                          <div
                            style={{
                              transform: 'scale(0.2)',
                              transformOrigin: 'top left',
                              width: '500%',
                              height: '500%',
                              pointerEvents: 'none',
                            }}
                            dangerouslySetInnerHTML={{ __html: style.thumbnail(accentColor) }}
                          />
                          {isSelected && (
                            <div
                              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: accentColor }}
                            >
                              <HiOutlineCheck className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        {/* Info with Recommended badge */}
                        <div className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary, #111827)' }}>
                              {style.name}
                            </p>
                            <span
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                                color: accentColor,
                              }}
                            >
                              Recommended
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5 italic" style={{ color: 'var(--text-muted, #9ca3af)' }}>
                            {reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Divider */}
                <div className="mt-6 border-b" style={{ borderColor: 'var(--card-border, #e5e7eb)' }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider mt-4 mb-3" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  All Styles
                </h3>
              </div>
            )}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(220px, 1fr))',
              }}
            >
              {filteredStyles.map((style) => {
                const isSelected = style.id === selectedId;
                const isDefault = style.id === defaultStyleId;
                return (
                  <div
                    key={style.id}
                    onClick={() => handleThumbnailClick(style)}
                    title={style.description}
                    className="cursor-pointer rounded-lg overflow-hidden transition-all duration-150"
                    style={{
                      border: isSelected
                        ? `2px solid ${accentColor}`
                        : '2px solid var(--card-border, #e5e7eb)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      backgroundColor: 'var(--card-bg, #ffffff)',
                    }}
                  >
                    {/* Thumbnail preview */}
                    <div
                      className="relative"
                      style={{
                        height: '200px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          transform: 'scale(0.2)',
                          transformOrigin: 'top left',
                          width: '500%',
                          height: '500%',
                          pointerEvents: 'none',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: style.thumbnail(accentColor),
                        }}
                      />
                      {/* Selected checkmark overlay */}
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: accentColor }}
                        >
                          <HiOutlineCheck className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{
                            color: 'var(--text-primary, #111827)',
                          }}
                        >
                          {style.name}
                        </p>
                        {recommendations.some(r => r.styleId === style.id) && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                              color: accentColor,
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-medium mt-1 inline-block px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor:
                            'var(--card-border, #f3f4f6)',
                          color: 'var(--text-secondary, #6b7280)',
                        }}
                      >
                        {STYLE_CATEGORIES[style.category]?.label ||
                          style.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--card-border, #e5e7eb)' }}
        >
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            Generate with {selectedStyle?.name || 'selected style'}
          </button>
        </div>
      </div>
    </div>
  );
}
