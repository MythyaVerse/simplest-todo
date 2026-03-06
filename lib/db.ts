import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  project_id: string;
  priority: string;
  labels: string[];
  created_at: string;
}

export interface OptionItem {
  id: string;
  name: string;
  created_at: string;
}

let initPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;

      await sql`CREATE TABLE IF NOT EXISTS priority_options (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;

      await sql`CREATE TABLE IF NOT EXISTS label_options (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;

      await sql`CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT false,
        project_id TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;

      await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS project_id TEXT`;
      await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'`;
      await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`;
      await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

      const defaultProjectId = 'project-general';
      await sql`INSERT INTO projects (id, name)
        VALUES (${defaultProjectId}, 'General')
        ON CONFLICT (id) DO NOTHING`;

      await sql`INSERT INTO priority_options (id, name)
        VALUES ('priority-high', 'high'), ('priority-medium', 'medium'), ('priority-low', 'low')
        ON CONFLICT (name) DO NOTHING`;

      await sql`UPDATE todos SET project_id = ${defaultProjectId} WHERE project_id IS NULL`;
      await sql`ALTER TABLE todos ALTER COLUMN project_id SET NOT NULL`;

      await sql`DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'todos_project_id_fkey'
        ) THEN
          ALTER TABLE todos
          ADD CONSTRAINT todos_project_id_fkey
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT;
        END IF;
      END$$`;
    })();
  }

  return initPromise;
}

export async function getProjects(): Promise<Project[]> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM projects ORDER BY created_at, name`;
  return rows as Project[];
}

export async function addProject(id: string, name: string): Promise<Project> {
  await ensureSchema();
  const rows = await sql`INSERT INTO projects (id, name) VALUES (${id}, ${name}) RETURNING *`;
  return rows[0] as Project;
}

export async function getPriorities(): Promise<OptionItem[]> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM priority_options ORDER BY created_at, name`;
  return rows as OptionItem[];
}

export async function addPriority(id: string, name: string): Promise<OptionItem> {
  await ensureSchema();
  const rows = await sql`INSERT INTO priority_options (id, name) VALUES (${id}, ${name}) RETURNING *`;
  return rows[0] as OptionItem;
}

export async function getLabels(): Promise<OptionItem[]> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM label_options ORDER BY created_at, name`;
  return rows as OptionItem[];
}

export async function addLabel(id: string, name: string): Promise<OptionItem> {
  await ensureSchema();
  const rows = await sql`INSERT INTO label_options (id, name) VALUES (${id}, ${name}) RETURNING *`;
  return rows[0] as OptionItem;
}

export async function getTodos(): Promise<Todo[]> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM todos ORDER BY created_at DESC, id DESC`;
  return rows as Todo[];
}

export async function addTodo(input: {
  id: string;
  text: string;
  projectId: string;
  priority: string;
  labels: string[];
}): Promise<Todo> {
  await ensureSchema();
  const rows = await sql`INSERT INTO todos (id, text, done, project_id, priority, labels)
    VALUES (${input.id}, ${input.text}, false, ${input.projectId}, ${input.priority}, ${input.labels})
    RETURNING *`;
  return rows[0] as Todo;
}

export async function toggleTodo(id: string): Promise<Todo> {
  await ensureSchema();
  const rows = await sql`UPDATE todos SET done = NOT done WHERE id = ${id} RETURNING *`;
  return rows[0] as Todo;
}

export async function deleteTodo(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM todos WHERE id = ${id}`;
}

export { sql };
