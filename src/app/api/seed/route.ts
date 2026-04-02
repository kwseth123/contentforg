import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const sb = getSupabaseAdmin();

    // 1. Ensure default company exists
    const { error: companyError } = await sb
      .from('companies')
      .upsert(
        { id: 'default', name: 'My Company' },
        { onConflict: 'id', ignoreDuplicates: true },
      );

    if (companyError) {
      return NextResponse.json(
        { error: 'Failed to create company', details: companyError.message },
        { status: 500 },
      );
    }

    // 2. Check if users already exist
    const { data: existing, error: checkError } = await sb
      .from('users')
      .select('email')
      .in('email', ['admin', 'rep']);

    if (checkError) {
      return NextResponse.json(
        { error: 'Failed to check existing users', details: checkError.message },
        { status: 500 },
      );
    }

    const existingEmails = new Set((existing || []).map((u: any) => u.email));
    const toInsert: any[] = [];

    if (!existingEmails.has('admin')) {
      toInsert.push({
        id: 'seed-admin',
        company_id: 'default',
        email: 'admin',
        password_hash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        name: 'Admin User',
      });
    }

    if (!existingEmails.has('rep')) {
      toInsert.push({
        id: 'seed-rep',
        company_id: 'default',
        email: 'rep',
        password_hash: bcrypt.hashSync('rep123', 10),
        role: 'rep',
        name: 'Sales Rep',
      });
    }

    if (toInsert.length === 0) {
      return NextResponse.json({
        message: 'Users already exist',
        users: Array.from(existingEmails),
      });
    }

    // 3. Insert missing users
    const { error: insertError } = await sb.from('users').insert(toInsert);

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to insert users', details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Seed complete',
      created: toInsert.map((u) => u.email),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
