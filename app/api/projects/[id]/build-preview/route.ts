import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, isKVAvailable, getUserId } from '@/lib/kv-storage';
import { buildPreviewHtml } from '@/lib/build-preview';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isKVAvailable()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 });
  }

  const userId = getUserId(request);
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!project.files || project.files.length === 0) {
    return NextResponse.json({ error: 'No files' }, { status: 400 });
  }

  // Already cached
  if (project.previewHtml) {
    return NextResponse.json({ cached: true, size: project.previewHtml.length });
  }

  const html = await buildPreviewHtml(project.files);
  if (!html) {
    return NextResponse.json({ error: 'Build failed' }, { status: 500 });
  }

  await updateProject(id, { previewHtml: html }, userId);
  return NextResponse.json({ cached: false, size: html.length });
}
