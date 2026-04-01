import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeatureCell {
  status: 'yes' | 'no' | 'partial' | 'unknown';
  note?: string;
}

interface FeatureRow {
  id: string;
  featureName: string;
  category: string;
  cells: Record<string, FeatureCell>; // keyed by column ID (company/competitor)
}

interface MatrixColumn {
  id: string;
  name: string;
  isYours: boolean;
  logoBase64?: string;
  included: boolean; // toggle for export inclusion
  featureCount?: number;
}

interface SavedMatrix {
  id: string;
  name: string;
  columns: MatrixColumn[];
  rows: FeatureRow[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
  preparedFor?: string;
  shareId?: string;
}

// ---------------------------------------------------------------------------
// GET - List all matrices or load a specific one
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const shareId = searchParams.get('shareId');

  // Public access: shared matrix lookup (no auth required)
  if (shareId) {
    const matrixRow = await db.getFeatureMatrixByShareId(shareId);
    if (!matrixRow) {
      return NextResponse.json({ error: 'Shared matrix not found' }, { status: 404 });
    }
    const matrix = matrixRow.data || matrixRow;
    return NextResponse.json({ matrix });
  }

  // All other lookups require auth
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return a specific matrix by id
  if (id) {
    const matrixRow = await db.getFeatureMatrix(id);
    if (!matrixRow) {
      return NextResponse.json({ error: 'Matrix not found' }, { status: 404 });
    }
    const matrix = matrixRow.data || matrixRow;
    return NextResponse.json({ matrix });
  }

  // Return summary list of all matrices
  const rows = await db.getFeatureMatrices();
  const list = rows.map((row) => {
    const m = row.data || row;
    return {
      id: m.id || row.id,
      name: m.name,
      createdAt: m.createdAt || row.created_at,
      updatedAt: m.updatedAt || row.updated_at,
      columnsCount: m.columns?.length || 0,
    };
  });

  return NextResponse.json({ matrices: list });
}

// ---------------------------------------------------------------------------
// POST - Save / update a matrix, or create a share link
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Handle share action
  if (body.action === 'share') {
    const { matrixId } = body as { matrixId: string };
    if (!matrixId) {
      return NextResponse.json({ error: 'matrixId is required' }, { status: 400 });
    }

    const matrixRow = await db.getFeatureMatrix(matrixId);
    if (!matrixRow) {
      return NextResponse.json({ error: 'Matrix not found' }, { status: 404 });
    }

    const matrix = matrixRow.data || matrixRow;
    const shareId = crypto.randomBytes(16).toString('hex');
    matrix.shareId = shareId;
    matrix.updatedAt = new Date().toISOString();

    await db.saveFeatureMatrix('default', {
      id: matrixId,
      data: matrix,
      updated_at: matrix.updatedAt,
    });

    return NextResponse.json({
      shareId,
      url: `/feature-matrix/share/${shareId}`,
    });
  }

  // Handle save / update
  const { matrix } = body as { matrix: SavedMatrix };
  if (!matrix) {
    return NextResponse.json({ error: 'matrix payload is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const matrixId = matrix.id || crypto.randomUUID();
  const existingRow = await db.getFeatureMatrix(matrixId);

  const savedMatrix = {
    ...matrix,
    id: matrixId,
    createdAt: existingRow ? (existingRow.data?.createdAt || existingRow.created_at || now) : now,
    updatedAt: now,
  };

  await db.saveFeatureMatrix('default', {
    id: matrixId,
    data: savedMatrix,
    created_at: savedMatrix.createdAt,
    updated_at: savedMatrix.updatedAt,
  });

  return NextResponse.json({ matrix: savedMatrix });
}

// ---------------------------------------------------------------------------
// DELETE - Remove a matrix
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const existing = await db.getFeatureMatrix(id);
  if (!existing) {
    return NextResponse.json({ error: 'Matrix not found' }, { status: 404 });
  }

  await db.deleteFeatureMatrix('default', id);
  return NextResponse.json({ success: true });
}
