import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, isKVAvailable, getUserId } from '@/lib/kv-storage';
import { buildPreviewHtml } from '@/lib/build-preview';
import { getProject as getLocalProject } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Try KV first, then fall back to client-side storage via header
  let project = null;
  if (isKVAvailable()) {
    const userId = getUserId(request);
    project = await getProject(id);
  }

  // If KV failed, try getting project from request body (client sends files)
  if (!project) {
    try {
      const body = await request.json();
      if (body.files && body.files.length > 0) {
        project = { files: body.files, projectType: body.projectType };
      }
    } catch {
      // No body or invalid JSON
    }
  }

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!project.files || project.files.length === 0) {
    return NextResponse.json({ error: 'No files' }, { status: 400 });
  }

  // Already cached
  if (project.previewHtml) {
    return NextResponse.json({ cached: true, size: project.previewHtml.length, html: project.previewHtml });
  }

  const result = await buildPreviewHtml(project.files);
  if (!result.ok) {
    return NextResponse.json({
      error: 'Build failed',
      buildError: result.error,
      errors: result.errors,
      warnings: result.warnings,
    }, { status: 500 });
  }

  // Cache in KV if available
  if (isKVAvailable()) {
    try {
      const userId = getUserId(request);
      await updateProject(id, { previewHtml: result.html }, userId);
    } catch { /* cache failure is ok */ }
  }

  return NextResponse.json({ cached: false, size: result.html.length, html: result.html });
}
