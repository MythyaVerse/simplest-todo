import { addPriority, getPriorities } from '../../../../lib/db';

function cleanName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function GET() {
  const items = await getPriorities();
  return Response.json(items);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: unknown };
  const name = cleanName(body.name);

  if (!name) {
    return Response.json({ error: 'Priority name is required.' }, { status: 400 });
  }

  try {
    const item = await addPriority(crypto.randomUUID(), name);
    return Response.json(item, { status: 201 });
  } catch {
    return Response.json({ error: 'Priority already exists.' }, { status: 409 });
  }
}
