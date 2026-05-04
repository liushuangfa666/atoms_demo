import { NextRequest, NextResponse } from 'next/server';

const MAX_ENTRIES = 100;
const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface StoreEntry {
  html: string;
  userId: string;
  createdAt: number;
}

// In-memory store for preview HTML, scoped by userId
const store = new Map<string, StoreEntry>();

/** Evict expired and excess entries */
function cleanup() {
  const now = Date.now();
  // Remove expired entries
  for (const [key, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(key);
    }
  }
  // Keep only last MAX_ENTRIES
  const keys = Array.from(store.keys());
  if (keys.length > MAX_ENTRIES) {
    for (let i = 0; i < keys.length - MAX_ENTRIES; i++) {
      store.delete(keys[i]);
    }
  }
}

export async function POST(request: NextRequest) {
  const html = await request.text();
  const userId = request.cookies.get('atoms_uid')?.value || 'anonymous';

  cleanup();

  // Use crypto.randomUUID for unguessable IDs
  const id = crypto.randomUUID();
  store.set(id, { html, userId, createdAt: Date.now() });

  return NextResponse.json({ id });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !store.has(id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const entry = store.get(id)!;

  // Check TTL
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(id);
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(entry.html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  });
}
