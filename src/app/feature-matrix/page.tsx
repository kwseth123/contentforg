'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import {
  HiOutlineTableCells, HiOutlinePlus, HiOutlineXMark, HiOutlineGlobeAlt,
  HiOutlineDocumentArrowUp, HiOutlineMicrophone, HiOutlinePencilSquare,
  HiOutlinePrinter, HiOutlineArrowDownTray,
  HiOutlineBookmarkSquare, HiOutlineCheck, HiOutlineXCircle,
  HiOutlineInformationCircle, HiOutlineMinus, HiOutlineSparkles,
  HiOutlineTrash, HiOutlineEyeSlash, HiOutlineEye, HiOutlineChevronDown,
  HiOutlineChevronRight, HiOutlineBoltSlash,
} from 'react-icons/hi2';
import { HiOutlineShare } from 'react-icons/hi2';
import {
  MatrixState, MatrixColumn, FeatureRow, CellStatus, ExtractedFeature, ExtractionResult,
  createEmptyMatrix, addCompetitorColumn, removeColumn, toggleCell, setCellNote,
  addFeatureRow, removeFeatureRow, mergeExtractedFeatures, analyzeMatrix,
} from '@/lib/featureMatrix';
import VoiceButton from '@/components/VoiceButton';

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const MAX_COMPETITORS = 5;

const STATUS_COLORS: Record<CellStatus, string> = {
  yes: '#16a34a',
  partial: '#d97706',
  no: '#dc2626',
  unknown: '#9ca3af',
};

const STATUS_ICONS: Record<CellStatus, string> = {
  yes: '\u2713',
  partial: '~',
  no: '\u2717',
  unknown: '\u2014',
};

const STATUS_LABELS: Record<CellStatus, string> = {
  yes: 'Yes',
  partial: 'Partial',
  no: 'No',
  unknown: 'Unknown',
};

interface KBProduct {
  id: string;
  name: string;
  description: string;
  keyFeatures: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════

export default function FeatureMatrixPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // ─── Core matrix state ─────────────────────────────────────────────
  const [matrix, setMatrix] = useState<MatrixState | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── KB data ───────────────────────────────────────────────────────
  const [kbProducts, setKbProducts] = useState<KBProduct[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [kbLoaded, setKbLoaded] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  // ─── Add competitor panel ──────────────────────────────────────────
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [addTab, setAddTab] = useState<'url' | 'upload' | 'voice' | 'manual'>('url');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedFeatures, setExtractedFeatures] = useState<ExtractedFeature[] | null>(null);
  const [featureChecked, setFeatureChecked] = useState<Record<number, boolean>>({});

  // ─── Voice ─────────────────────────────────────────────────────────
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // ─── Cell note editing ─────────────────────────────────────────────
  const [editingNote, setEditingNote] = useState<{ rowId: string; colId: string } | null>(null);
  const [noteText, setNoteText] = useState('');

