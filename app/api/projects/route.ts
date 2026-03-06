import { addProject, getProjects } from '../../../lib/db';

function cleanProjectName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

export async function GET() {
  const projects = await getProjects();
  return Response.json(projects);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: unknown };
  const name = cleanProjectName(body.name);

  if (!name) {
    return Response.json({ error: 'Project name is required.' }, { status: 400 });
  }

  try {
    const project = await addProject(crypto.randomUUID(), name);
    return Response.json(project, { status: 201 });
  } catch {
    return Response.json(
      { error: 'Project already exists or could not be created.' },
      { status: 409 }
    );
  }
}
