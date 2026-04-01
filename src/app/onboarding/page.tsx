'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineGlobeAlt, HiOutlineCube, HiOutlineUsers, HiOutlinePhoto, HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { INDUSTRY_PACKS, type IndustryPack } from '@/lib/industryPacks';

const STEPS = [
  { icon: HiOutlineGlobeAlt, title: 'Your Website', subtitle: "We'll scan it to get started fast" },
  { icon: HiOutlineCube, title: 'What You Sell', subtitle: 'One sentence is enough' },
  { icon: HiOutlineBuildingOffice2, title: 'Your Industry', subtitle: 'Pick one to get tailored templates and competitors' },
  { icon: HiOutlineUsers, title: 'Your Competition', subtitle: 'Helps us write stronger battle cards' },
  { icon: HiOutlinePhoto, title: 'Your Logo', subtitle: 'Optional — makes exports look professional' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [website, setWebsite] = useState('');
  const [product, setProduct] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryPack | null>(null);

  const scanWebsite = async () => {
    if (!website.trim()) return;
    setScanning(true);
    setScanResult('');
    try {
      let url = website.trim();
      if (!url.startsWith('http')) url = `https://${url}`;

      const res = await fetch('/api/website-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const d = JSON.parse(line.slice(6));
                  if (d.phase === 'done' && d.data) {
                    // Save extracted data to KB
                    const kbRes = await fetch('/api/knowledge-base');
                    const kb = kbRes.ok ? await kbRes.json() : {};
                    const extracted = d.data;
                    kb.companyName = extracted.companyName || kb.companyName || '';
                    kb.aboutUs = extracted.aboutUs || kb.aboutUs || '';
                    kb.website = website;
                    if (extracted.products?.length) kb.products = extracted.products;
                    if (extracted.differentiators) kb.differentiators = extracted.differentiators;
                    await fetch('/api/knowledge-base', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(kb),
                    });
                    setScanResult(`Found: ${kb.companyName || 'your company'}. ${extracted.products?.length || 0} products detected.`);
                    if (extracted.products?.[0]?.description) setProduct(extracted.products[0].description);
                    fullText = 'done';
                  } else if (d.phase === 'scanning') {
                    setScanResult(d.message || 'Scanning...');
                  }
                } catch { /* skip */ }
              }
            }
          }
        }
        if (!fullText) setScanResult('Scan complete');
      }
    } catch {
      setScanResult('Could not scan — you can fill in details manually');
    }
    setScanning(false);
  };

  const saveStep2 = async () => {
    if (product.trim()) {
      const kbRes = await fetch('/api/knowledge-base');
      const kb = kbRes.ok ? await kbRes.json() : {};
      if (!kb.products || kb.products.length === 0) {
        kb.products = [{ id: '1', name: 'Main Product', description: product.trim(), keyFeatures: [], pricing: '' }];
      }
      await fetch('/api/knowledge-base', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kb) });
    }
    setStep(2);
  };

  const saveIndustryStep = async (pack: IndustryPack | null) => {
    setSelectedIndustry(pack);
    if (pack) {
      // Auto-fill competitor field with the pack's competitors
      setCompetitor(pack.competitors.join(', '));
      // Save industry selection to knowledge base
      try {
        const kbRes = await fetch('/api/knowledge-base');
        const kb = kbRes.ok ? await kbRes.json() : {};
        kb.industry = pack.id;
        kb.industryName = pack.name;
        kb.industryPainPoints = pack.painPoints;
        await fetch('/api/knowledge-base', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kb) });
      } catch { /* skip */ }
    }
    setStep(3);
  };

  const saveStep3 = async () => {
    if (competitor.trim()) {
      const kbRes = await fetch('/api/knowledge-base');
      const kb = kbRes.ok ? await kbRes.json() : {};
      kb.competitors = [{ id: '1', name: competitor.trim(), howWeBeatThem: '' }, ...(kb.competitors || [])];
      await fetch('/api/knowledge-base', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kb) });
    }
    setStep(4);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const themeRes = await fetch('/api/theme');
        const theme = themeRes.ok ? await themeRes.json() : {};
        theme.logoBase64 = base64;
        await fetch('/api/theme', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(theme) });
        toast.success('Logo uploaded!');
      } catch { /* skip */ }
    };
    reader.readAsDataURL(file);
  };

  const finishOnboarding = () => {
    // Get KB to find industry
    router.push('/generate?autoGenerate=true&contentType=solution-one-pager');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}>
      <div className={`w-full mx-4 ${step === 2 ? 'max-w-2xl' : 'max-w-lg'}`}>
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{ backgroundColor: i <= step ? 'var(--accent)' : 'var(--card-border)' }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="card">
          <div className="text-center mb-6">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="mx-auto text-3xl mb-3" style={{ color: 'var(--accent)' }} />; })()}
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{STEPS[step].title}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{STEPS[step].subtitle}</p>
          </div>

          {/* Step 1: Website */}
          {step === 0 && (
            <div className="space-y-4">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="yourcompany.com"
                className="w-full border rounded-xl px-4 py-3 text-center text-lg"
                style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                autoFocus
              />
              {scanResult && <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{scanResult}</p>}
              <div className="flex gap-3">
                <button onClick={scanWebsite} disabled={scanning || !website.trim()} className="flex-1 btn-accent py-3 text-sm">
                  {scanning ? 'Scanning...' : 'Scan My Website'}
                </button>
                <button onClick={() => setStep(1)} className="btn-secondary px-4 py-3 text-sm">
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Product */}
          {step === 1 && (
            <div className="space-y-4">
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="We sell warehouse management software that helps distributors ship faster..."
                className="w-full border rounded-xl px-4 py-3 text-sm resize-none h-24"
                style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={saveStep2} className="flex-1 btn-accent py-3 text-sm">Continue</button>
                <button onClick={() => setStep(2)} className="btn-secondary px-4 py-3 text-sm">Skip</button>
              </div>
            </div>
          )}

          {/* Step 3: Industry Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INDUSTRY_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => saveIndustryStep(pack)}
                    className="card text-left p-3 hover:shadow-md transition-all border-2"
                    style={{
                      borderColor: selectedIndustry?.id === pack.id ? 'var(--accent)' : 'var(--card-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="text-2xl mb-1">{pack.icon}</div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{pack.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {pack.promptTemplates.length} templates
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {pack.painPoints.slice(0, 2).map((pp, i) => (
                        <li key={i} className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
                          &bull; {pp}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <button
                onClick={() => saveIndustryStep(null)}
                className="w-full text-sm py-2"
                style={{ color: 'var(--text-muted)' }}
              >
                None of these / Custom
              </button>
            </div>
          )}

          {/* Step 4: Competitor */}
          {step === 3 && (
            <div className="space-y-4">
              <input
                type="text"
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
                placeholder="e.g. Salesforce, HubSpot, Competitor Inc..."
                className="w-full border rounded-xl px-4 py-3 text-center text-lg"
                style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                autoFocus
              />
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                We use this to generate stronger battle cards and competitive analysis
              </p>
              <div className="flex gap-3">
                <button onClick={saveStep3} className="flex-1 btn-accent py-3 text-sm">Continue</button>
                <button onClick={() => setStep(4)} className="btn-secondary px-4 py-3 text-sm">Skip</button>
              </div>
            </div>
          )}

          {/* Step 5: Logo */}
          {step === 4 && (
            <div className="space-y-4">
              <label className="flex flex-col items-center gap-3 border-2 border-dashed rounded-xl py-8 cursor-pointer hover:border-solid transition-all" style={{ borderColor: 'var(--accent-border)' }}>
                <HiOutlinePhoto className="text-3xl" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Drop your logo here or click to browse</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, SVG, or JPG · Max 2MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              <button onClick={finishOnboarding} className="w-full btn-accent py-3 text-sm">
                Let&apos;s Generate Your First Document
              </button>
              <button onClick={finishOnboarding} className="w-full text-sm py-2" style={{ color: 'var(--text-muted)' }}>
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
