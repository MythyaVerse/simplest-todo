import { deleteTodo, toggleTodo } from '../../../../lib/db';

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const todo = await toggleTodo(id);

  if (!todo) {
    return Response.json({ error: 'Todo not found.' }, { status: 404 });
  }

  return Response.json(todo);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await deleteTodo(id);
  return new Response(null, { status: 204 });
}
