'use client';

import { useEffect, useState, use } from 'react';
import { CONTENT_TYPE_LABELS, ContentType } from '@/lib/types';

interface ShareData {
  sections: { title: string; content: string }[];
  contentType: string;
  prospect: { companyName: string; industry: string };
  createdAt: string;
  logoBase64?: string;
}

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/share?id=${id}`)
      .then(res => {
        if (res.status === 404) throw new Error('Document not found');
        if (res.status === 410) throw new Error('This link has expired');
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading document...</div>
      </div>
    );
  }

  const label = CONTENT_TYPE_LABELS[data.contentType as ContentType] || data.contentType;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          {data.logoBase64 && (
            <img src={data.logoBase64} alt="Logo" className="h-8 mb-4 object-contain" />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{label}</h1>
          <p className="text-gray-500">
            Prepared for {data.prospect.companyName}
            {data.prospect.industry && ` · ${data.prospect.industry}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(data.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {data.sections.map((section, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
