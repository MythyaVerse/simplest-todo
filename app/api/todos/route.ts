import { addTodo, getPriorities, getTodos } from '../../../lib/db';

function normalizeLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
}

export async function GET() {
  const todos = await getTodos();
  return Response.json(todos);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text?: unknown;
    projectId?: unknown;
    priority?: unknown;
    labels?: unknown;
  };

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const priority = typeof body.priority === 'string' ? body.priority.trim().toLowerCase() : '';
  const labels = normalizeLabels(body.labels);

  if (!text) {
    return Response.json({ error: 'Task text is required.' }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ error: 'Project is required.' }, { status: 400 });
  }

  const priorities = await getPriorities();
  if (!priorities.some((item) => item.name === priority)) {
    return Response.json({ error: 'Priority must be selected from options.' }, { status: 400 });
  }

  const todo = await addTodo({
    id: crypto.randomUUID(),
    text,
    projectId,
    priority,
    labels,
  });

  return Response.json(todo, { status: 201 });
}