  // ─── Manual entry ──────────────────────────────────────────────────
  const [manualFeatureName, setManualFeatureName] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualStatus, setManualStatus] = useState<CellStatus>('yes');
  const [manualFeatures, setManualFeatures] = useState<ExtractedFeature[]>([]);

  // ─── Category collapse ─────────────────────────────────────────────
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // ─── New category input ────────────────────────────────────────────
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editedCategoryText, setEditedCategoryText] = useState('');

  // ─── Saving / sharing ─────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [savedMatrices, setSavedMatrices] = useState<{ id: string; name: string }[]>([]);
  const [shareUrl, setShareUrl] = useState('');

  // ─── Matrix meta editing ───────────────────────────────────────────
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  // ─── Drag/Drop refs ────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notePopoverRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════
  // Auth guard
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  // ═══════════════════════════════════════════════════════════════════
  // On mount: load KB
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    async function loadKB() {
      try {
        const res = await fetch('/api/knowledge-base');
        if (!res.ok) throw new Error('Failed to load knowledge base');
        const data = await res.json();

        const cName = data.companyName || data.company_name || 'Your Company';
        setCompanyName(cName);

        const products: KBProduct[] = (data.products || []).map((p: Record<string, unknown>, i: number) => ({
          id: (p.id as string) || `product-${i}`,
          name: (p.name as string) || `Product ${i + 1}`,
          description: (p.description as string) || '',
          keyFeatures: (p.keyFeatures as string[]) || (p.key_features as string[]) || [],
        }));
        setKbProducts(products);

        const m = createEmptyMatrix(cName);

        // Auto-populate features from the first product
        if (products.length > 0) {
          const firstProduct = products[0];
          setSelectedProductId(firstProduct.id);
          let updated = m;
          const yourColId = m.columns[0].id;

          for (const feat of firstProduct.keyFeatures) {
            updated = addFeatureRow(updated, feat, 'General');
            const lastRow = updated.rows[updated.rows.length - 1];
            updated = {
              ...updated,
              rows: updated.rows.map((r) =>
                r.id === lastRow.id
                  ? { ...r, cells: { ...r.cells, [yourColId]: { status: 'yes' as CellStatus } } }
                  : r,
              ),
            };
          }
          setMatrix(updated);
        } else {
          setMatrix(m);
        }

        setKbLoaded(true);
        toast.success(`Loaded from your knowledge base \u2014 ${products.length} products found.`);
      } catch {
        const m = createEmptyMatrix('Your Company');
        setMatrix(m);
        setCompanyName('Your Company');
        toast.error('Could not load knowledge base. Starting with empty matrix.');
      } finally {
        setLoading(false);
      }
    }

    if (sessionStatus === 'authenticated') {
      loadKB();
    }
  }, [sessionStatus]);

  // ═══════════════════════════════════════════════════════════════════
  // Derived analysis
  // ═══════════════════════════════════════════════════════════════════

  const analysis = matrix ? analyzeMatrix(matrix) : null;
  const competitorCount = matrix ? matrix.columns.filter((c) => !c.isYours).length : 0;
  const yourColumn = matrix?.columns.find((c) => c.isYours);

  // ═══════════════════════════════════════════════════════════════════
  // Product selection handler
  // ═══════════════════════════════════════════════════════════════════

  const handleSelectProduct = useCallback(
    (productId: string) => {
      if (!matrix) return;
      const product = kbProducts.find((p) => p.id === productId);
      if (!product) return;
      setSelectedProductId(productId);

      const yourColId = matrix.columns.find((c) => c.isYours)?.id;
      if (!yourColId) return;

      const features: ExtractedFeature[] = product.keyFeatures.map((f) => ({
        featureName: f,
        category: 'General',
        supported: 'yes' as const,
        caveat: '',
        confidence: 'high' as const,
      }));

      setMatrix((prev) => (prev ? mergeExtractedFeatures(prev, yourColId, features) : prev));
      toast.success(`Merged features from "${product.name}"`);
    },
    [matrix, kbProducts],
  );

  // ═══════════════════════════════════════════════════════════════════
  // Build from KB (quick start)
  // ═══════════════════════════════════════════════════════════════════

  const handleBuildFromKB = useCallback(() => {
    if (!matrix || kbProducts.length === 0) {
      toast.error('No products in knowledge base');
      return;
    }
    const yourColId = matrix.columns.find((c) => c.isYours)?.id;
    if (!yourColId) return;

    let updated = matrix;
    for (const product of kbProducts) {
      const features: ExtractedFeature[] = product.keyFeatures.map((f) => ({
        featureName: f,
        category: 'General',
        supported: 'yes' as const,
        caveat: '',
        confidence: 'high' as const,
      }));
      updated = mergeExtractedFeatures(updated, yourColId, features);
    }
    setMatrix(updated);
    toast.success(`Loaded all features from ${kbProducts.length} products`);
  }, [matrix, kbProducts]);

  // ═══════════════════════════════════════════════════════════════════
  // URL extraction
  // ═══════════════════════════════════════════════════════════════════

  const handleExtractUrl = useCallback(async () => {
    if (!competitorUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    setExtracting(true);
    setExtractedFeatures(null);
    try {
      const res = await fetch('/api/feature-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'url', content: competitorUrl }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      const data: ExtractionResult = await res.json();
      setExtractedFeatures(data.features);
      if (data.competitorName && !competitorName) setCompetitorName(data.competitorName);
      const checks: Record<number, boolean> = {};
      data.features.forEach((_, i) => { checks[i] = true; });
      setFeatureChecked(checks);
      toast.success(`Extracted ${data.features.length} features`);
    } catch {
      toast.error('Failed to extract features from URL');
    } finally {
      setExtracting(false);
    }
  }, [competitorUrl, competitorName]);

  // ═══════════════════════════════════════════════════════════════════
  // File upload
  // ═══════════════════════════════════════════════════════════════════

  const handleFileUpload = useCallback(async (file: File) => {
    setExtracting(true);
    setExtractedFeatures(null);
    try {
      const text = await file.text();
      const res = await fetch('/api/feature-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'text', content: text }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      const data: ExtractionResult = await res.json();
      setExtractedFeatures(data.features);
      if (data.competitorName && !competitorName) setCompetitorName(data.competitorName);
      const checks: Record<number, boolean> = {};
      data.features.forEach((_, i) => { checks[i] = true; });
      setFeatureChecked(checks);
      toast.success(`Extracted ${data.features.length} features from file`);
    } catch {
      toast.error('Failed to extract features from file');
    } finally {
      setExtracting(false);
    }
  }, [competitorName]);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  // ═══════════════════════════════════════════════════════════════════
  // Voice extraction
  // ═══════════════════════════════════════════════════════════════════

  const handleVoiceExtract = useCallback(async () => {
    if (!voiceTranscript.trim()) {
      toast.error('No transcript to extract from');
      return;
    }
    setExtracting(true);
    setExtractedFeatures(null);
    try {
      const res = await fetch('/api/feature-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'transcript', content: voiceTranscript, competitorName }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      const data: ExtractionResult = await res.json();
      setExtractedFeatures(data.features);
      if (data.competitorName && !competitorName) setCompetitorName(data.competitorName);
      const checks: Record<number, boolean> = {};
      data.features.forEach((_, i) => { checks[i] = true; });
      setFeatureChecked(checks);
      toast.success(`Extracted ${data.features.length} features from voice`);
    } catch {
      toast.error('Failed to extract features from transcript');
    } finally {
      setExtracting(false);
    }
  }, [voiceTranscript, competitorName]);

  // ═══════════════════════════════════════════════════════════════════
  // Manual feature add
  // ═══════════════════════════════════════════════════════════════════

  const handleAddManualFeature = useCallback(() => {
    if (!manualFeatureName.trim()) {
      toast.error('Enter a feature name');
      return;
    }
    const feat: ExtractedFeature = {
      featureName: manualFeatureName.trim(),
      category: manualCategory.trim() || 'General',
      supported: manualStatus === 'unknown' ? 'yes' : (manualStatus as 'yes' | 'no' | 'partial'),
      caveat: '',
      confidence: 'high',
    };
    setManualFeatures((prev) => [...prev, feat]);
    setManualFeatureName('');
  }, [manualFeatureName, manualCategory, manualStatus]);

  const handleAddManualToMatrix = useCallback(() => {
    if (!matrix || manualFeatures.length === 0) return;
    const name = competitorName.trim() || 'Competitor';
    let updated = addCompetitorColumn(matrix, name);
    const newCol = updated.columns[updated.columns.length - 1];
    updated = mergeExtractedFeatures(updated, newCol.id, manualFeatures);
    setMatrix(updated);
    setManualFeatures([]);
    setCompetitorName('');
    setManualFeatureName('');
    setManualCategory('');
    setShowAddCompetitor(false);
    toast.success(`Added "${name}" with ${manualFeatures.length} features`);
  }, [matrix, manualFeatures, competitorName]);

  // ═══════════════════════════════════════════════════════════════════
  // Confirm extracted features
  // ═══════════════════════════════════════════════════════════════════

  const handleConfirmExtracted = useCallback(() => {
    if (!matrix || !extractedFeatures) return;
    const checked = extractedFeatures.filter((_, i) => featureChecked[i]);
    if (checked.length === 0) {
      toast.error('Select at least one feature');
      return;
    }
    const name = competitorName.trim() || 'Competitor';
    let updated = addCompetitorColumn(matrix, name);
    const newCol = updated.columns[updated.columns.length - 1];
    updated = mergeExtractedFeatures(updated, newCol.id, checked);
    setMatrix(updated);
    setExtractedFeatures(null);
    setFeatureChecked({});
    setCompetitorUrl('');
    setCompetitorName('');
    setVoiceTranscript('');
    setShowAddCompetitor(false);
    toast.success(`Added "${name}" with ${checked.length} features`);
  }, [matrix, extractedFeatures, featureChecked, competitorName]);

  // ═══════════════════════════════════════════════════════════════════
  // Cell interactions
  // ═══════════════════════════════════════════════════════════════════

  const handleToggleCell = useCallback((rowId: string, colId: string) => {
    setMatrix((prev) => (prev ? toggleCell(prev, rowId, colId) : prev));
  }, []);

  const handleStartNoteEdit = useCallback((rowId: string, colId: string, currentNote: string) => {
    setEditingNote({ rowId, colId });
    setNoteText(currentNote || '');
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!editingNote || !matrix) return;
    setMatrix(setCellNote(matrix, editingNote.rowId, editingNote.colId, noteText));
    setEditingNote(null);
    setNoteText('');
  }, [editingNote, matrix, noteText]);

  const handleRemoveRow = useCallback((rowId: string) => {
    setMatrix((prev) => (prev ? removeFeatureRow(prev, rowId) : prev));
  }, []);

  const handleRemoveColumn = useCallback((colId: string) => {
    setMatrix((prev) => (prev ? removeColumn(prev, colId) : prev));
  }, []);

  const handleToggleColumnIncluded = useCallback((colId: string) => {
    setMatrix((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((c) => (c.id === colId ? { ...c, included: !c.included } : c)),
      };
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Category management
  // ═══════════════════════════════════════════════════════════════════

  const handleToggleCategory = useCallback((cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim() || !matrix) return;
    if (matrix.categories.includes(newCategoryName.trim())) {
      toast.error('Category already exists');
      return;
    }
    setMatrix({ ...matrix, categories: [...matrix.categories, newCategoryName.trim()] });
    setNewCategoryName('');
  }, [matrix, newCategoryName]);

  const handleRenameCategory = useCallback(
    (oldName: string) => {
      if (!editedCategoryText.trim() || !matrix) return;
      const newName = editedCategoryText.trim();
      if (newName === oldName) {
        setEditingCategoryName(null);
        return;
      }
      setMatrix({
        ...matrix,
        categories: matrix.categories.map((c) => (c === oldName ? newName : c)),
        rows: matrix.rows.map((r) => (r.category === oldName ? { ...r, category: newName } : r)),
      });
      setEditingCategoryName(null);
      setEditedCategoryText('');
    },
    [matrix, editedCategoryText],
  );

  const handleMoveCategoryUp = useCallback(
    (cat: string) => {
      if (!matrix) return;
      const idx = matrix.categories.indexOf(cat);
      if (idx <= 0) return;
      const cats = [...matrix.categories];
      [cats[idx - 1], cats[idx]] = [cats[idx], cats[idx - 1]];
      setMatrix({ ...matrix, categories: cats });
    },
    [matrix],
  );

  const handleMoveCategoryDown = useCallback(
    (cat: string) => {
      if (!matrix) return;
      const idx = matrix.categories.indexOf(cat);
      if (idx < 0 || idx >= matrix.categories.length - 1) return;
      const cats = [...matrix.categories];
      [cats[idx], cats[idx + 1]] = [cats[idx + 1], cats[idx]];
      setMatrix({ ...matrix, categories: cats });
    },
    [matrix],
  );

  // ═══════════════════════════════════════════════════════════════════
  // Add feature row inline
  // ═══════════════════════════════════════════════════════════════════

  const [inlineFeatureName, setInlineFeatureName] = useState('');
  const [inlineFeatureCategory, setInlineFeatureCategory] = useState('');

  const handleAddInlineFeature = useCallback(() => {
    if (!inlineFeatureName.trim() || !matrix) return;
    const cat = inlineFeatureCategory.trim() || 'General';
    setMatrix(addFeatureRow(matrix, inlineFeatureName.trim(), cat));
    setInlineFeatureName('');
  }, [matrix, inlineFeatureName, inlineFeatureCategory]);

  // ═══════════════════════════════════════════════════════════════════
  // Gap response
  // ═══════════════════════════════════════════════════════════════════

  const handleAddGapResponse = useCallback(
    (featureName: string, category: string) => {
      if (!matrix) return;
      const yourColId = matrix.columns.find((c) => c.isYours)?.id;
      if (!yourColId) return;
      const row = matrix.rows.find((r) => r.featureName === featureName);
      if (row) {
        setMatrix({
          ...matrix,
          rows: matrix.rows.map((r) =>
            r.id === row.id
              ? { ...r, cells: { ...r.cells, [yourColId]: { status: 'yes' as CellStatus } } }
              : r,
          ),
        });
        toast.success(`Marked "${featureName}" as supported`);
      }
    },
    [matrix],
  );

  // ═══════════════════════════════════════════════════════════════════
  // Export: Print
  // ═══════════════════════════════════════════════════════════════════

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Export: PDF
  // ═══════════════════════════════════════════════════════════════════

  const handleExportPDF = useCallback(async () => {
    if (!matrix) return;
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      const sections = buildExportSections(matrix);
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, styleId: 'matrix' }),
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${matrix.name || 'feature-matrix'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded', { id: 'pdf-export' });
    } catch {
      toast.error('PDF export failed', { id: 'pdf-export' });
    }
  }, [matrix]);

  // ═══════════════════════════════════════════════════════════════════
  // Export: PPTX
  // ═══════════════════════════════════════════════════════════════════

  const handleExportPPTX = useCallback(async () => {
    if (!matrix) return;
    try {
      toast.loading('Generating PPTX...', { id: 'pptx-export' });
      const sections = buildExportSections(matrix);
      const res = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) throw new Error('PPTX export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${matrix.name || 'feature-matrix'}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PPTX downloaded', { id: 'pptx-export' });
    } catch {
      toast.error('PPTX export failed', { id: 'pptx-export' });
    }
  }, [matrix]);

  // ═══════════════════════════════════════════════════════════════════
  // Save
  // ═══════════════════════════════════════════════════════════════════

  const handleSave = useCallback(async () => {
    if (!matrix) return;
    setSaving(true);
    try {
      const res = await fetch('/api/feature-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matrix),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      if (data.id) {
        setMatrix((prev) => (prev ? { ...prev, id: data.id } : prev));
      }
      toast.success('Matrix saved');
    } catch {
      toast.error('Failed to save matrix');
    } finally {
      setSaving(false);
    }
  }, [matrix]);

  // ═══════════════════════════════════════════════════════════════════
  // Share
  // ═══════════════════════════════════════════════════════════════════

  const handleShare = useCallback(async () => {
    if (!matrix) return;
    setSaving(true);
    try {
      const res = await fetch('/api/feature-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...matrix, action: 'share' }),
      });
      if (!res.ok) throw new Error('Share failed');
      const data = await res.json();
      const link = data.shareUrl || `${window.location.origin}/share/matrix/${data.shareId || matrix.id}`;
      setShareUrl(link);
      await navigator.clipboard.writeText(link);
      toast.success('Share link copied to clipboard!');
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setSaving(false);
    }
  }, [matrix]);

  // ═══════════════════════════════════════════════════════════════════
  // Export section builder
  // ═══════════════════════════════════════════════════════════════════

  function buildExportSections(m: MatrixState) {
    const includedColumns = m.columns.filter((c) => c.included);
    const header = ['Feature', ...includedColumns.map((c) => c.name)];
    const rows = m.rows.map((row) => [
      row.featureName,
      ...includedColumns.map((col) => {
        const cell = row.cells[col.id];
        return cell ? STATUS_LABELS[cell.status] : 'Unknown';
      }),
    ]);

    const a = analyzeMatrix(m);

    return [
      {
        type: 'heading',
        content: m.name || 'Feature Comparison Matrix',
      },
      {
        type: 'text',
        content: `Date: ${new Date(m.date).toLocaleDateString()}${m.preparedFor ? ` | Prepared for: ${m.preparedFor}` : ''}`,
      },
      {
        type: 'table',
        content: JSON.stringify({ header, rows }),
      },
      {
        type: 'text',
        content: `Total Features: ${a.totalFeatures} | Your Wins: ${a.yourWins}${a.advantages.length > 0 ? ` | Top Advantage: ${a.advantages[0].category} (${a.advantages[0].winCount} wins)` : ''}`,
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════
  // Rows grouped by category
  // ═══════════════════════════════════════════════════════════════════

  function getRowsByCategory(m: MatrixState): { category: string; rows: FeatureRow[] }[] {
    const groups: { category: string; rows: FeatureRow[] }[] = [];
    const categoryOrder = m.categories.length > 0 ? m.categories : [...new Set(m.rows.map((r) => r.category))];

    for (const cat of categoryOrder) {
      const catRows = m.rows.filter((r) => r.category === cat);
      if (catRows.length > 0) {
        groups.push({ category: cat, rows: catRows });
      }
    }

    // Include any rows with categories not in the order list
    const covered = new Set(categoryOrder);
    const uncovered = m.rows.filter((r) => !covered.has(r.category));
    if (uncovered.length > 0) {
      const extraCats = [...new Set(uncovered.map((r) => r.category))];
      for (const cat of extraCats) {
        groups.push({ category: cat, rows: uncovered.filter((r) => r.category === cat) });
      }
    }

    return groups;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Win detection for a row
  // ═══════════════════════════════════════════════════════════════════

  function isWinRow(row: FeatureRow, m: MatrixState): boolean {
    const yourCols = m.columns.filter((c) => c.isYours);
    const compCols = m.columns.filter((c) => !c.isYours);
    const youHave = yourCols.some((col) => row.cells[col.id]?.status === 'yes');
    const competitorsLack = compCols.length > 0 && compCols.every((col) => row.cells[col.id]?.status !== 'yes');
    return youHave && competitorsLack;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Feature count for a column
  // ═══════════════════════════════════════════════════════════════════

  function getColumnFeatureCount(colId: string, m: MatrixState): { yes: number; total: number } {
    let yes = 0;
    for (const row of m.rows) {
      const cell = row.cells[colId];
      if (cell?.status === 'yes' || cell?.status === 'partial') yes++;
    }
    return { yes, total: m.rows.length };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--content-bg)' }}>
          <div className="text-center">
            <HiOutlineTableCells className="text-5xl mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading Feature Matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matrix) return null;

  const grouped = getRowsByCategory(matrix);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .matrix-container { margin: 0; padding: 0; }
          .matrix-table { font-size: 10px; }
          .matrix-table th, .matrix-table td { padding: 4px 6px; }
          @page { size: landscape; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="no-print">
          <Sidebar />
        </div>

        {/* ═══ ZONE 1: Left Panel ═══ */}
        <div
          className="no-print flex-shrink-0 overflow-y-auto border-r"
          style={{
            width: 280,
            background: 'var(--sidebar-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="p-4 space-y-5">
            {/* ─── Section 1A: Your Product ─────────────────────── */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Your Product
              </h3>
              {kbLoaded ? (
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineCheck className="text-green-600 flex-shrink-0" />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Loaded from KB &mdash; {kbProducts.length} products
                  </span>
                </div>
              ) : (
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  No knowledge base loaded
                </p>
              )}
              {kbProducts.length > 1 && (
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2 border"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {kbProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {kbProducts.length === 1 && (
                <div
                  className="text-sm font-medium rounded-lg px-3 py-2 border"
                  style={{
                    background: 'var(--accent-light)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {kbProducts[0].name}
                </div>
              )}
            </div>

            {/* ─── Section 1B: Add a Competitor ─────────────────── */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Competitors
              </h3>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                {competitorCount} of {MAX_COMPETITORS} competitors added
              </p>
              {competitorCount < MAX_COMPETITORS && (
                <button
                  onClick={() => {
                    setShowAddCompetitor(true);
                    setExtractedFeatures(null);
                    setCompetitorUrl('');
                    setCompetitorName('');
                    setVoiceTranscript('');
                    setManualFeatures([]);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors btn-accent"
                >
                  <HiOutlinePlus className="text-base" />
                  Add Competitor
                </button>
              )}

              {/* ─── Add Competitor Panel (inline) ─── */}
              {showAddCompetitor && (
                <div
                  className="mt-3 rounded-xl border p-3 space-y-3"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  {/* Close button */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Add Competitor
                    </span>
                    <button
                      onClick={() => setShowAddCompetitor(false)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <HiOutlineXMark className="text-base" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  </div>

                  {/* Competitor name (shared) */}
                  <input
                    type="text"
                    placeholder="Competitor Name"
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)',
                    }}
                  />

                  {/* Tabs */}
                  <div className="flex gap-1 text-xs">
                    {([
                      { key: 'url' as const, icon: HiOutlineGlobeAlt, label: 'URL' },
                      { key: 'upload' as const, icon: HiOutlineDocumentArrowUp, label: 'Upload' },
                      { key: 'voice' as const, icon: HiOutlineMicrophone, label: 'Voice' },
                      { key: 'manual' as const, icon: HiOutlinePencilSquare, label: 'Manual' },
                    ]).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setAddTab(t.key)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors font-medium"
                        style={{
                          background: addTab === t.key ? 'var(--accent)' : 'transparent',
                          color: addTab === t.key ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        }}
                      >
                        <t.icon className="text-sm" />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  {!extractedFeatures && (
                    <>
                      {/* URL Tab */}
                      {addTab === 'url' && (
                        <div className="space-y-2">
                          <input
                            type="url"
                            placeholder="https://competitor.com/features"
                            value={competitorUrl}
                            onChange={(e) => setCompetitorUrl(e.target.value)}
                            className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2"
                            style={{
                              background: 'var(--card-bg)',
                              borderColor: 'var(--card-border)',
                              color: 'var(--text-primary)',
                            }}
                          />
                          <button
                            onClick={handleExtractUrl}
                            disabled={extracting}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium btn-accent"
                          >
                            {extracting ? (
                              <>
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                Scanning...
                              </>
                            ) : (
                              <>
                                <HiOutlineGlobeAlt />
                                Scan Website
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Upload Tab */}
                      {addTab === 'upload' && (
                        <div className="space-y-2">
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                            style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                          >
                            <HiOutlineDocumentArrowUp className="text-2xl mx-auto mb-2" />
                            <p className="text-xs">
                              Drop .pdf, .docx, or .txt here
                              <br />
                              or click to browse
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          {extracting && (
                            <div className="flex items-center justify-center gap-2 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                              Extracting features...
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voice Tab */}
                      {addTab === 'voice' && (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <VoiceButton
                              size="lg"
                              onTranscript={(text) => setVoiceTranscript((prev) => (prev ? prev + ' ' + text : text))}
                            />
                          </div>
                          {voiceTranscript && (
                            <div
                              className="max-h-32 overflow-y-auto text-xs p-2 rounded-lg border"
                              style={{
                                background: 'var(--content-bg)',
                                borderColor: 'var(--card-border)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {voiceTranscript}
                            </div>
                          )}
                          <button
                            onClick={handleVoiceExtract}
                            disabled={extracting || !voiceTranscript}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium btn-accent"
                          >
                            {extracting ? (
                              <>
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                Extracting...
                              </>
                            ) : (
                              <>
                                <HiOutlineSparkles />
                                Extract Features
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Manual Tab */}
                      {addTab === 'manual' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Feature name"
                            value={manualFeatureName}
                            onChange={(e) => setManualFeatureName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddManualFeature()}
                            className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2"
                            style={{
                              background: 'var(--card-bg)',
                              borderColor: 'var(--card-border)',
                              color: 'var(--text-primary)',
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Category (optional)"
                            value={manualCategory}
                            onChange={(e) => setManualCategory(e.target.value)}
                            className="w-full text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2"
                            style={{
                              background: 'var(--card-bg)',
                              borderColor: 'var(--card-border)',
                              color: 'var(--text-primary)',
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={manualStatus}
                              onChange={(e) => setManualStatus(e.target.value as CellStatus)}
                              className="text-sm rounded-lg px-2 py-1.5 border flex-1"
                              style={{
                                background: 'var(--card-bg)',
                                borderColor: 'var(--card-border)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              <option value="yes">Yes</option>
                              <option value="partial">Partial</option>
                              <option value="no">No</option>
                            </select>
                            <button
                              onClick={handleAddManualFeature}
                              className="p-2 rounded-lg btn-accent"
                            >
                              <HiOutlinePlus />
                            </button>
                          </div>

                          {/* Manual features list */}
                          {manualFeatures.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {manualFeatures.map((f, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs p-1.5 rounded"
                                  style={{ background: 'var(--content-bg)' }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ background: STATUS_COLORS[f.supported] }}
                                  />
                                  <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                                    {f.featureName}
                                  </span>
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                  >
                                    {f.category}
                                  </span>
                                  <button
                                    onClick={() => setManualFeatures((prev) => prev.filter((_, idx) => idx !== i))}
                                    className="p-0.5 rounded hover:bg-red-50"
                                  >
                                    <HiOutlineXMark className="text-xs text-red-400" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {manualFeatures.length > 0 && (
                            <button
                              onClick={handleAddManualToMatrix}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium btn-accent"
                            >
                              <HiOutlinePlus />
                              Add to Matrix ({manualFeatures.length})
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Review Checklist */}
                  {extractedFeatures && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        Review extracted features ({extractedFeatures.length})
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {extractedFeatures.map((f, i) => (
                          <label
                            key={i}
                            className="flex items-start gap-2 text-xs p-1.5 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={featureChecked[i] ?? true}
                              onChange={(e) =>
                                setFeatureChecked((prev) => ({ ...prev, [i]: e.target.checked }))
                              }
                              className="mt-0.5 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <span style={{ color: 'var(--text-primary)' }}>{f.featureName}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                  {f.category}
                                </span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                                  style={{ background: STATUS_COLORS[f.supported] }}
                                >
                                  {STATUS_LABELS[f.supported]}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={handleConfirmExtracted}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium btn-accent"
                      >
                        <HiOutlineCheck />
                        Confirm & Add ({Object.values(featureChecked).filter(Boolean).length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Section 1C: Feature Categories ───────────────── */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Categories
              </h3>
              <div className="space-y-1">
                {matrix.categories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1 group"
                  >
                    {/* Up/down arrows */}
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveCategoryUp(cat)}
                        className="text-[10px] leading-none px-0.5 hover:text-blue-600"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={() => handleMoveCategoryDown(cat)}
                        className="text-[10px] leading-none px-0.5 hover:text-blue-600"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        &#9660;
                      </button>
                    </div>

                    {editingCategoryName === cat ? (
                      <input
                        type="text"
                        value={editedCategoryText}
                        onChange={(e) => setEditedCategoryText(e.target.value)}
                        onBlur={() => handleRenameCategory(cat)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCategory(cat);
                          if (e.key === 'Escape') setEditingCategoryName(null);
                        }}
                        autoFocus
                        className="flex-1 text-xs px-2 py-1 rounded border outline-none"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: 'var(--accent)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCategoryName(cat);
                          setEditedCategoryText(cat);
                        }}
                        className="flex-1 text-left text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors truncate"
                        style={{ color: 'var(--text-primary)' }}
                        title="Click to rename"
                      >
                        {cat}
                      </button>
                    )}

                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--content-bg)', color: 'var(--text-muted)' }}>
                      {matrix.rows.filter((r) => r.category === cat).length}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add category */}
              <div className="flex items-center gap-1 mt-2">
                <input
                  type="text"
                  placeholder="+ Add Category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none focus:ring-1"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                {newCategoryName && (
                  <button onClick={handleAddCategory} className="p-1 rounded btn-accent text-xs">
                    <HiOutlinePlus />
                  </button>
                )}
              </div>
            </div>

            {/* ─── Section 1D: Gaps Panel ───────────────────────── */}
            {analysis && analysis.gaps.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Feature Gaps
                </h3>
                <div
                  className="rounded-lg border p-3 space-y-2"
                  style={{ background: '#fef2f2', borderColor: '#fecaca' }}
                >
                  <p className="text-xs font-medium text-red-700">
                    Competitors have {analysis.gaps.length} features you haven&apos;t addressed
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {analysis.gaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <HiOutlineXCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-red-800 truncate">{gap.featureName}</p>
                          <p className="text-red-600 text-[10px]">
                            {gap.competitors.join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddGapResponse(gap.featureName, gap.category)}
                          className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex-shrink-0 font-medium"
                        >
                          Add Response
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ ZONE 2 + 3: Center (Matrix + Export Controls) ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--content-bg)' }}>
          {/* ─── ZONE 3: Export Controls Bar ─────────────────── */}
          <div
            className="no-print flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex-1" />
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium btn-secondary"
              title="Print"
            >
              <HiOutlinePrinter className="text-base" />
              Print
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium btn-secondary"
              title="Export PDF"
            >
              <HiOutlineArrowDownTray className="text-base" />
              PDF
            </button>
            <button
              onClick={handleExportPPTX}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium btn-secondary"
              title="Export PPTX"
            >
              <HiOutlineArrowDownTray className="text-base" />
              PPTX
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium btn-accent"
            >
              <HiOutlineBookmarkSquare className="text-base" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleShare}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium btn-secondary"
            >
              <HiOutlineShare className="text-base" />
              Share
            </button>
          </div>

          {/* ─── Center scrollable area ─────────────────────── */}
          <div className="flex-1 overflow-auto p-6 matrix-container">
            {/* Quick Start Buttons */}
            {matrix.rows.length === 0 && (
              <div className="no-print flex items-center gap-3 mb-6">
                <button
                  onClick={() => {
                    setShowAddCompetitor(true);
                    setAddTab('voice');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium btn-secondary"
                >
                  <HiOutlineMicrophone className="text-base" />
                  Build from Voice
                </button>
                <button
                  onClick={handleBuildFromKB}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium btn-accent"
                >
                  <HiOutlineSparkles className="text-base" />
                  Build from Knowledge Base
                </button>
              </div>
            )}

            {/* Quick start shown even when rows exist but small */}
            {matrix.rows.length > 0 && matrix.rows.length < 3 && competitorCount === 0 && (
              <div className="no-print flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setShowAddCompetitor(true);
                    setAddTab('url');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium btn-secondary"
                >
                  <HiOutlinePlus className="text-sm" />
                  Add your first competitor to start comparing
                </button>
              </div>
            )}

            {/* ─── Matrix Header Row ────────────────────────── */}
            <div
              className="rounded-xl border p-5 mb-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <HiOutlineTableCells className="text-3xl" style={{ color: 'var(--accent)' }} />
                  <div>
                    {editingTitle ? (
                      <input
                        type="text"
                        value={matrix.name}
                        onChange={(e) => setMatrix({ ...matrix, name: e.target.value })}
                        onBlur={() => setEditingTitle(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                        autoFocus
                        className="text-xl font-bold border-b-2 outline-none bg-transparent"
                        style={{ borderColor: 'var(--accent)', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <h1
                        className="text-xl font-bold cursor-pointer hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--text-primary)' }}
                        onClick={() => setEditingTitle(true)}
                        title="Click to edit title"
                      >
                        {matrix.name || 'Untitled Matrix'}
                      </h1>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {editingDate ? (
                        <input
                          type="date"
                          value={matrix.date.split('T')[0]}
                          onChange={(e) => setMatrix({ ...matrix, date: e.target.value })}
                          onBlur={() => setEditingDate(false)}
                          autoFocus
                          className="border rounded px-2 py-0.5 text-sm outline-none"
                          style={{
                            background: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => setEditingDate(true)}
                          title="Click to edit date"
                        >
                          {new Date(matrix.date).toLocaleDateString()}
                        </span>
                      )}
                      <span>&middot;</span>
                      <div className="flex items-center gap-1">
                        <span>Prepared for:</span>
                        <input
                          type="text"
                          placeholder="Enter name..."
                          value={matrix.preparedFor || ''}
                          onChange={(e) => setMatrix({ ...matrix, preparedFor: e.target.value })}
                          className="border-b bg-transparent outline-none text-sm px-1 min-w-[120px]"
                          style={{
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary badges */}
                {analysis && (
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className="px-3 py-1 rounded-full font-semibold"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      {analysis.totalFeatures} features
                    </span>
                    {analysis.yourWins > 0 && (
                      <span className="px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                        {analysis.yourWins} wins
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Live Matrix Table ────────────────────────── */}
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <table className="w-full border-collapse matrix-table" style={{ minWidth: 600 }}>
                {/* Column Headers */}
                <thead>
                  <tr>
                    <th
                      className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 border-b sticky left-0 z-20"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-secondary)',
                        minWidth: 200,
                      }}
                    >
                      Feature
                    </th>
                    {matrix.columns.map((col) => {
                      const counts = getColumnFeatureCount(col.id, matrix);
                      return (
                        <th
                          key={col.id}
                          className="text-center text-sm px-4 py-3 border-b border-l relative group"
                          style={{
                            background: col.isYours ? 'var(--accent-light)' : 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-primary)',
                            minWidth: 140,
                          }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-sm">{col.name}</span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: col.isYours ? 'var(--accent)' : 'var(--content-bg)',
                                color: col.isYours ? 'var(--text-inverse)' : 'var(--text-muted)',
                              }}
                            >
                              {counts.yes} of {counts.total}
                            </span>
                          </div>
                          {/* Column controls (competitors only) */}
                          {!col.isYours && (
                            <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                              <button
                                onClick={() => handleToggleColumnIncluded(col.id)}
                                className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                                title={col.included ? 'Exclude from export' : 'Include in export'}
                              >
                                {col.included ? (
                                  <HiOutlineEye className="text-xs" style={{ color: 'var(--text-muted)' }} />
                                ) : (
                                  <HiOutlineEyeSlash className="text-xs text-orange-500" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRemoveColumn(col.id)}
                                className="p-0.5 rounded hover:bg-red-100 transition-colors"
                                title="Remove competitor"
                              >
                                <HiOutlineXMark className="text-xs text-red-400" />
                              </button>
                            </div>
                          )}
                          {!col.included && (
                            <div className="absolute inset-0 bg-gray-100/50 pointer-events-none flex items-center justify-center">
                              <HiOutlineEyeSlash className="text-lg text-gray-400" />
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {grouped.map(({ category, rows: catRows }) => {
                    const isCollapsed = collapsedCategories.has(category);
                    return (
                      <React.Fragment key={category}>
                        {/* Category Header Row */}
                        <tr>
                          <td
                            colSpan={matrix.columns.length + 1}
                            className="px-4 py-2 border-b cursor-pointer select-none"
                            style={{
                              background: 'var(--content-bg)',
                              borderColor: 'var(--card-border)',
                            }}
                            onClick={() => handleToggleCategory(category)}
                          >
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <HiOutlineChevronRight className="text-sm" style={{ color: 'var(--text-muted)' }} />
                              ) : (
                                <HiOutlineChevronDown className="text-sm" style={{ color: 'var(--text-muted)' }} />
                              )}
                              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                {category}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}
                              >
                                {catRows.length}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Feature Rows */}
                        {!isCollapsed &&
                          catRows.map((row, rowIdx) => {
                            const win = isWinRow(row, matrix);
                            return (
                              <tr
                                key={row.id}
                                className="group"
                                style={{
                                  background: win
                                    ? '#f0fdf4'
                                    : rowIdx % 2 === 0
                                    ? 'var(--card-bg)'
                                    : 'var(--content-bg)',
                                }}
                              >
                                {/* Feature name cell */}
                                <td
                                  className="px-4 py-2.5 text-sm border-b sticky left-0 z-10"
                                  style={{
                                    borderColor: 'var(--card-border)',
                                    color: 'var(--text-primary)',
                                    background: win
                                      ? '#f0fdf4'
                                      : rowIdx % 2 === 0
                                      ? 'var(--card-bg)'
                                      : 'var(--content-bg)',
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="flex-1">{row.featureName}</span>
                                    <button
                                      onClick={() => handleRemoveRow(row.id)}
                                      className="p-0.5 rounded hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 no-print"
                                      title="Remove feature"
                                    >
                                      <HiOutlineTrash className="text-xs text-red-400" />
                                    </button>
                                  </div>
                                </td>

                                {/* Status cells */}
                                {matrix.columns.map((col) => {
                                  const cell = row.cells[col.id];
                                  const status: CellStatus = cell?.status || 'unknown';
                                  const hasNote = !!(cell?.note);
                                  const isEditing =
                                    editingNote?.rowId === row.id && editingNote?.colId === col.id;

                                  return (
                                    <td
                                      key={col.id}
                                      className="px-4 py-2.5 text-center border-b border-l relative"
                                      style={{
                                        borderColor: 'var(--card-border)',
                                      }}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        {/* Status icon (clickable) */}
                                        <button
                                          onClick={() => handleToggleCell(row.id, col.id)}
                                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110"
                                          style={{ background: STATUS_COLORS[status] }}
                                          title={`${STATUS_LABELS[status]} - click to cycle`}
                                        >
                                          {STATUS_ICONS[status]}
                                        </button>

                                        {/* Note indicator */}
                                        {(hasNote || isEditing) && (
                                          <button
                                            onClick={() =>
                                              handleStartNoteEdit(row.id, col.id, cell?.note || '')
                                            }
                                            className="p-0.5 rounded hover:bg-gray-200 transition-colors no-print"
                                            title={cell?.note || 'Add note'}
                                          >
                                            <HiOutlineInformationCircle
                                              className="text-sm"
                                              style={{ color: hasNote ? 'var(--accent)' : 'var(--text-muted)' }}
                                            />
                                          </button>
                                        )}

                                        {/* Hover note trigger */}
                                        {!hasNote && !isEditing && (
                                          <button
                                            onClick={() =>
                                              handleStartNoteEdit(row.id, col.id, '')
                                            }
                                            className="p-0.5 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 no-print"
                                            title="Add note"
                                          >
                                            <HiOutlineInformationCircle
                                              className="text-sm"
                                              style={{ color: 'var(--text-muted)' }}
                                            />
                                          </button>
                                        )}
                                      </div>

                                      {/* Note editing popover */}
                                      {isEditing && (
                                        <div
                                          ref={notePopoverRef}
                                          className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-1 w-56 rounded-lg border shadow-lg p-3 no-print"
                                          style={{
                                            background: 'var(--card-bg)',
                                            borderColor: 'var(--card-border)',
                                          }}
                                        >
                                          <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add a note..."
                                            rows={3}
                                            autoFocus
                                            className="w-full text-xs rounded-lg px-2 py-1.5 border outline-none resize-none"
                                            style={{
                                              background: 'var(--content-bg)',
                                              borderColor: 'var(--card-border)',
                                              color: 'var(--text-primary)',
                                            }}
                                          />
                                          <div className="flex justify-end gap-1 mt-2">
                                            <button
                                              onClick={() => setEditingNote(null)}
                                              className="px-2 py-1 text-xs rounded btn-secondary"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              onClick={handleSaveNote}
                                              className="px-2 py-1 text-xs rounded btn-accent"
                                            >
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}

                  {/* Add Feature Row */}
                  <tr className="no-print">
                    <td
                      className="px-4 py-2 border-b sticky left-0 z-10"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add feature..."
                          value={inlineFeatureName}
                          onChange={(e) => setInlineFeatureName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddInlineFeature()}
                          className="flex-1 text-sm bg-transparent outline-none px-1 py-0.5"
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <select
                          value={inlineFeatureCategory}
                          onChange={(e) => setInlineFeatureCategory(e.target.value)}
                          className="text-xs rounded border px-1 py-0.5"
                          style={{
                            background: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <option value="">General</option>
                          {matrix.categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddInlineFeature}
                          disabled={!inlineFeatureName.trim()}
                          className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-30"
                        >
                          <HiOutlinePlus className="text-sm" style={{ color: 'var(--accent)' }} />
                        </button>
                      </div>
                    </td>
                    {matrix.columns.map((col) => (
                      <td
                        key={col.id}
                        className="border-b border-l"
                        style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
                      />
                    ))}
                  </tr>

                  {/* Empty state */}
                  {matrix.rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={matrix.columns.length + 1}
                        className="text-center py-12"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <HiOutlineTableCells className="text-4xl mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No features yet. Add features using the left panel or type above.</p>
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Summary Row */}
                {matrix.rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={matrix.columns.length + 1}
                        className="px-4 py-3 border-t"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: 'var(--card-border)',
                        }}
                      >
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Total: {analysis?.totalFeatures || 0} features
                          </span>
                          {analysis && analysis.yourWins > 0 && (
                            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                              Your wins: {analysis.yourWins}
                            </span>
                          )}
                          {analysis && analysis.advantages.length > 0 && (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-medium">Top advantages:</span>
                              {analysis.advantages.slice(0, 3).map((adv, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium"
                                >
                                  {adv.category} ({adv.winCount})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Share URL display */}
            {shareUrl && (
              <div
                className="mt-4 rounded-lg border p-3 flex items-center gap-3 no-print"
                style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}
              >
                <HiOutlineShare style={{ color: 'var(--accent)' }} />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Copied!');
                  }}
                  className="text-xs font-medium px-2 py-1 rounded btn-accent"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

