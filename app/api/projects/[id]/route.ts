import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, deleteProject, isKVAvailable, getUserId } from '@/lib/kv-storage';
import { getProjectRunner } from '@/lib/project-runner';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isKVAvailable()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 });
  }
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isKVAvailable()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 });
  }
  const userId = getUserId(request);
  const { id } = await params;
  const updates = await request.json();
  const updated = await updateProject(id, updates, userId);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isKVAvailable()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 });
  }
  const userId = getUserId(request);
  const { id } = await params;
  await deleteProject(id, userId);
  // Stop runner and clean up project directory
  try { await getProjectRunner().remove(id); } catch { /* ignore if not running */ }
  return NextResponse.json({ success: true });
}
