// Feature Matrix Builder - Types & Utility Functions

// Cell state in the matrix
export type CellStatus = 'yes' | 'no' | 'partial' | 'unknown';

// A single cell in the matrix
export interface FeatureCell {
  status: CellStatus;
  note?: string;
}

// A row in the matrix (one feature)
export interface FeatureRow {
  id: string;
  featureName: string;
  category: string;
  cells: Record<string, FeatureCell>;
}

// A column (your product or a competitor)
export interface MatrixColumn {
  id: string;
  name: string;
  isYours: boolean;
  logoBase64?: string;
  included: boolean;
}

// The full matrix state
export interface MatrixState {
  id: string;
  name: string;
  columns: MatrixColumn[];
  rows: FeatureRow[];
  categories: string[];
  preparedFor?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  shareId?: string;
}

// Extracted feature from AI
export interface ExtractedFeature {
  featureName: string;
  category: string;
  supported: 'yes' | 'no' | 'partial';
  caveat: string;
  confidence: 'high' | 'medium' | 'low';
}

// Result from feature extraction API
export interface ExtractionResult {
  competitorName: string;
  logoUrl?: string;
  features: ExtractedFeature[];
}

// Gap/Win analysis
export interface MatrixAnalysis {
  totalFeatures: number;
  yourWins: number;
  gaps: { featureName: string; category: string; competitors: string[] }[];
  advantages: { category: string; winCount: number }[];
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at',
  'by', 'from', 'is', 'it', 'as', 'be', 'are', 'was', 'were', 'has', 'have',
  'had', 'do', 'does', 'did', 'but', 'not', 'this', 'that', 'these', 'those',
]);

function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

/** Simple fuzzy matching for feature names. Returns true when >70 % of words overlap. */
export function fuzzyMatch(a: string, b: string): boolean {
  const wordsA = normalize(a);
  const wordsB = normalize(b);

  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const setB = new Set(wordsB);
  const matches = wordsA.filter((w) => setB.has(w)).length;
  const ratio = matches / Math.max(wordsA.length, wordsB.length);

  return ratio > 0.7;
}

function now(): string {
  return new Date().toISOString();
}

/** Creates a new matrix with a single "yours" column. */
export function createEmptyMatrix(companyName: string): MatrixState {
  const ts = now();
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Matrix',
    columns: [
      {
        id: crypto.randomUUID(),
        name: companyName,
        isYours: true,
        included: true,
      },
    ],
    rows: [],
    categories: [],
    date: ts,
    createdAt: ts,
    updatedAt: ts,
  };
}

/** Adds a competitor column and returns the updated matrix. */
export function addCompetitorColumn(
  matrix: MatrixState,
  name: string,
  logoBase64?: string,
): MatrixState {
  const newCol: MatrixColumn = {
    id: crypto.randomUUID(),
    name,
    isYours: false,
    logoBase64,
    included: true,
  };

  return {
    ...matrix,
    columns: [...matrix.columns, newCol],
    updatedAt: now(),
  };
}

/** Removes a column by ID. */
export function removeColumn(matrix: MatrixState, columnId: string): MatrixState {
  const rows = matrix.rows.map((row) => {
    const cells = { ...row.cells };
    delete cells[columnId];
    return { ...row, cells };
  });

  return {
    ...matrix,
    columns: matrix.columns.filter((c) => c.id !== columnId),
    rows,
    updatedAt: now(),
  };
}

const STATUS_CYCLE: CellStatus[] = ['yes', 'partial', 'no', 'unknown'];

/** Cycles a cell through yes -> partial -> no -> unknown -> yes. */
export function toggleCell(
  matrix: MatrixState,
  rowId: string,
  columnId: string,
): MatrixState {
  const rows = matrix.rows.map((row) => {
    if (row.id !== rowId) return row;

    const existing = row.cells[columnId];
    const currentStatus = existing?.status ?? 'unknown';
    const nextIndex = (STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];

    return {
      ...row,
      cells: {
        ...row.cells,
        [columnId]: { ...existing, status: nextStatus },
      },
    };
  });

  return { ...matrix, rows, updatedAt: now() };
}

/** Sets a note on a specific cell. */
export function setCellNote(
  matrix: MatrixState,
  rowId: string,
  columnId: string,
  note: string,
): MatrixState {
  const rows = matrix.rows.map((row) => {
    if (row.id !== rowId) return row;

    const existing = row.cells[columnId] ?? { status: 'unknown' as CellStatus };

    return {
      ...row,
      cells: {
        ...row.cells,
        [columnId]: { ...existing, note },
      },
    };
  });

  return { ...matrix, rows, updatedAt: now() };
}

