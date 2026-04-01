'use client';

import { useState, useEffect } from 'react';

interface KBCompletion {
  percentage: number;
  filled: number;
  total: number;
  missing: string[];
}

const KB_FIELDS = [
  { key: 'companyName', label: 'Company Name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'website', label: 'Website' },
  { key: 'aboutUs', label: 'About Us' },
  { key: 'differentiators', label: 'Differentiators' },
  { key: 'logoPath', label: 'Logo' },
];

const KB_ARRAY_FIELDS = [
  { key: 'products', label: 'Products' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'caseStudies', label: 'Case Studies' },
];

const KB_NESTED_FIELDS = [
  { path: 'icp.industries', label: 'Target Industries' },
  { path: 'icp.personas', label: 'Target Personas' },
  { path: 'brandVoice.tone', label: 'Brand Tone' },
];

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function useKBCompletion(): KBCompletion {
  const [completion, setCompletion] = useState<KBCompletion>({
    percentage: 0,
    filled: 0,
    total: KB_FIELDS.length + KB_ARRAY_FIELDS.length + KB_NESTED_FIELDS.length,
    missing: [],
  });

  useEffect(() => {
    fetch('/api/knowledge-base')
      .then(res => res.ok ? res.json() : null)
      .then(kb => {
        if (!kb) return;

        const total = KB_FIELDS.length + KB_ARRAY_FIELDS.length + KB_NESTED_FIELDS.length;
        const missing: string[] = [];
        let filled = 0;

        for (const field of KB_FIELDS) {
          const val = kb[field.key];
          if (val && typeof val === 'string' && val.trim()) {
            filled++;
          } else {
            missing.push(field.label);
          }
        }

        for (const field of KB_ARRAY_FIELDS) {
          const val = kb[field.key];
          if (Array.isArray(val) && val.length > 0) {
            filled++;
          } else {
            missing.push(field.label);
          }
        }

        for (const field of KB_NESTED_FIELDS) {
          const val = getNestedValue(kb as Record<string, unknown>, field.path);
          if (val && ((typeof val === 'string' && val.trim()) || (Array.isArray(val) && val.length > 0))) {
            filled++;
          } else {
            missing.push(field.label);
          }
        }

        setCompletion({
          percentage: Math.round((filled / total) * 100),
          filled,
          total,
          missing,
        });
      })
      .catch(() => {});
  }, []);

  return completion;
}
