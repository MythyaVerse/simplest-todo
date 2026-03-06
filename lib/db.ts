import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export async function getTodos(): Promise<Todo[]> {
  const rows = await sql`SELECT * FROM todos ORDER BY id`;
  return rows as Todo[];
}

export async function addTodo(id: string, text: string): Promise<Todo> {
  const rows = await sql`INSERT INTO todos (id, text, done) VALUES (${id}, ${text}, false) RETURNING *`;
  return rows[0] as Todo;
}

export async function toggleTodo(id: string): Promise<Todo> {
  const rows = await sql`UPDATE todos SET done = NOT done WHERE id = ${id} RETURNING *`;
  return rows[0] as Todo;
}

export async function deleteTodo(id: string): Promise<void> {
  await sql`DELETE FROM todos WHERE id = ${id}`;
}

export { sql };
