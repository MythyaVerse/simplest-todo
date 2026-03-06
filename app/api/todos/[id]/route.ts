import { deleteTodo, toggleTodo } from '../../../../lib/db';

export async function PATCH(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const todo = await toggleTodo(id);

  if (!todo) {
    return Response.json({ error: 'Todo not found.' }, { status: 404 });
  }

  return Response.json(todo);
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  await deleteTodo(id);
  return new Response(null, { status: 204 });
}
