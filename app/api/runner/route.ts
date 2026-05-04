import { NextRequest, NextResponse } from 'next/server';
import { getProjectRunner } from '@/lib/project-runner';

export const runtime = 'nodejs';

/** GET /api/runner/status?projectId=xxx */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const runner = getProjectRunner();
  const status = runner.getStatus(projectId);
  if (!status) {
    return NextResponse.json({ status: 'idle', port: null, logs: [] });
  }
  return NextResponse.json(status);
}

/** POST /api/runner/start | /api/runner/restart | /api/runner/stop */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId, files } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const runner = getProjectRunner();

    switch (action) {
      case 'start': {
        if (!files || !Array.isArray(files)) {
          return NextResponse.json({ error: 'files required for start' }, { status: 400 });
        }
        await runner.writeProjectFiles(projectId, files);
        const result = await runner.installAndStart(projectId);
        return NextResponse.json(result);
      }

      case 'restart': {
        const result = await runner.restart(projectId, files);
        return NextResponse.json(result);
      }

      case 'stop': {
        await runner.stop(projectId);
        return NextResponse.json({ status: 'stopped' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use start|restart|stop' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/** DELETE /api/runner?projectId=xxx */
export async function DELETE(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const runner = getProjectRunner();
  await runner.remove(projectId);
  return NextResponse.json({ status: 'removed' });
}