/** Adds a new feature row. If the category is new it is appended to the categories list. */
export function addFeatureRow(
  matrix: MatrixState,
  featureName: string,
  category: string,
): MatrixState {
  const newRow: FeatureRow = {
    id: crypto.randomUUID(),
    featureName,
    category,
    cells: {},
  };

  const categories = matrix.categories.includes(category)
    ? matrix.categories
    : [...matrix.categories, category];

  return {
    ...matrix,
    rows: [...matrix.rows, newRow],
    categories,
    updatedAt: now(),
  };
}

/** Removes a feature row by ID. */
export function removeFeatureRow(matrix: MatrixState, rowId: string): MatrixState {
  const rows = matrix.rows.filter((r) => r.id !== rowId);

  // Clean up categories that no longer have any rows
  const usedCategories = new Set(rows.map((r) => r.category));
  const categories = matrix.categories.filter((c) => usedCategories.has(c));

  return { ...matrix, rows, categories, updatedAt: now() };
}

/**
 * Merges extracted features into a specific column. Uses fuzzy matching to
 * align with existing rows; creates new rows for unmatched features.
 */
export function mergeExtractedFeatures(
  matrix: MatrixState,
  columnId: string,
  features: ExtractedFeature[],
): MatrixState {
  let result = { ...matrix, rows: [...matrix.rows], categories: [...matrix.categories] };

  for (const feat of features) {
    const existingRow = result.rows.find((r) => fuzzyMatch(r.featureName, feat.featureName));

    if (existingRow) {
      // Update existing row's cell for this column
      result = {
        ...result,
        rows: result.rows.map((row) => {
          if (row.id !== existingRow.id) return row;
          return {
            ...row,
            cells: {
              ...row.cells,
              [columnId]: {
                status: feat.supported,
                note: feat.caveat || undefined,
              },
            },
          };
        }),
      };
    } else {
      // Create a new row
      const newRow: FeatureRow = {
        id: crypto.randomUUID(),
        featureName: feat.featureName,
        category: feat.category,
        cells: {
          [columnId]: {
            status: feat.supported,
            note: feat.caveat || undefined,
          },
        },
      };

      if (!result.categories.includes(feat.category)) {
        result = { ...result, categories: [...result.categories, feat.category] };
      }

      result = { ...result, rows: [...result.rows, newRow] };
    }
  }

  return { ...result, updatedAt: now() };
}

/** Computes wins, gaps, and category advantages. */
export function analyzeMatrix(matrix: MatrixState): MatrixAnalysis {
  const yourColumns = matrix.columns.filter((c) => c.isYours);
  const competitorColumns = matrix.columns.filter((c) => !c.isYours);

  const totalFeatures = matrix.rows.length;
  let yourWins = 0;
  const gaps: MatrixAnalysis['gaps'] = [];
  const categoryWins: Record<string, number> = {};

  for (const row of matrix.rows) {
    const youHave = yourColumns.some(
      (col) => row.cells[col.id]?.status === 'yes',
    );
    const competitorsWithout = competitorColumns.every(
      (col) => row.cells[col.id]?.status !== 'yes',
    );

    // Win: you have it, no competitor fully has it
    if (youHave && competitorsWithout && competitorColumns.length > 0) {
      yourWins++;
      categoryWins[row.category] = (categoryWins[row.category] ?? 0) + 1;
    }

    // Gap: at least one competitor has it and you don't
    if (!youHave) {
      const competitorsWhoHave = competitorColumns
        .filter((col) => row.cells[col.id]?.status === 'yes')
        .map((col) => col.name);

      if (competitorsWhoHave.length > 0) {
        gaps.push({
          featureName: row.featureName,
          category: row.category,
          competitors: competitorsWhoHave,
        });
      }
    }
  }

  const advantages = Object.entries(categoryWins)
    .map(([category, winCount]) => ({ category, winCount }))
    .sort((a, b) => b.winCount - a.winCount);

  return { totalFeatures, yourWins, gaps, advantages };
}

/** Reorders the categories list. Rows are unaffected; rendering should sort by this order. */
export function reorderCategories(
  matrix: MatrixState,
  categories: string[],
): MatrixState {
  return { ...matrix, categories, updatedAt: now() };
}
