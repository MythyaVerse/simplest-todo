import { addLabel, getLabels } from '../../../../lib/db';

function cleanName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function GET() {
  const items = await getLabels();
  return Response.json(items);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: unknown };
  const name = cleanName(body.name);

  if (!name) {
    return Response.json({ error: 'Label name is required.' }, { status: 400 });
  }

  try {
    const item = await addLabel(crypto.randomUUID(), name);
    return Response.json(item, { status: 201 });
  } catch {
    return Response.json({ error: 'Label already exists.' }, { status: 409 });
  }
}
