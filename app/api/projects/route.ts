import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject, createProjectWithCode, isKVAvailable, getUserId } from '@/lib/kv-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isKVAvailable()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 });
  }
  const userId = getUserId(request);
  const projects = await getProjects(userId);
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  if (!isKVAvailable()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 });
  }

  const userId = getUserId(request);
  const body = await request.json();
  const { name, mode, initialCode, projectType, files, messages } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Support full project creation (from showcase copy, etc.)
  if (files && files.length > 0) {
    const project = await createProjectWithCode(name, mode || 'engineer', '', userId);
    // Overwrite with full data
    const updates: any = { files, projectType: projectType || 'react-vite' };
    if (messages) updates.messages = messages;
    const htmlFile = files.find((f: any) => f.path === 'index.html');
    if (htmlFile) updates.currentCode = htmlFile.content;
    // Re-save with full data
    const { updateProject: updateProj } = await import('@/lib/kv-storage');
    const updated = await updateProj(project.id, updates, userId);
    return NextResponse.json(updated || project, { status: 201 });
  }

  const project = initialCode
    ? await createProjectWithCode(name, mode || 'engineer', initialCode, userId)
    : await createProject(name, mode || 'engineer', userId);

  return NextResponse.json(project, { status: 201 });
}
