"use client";

import { useState, useEffect } from "react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_KEY = "todos";

function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveTodos(todos: Todo[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTodos(loadTodos());
    setReady(true);
  }, []);

  const add = () => {
    const text = input.trim();
    if (!text) return;
    const newTodo = { id: crypto.randomUUID(), text, done: false };
    const updated = [...todos, newTodo];
    setTodos(updated);
    saveTodos(updated);
    setInput("");
  };

  const toggle = (id: string) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    setTodos(updated);
    saveTodos(updated);
  };

  const remove = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    saveTodos(updated);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Todo</h1>
      </header>
      <div className="input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task..."
          aria-label="New task"
        />
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
      <ul className="list">
        {todos.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                aria-label={`Mark "${t.text}" as ${t.done ? "incomplete" : "done"}`}
              />
              <span>{t.text}</span>
            </label>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label={`Remove "${t.text}"`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {ready && todos.length === 0 && (
        <p className="empty">No tasks yet. Add one above.</p>
      )}
    </div>
  );
}
