"use client";

import { useEffect, useMemo, useState } from "react";

interface Project {
  id: string;
  name: string;
}

interface Todo {
  id: string;
  text: string;
  done: boolean;
  project_id: string;
  priority: string;
  labels: string[];
}

interface OptionItem {
  id: string;
  name: string;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // Ignore parse failures and use fallback.
  }
  return fallback;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [priorities, setPriorities] = useState<OptionItem[]>([]);
  const [labels, setLabels] = useState<OptionItem[]>([]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newPriorityName, setNewPriorityName] = useState("");
  const [newLabelName, setNewLabelName] = useState("");

  const [taskText, setTaskText] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [taskLabels, setTaskLabels] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    void loadData();
  }, []);

  const groupedTodos = useMemo(() => {
    const grouped = new Map<string, Todo[]>();

    for (const project of projects) grouped.set(project.id, []);
    for (const todo of todos) {
      if (!grouped.has(todo.project_id)) grouped.set(todo.project_id, []);
      grouped.get(todo.project_id)!.push(todo);
    }

    for (const list of grouped.values()) {
      list.sort((a, b) => Number(a.done) - Number(b.done));
    }

    return grouped;
  }, [projects, todos]);

  async function loadData() {
    setMessage("");
    setLoading(true);

    try {
      const [projectsRes, todosRes, prioritiesRes, labelsRes] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/todos", { cache: "no-store" }),
        fetch("/api/options/priorities", { cache: "no-store" }),
        fetch("/api/options/labels", { cache: "no-store" }),
      ]);

      if (!projectsRes.ok) throw new Error(await parseError(projectsRes, "Failed to load projects."));
      if (!todosRes.ok) throw new Error(await parseError(todosRes, "Failed to load tasks."));
      if (!prioritiesRes.ok) {
        throw new Error(await parseError(prioritiesRes, "Failed to load priorities."));
      }
      if (!labelsRes.ok) throw new Error(await parseError(labelsRes, "Failed to load labels."));

      const projectsData = (await projectsRes.json()) as Project[];
      const todosData = (await todosRes.json()) as Todo[];
      const prioritiesData = (await prioritiesRes.json()) as OptionItem[];
      const labelsData = (await labelsRes.json()) as OptionItem[];

      setProjects(projectsData);
      setTodos(todosData);
      setPriorities(prioritiesData);
      setLabels(labelsData);

      if (!selectedProjectId && projectsData.length > 0) setSelectedProjectId(projectsData[0].id);
      if (!selectedPriority && prioritiesData.length > 0) setSelectedPriority(prioritiesData[0].name);
      if (!selectedLabel && labelsData.length > 0) setSelectedLabel(labelsData[0].name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    const name = newProjectName.trim();
    if (!name) return;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      setMessage(await parseError(res, "Project could not be created."));
      return;
    }

    const item = (await res.json()) as Project;
    setProjects((prev) => [...prev, item]);
    setSelectedProjectId(item.id);
    setNewProjectName("");
    setMessage(`Project \"${item.name}\" created.`);
  }

  async function createPriority() {
    const name = newPriorityName.trim().toLowerCase();
    if (!name) return;

    const res = await fetch("/api/options/priorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      setMessage(await parseError(res, "Priority could not be created."));
      return;
    }

    const item = (await res.json()) as OptionItem;
    setPriorities((prev) => [...prev, item]);
    setSelectedPriority(item.name);
    setNewPriorityName("");
  }

  async function createLabel() {
    const name = newLabelName.trim().toLowerCase();
    if (!name) return;

    const res = await fetch("/api/options/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      setMessage(await parseError(res, "Label could not be created."));
      return;
    }

    const item = (await res.json()) as OptionItem;
    setLabels((prev) => [...prev, item]);
    setSelectedLabel(item.name);
    setNewLabelName("");
  }

  async function createTask() {
    const text = taskText.trim();
    if (!text || !selectedProjectId || !selectedPriority) {
      setMessage("Task, project, and priority are required.");
      return;
    }

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        projectId: selectedProjectId,
        priority: selectedPriority,
        labels: taskLabels,
      }),
    });

    if (!res.ok) {
      setMessage(await parseError(res, "Task could not be created."));
      return;
    }

    const todo = (await res.json()) as Todo;
    setTodos((prev) => [todo, ...prev]);
    setTaskText("");
    setTaskLabels([]);
    setMessage("");
  }

  function addSelectedLabelToTask() {
    if (!selectedLabel) return;
    if (taskLabels.includes(selectedLabel)) return;
    setTaskLabels((prev) => [...prev, selectedLabel]);
  }

  function removeLabelFromTask(label: string) {
    setTaskLabels((prev) => prev.filter((l) => l !== label));
  }

  async function toggleTask(id: string) {
    const res = await fetch(`/api/todos/${id}`, { method: "PATCH" });
    if (!res.ok) {
      setMessage(await parseError(res, "Task could not be updated."));
      return;
    }
    const updated = (await res.json()) as Todo;
    setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
  }

  async function removeTask(id: string) {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage(await parseError(res, "Task could not be removed."));
      return;
    }
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  return (
    <main className="app">
      <section className="hero">
        <p className="kicker">Neon + Vercel Todo</p>
        <h1>Project Planner</h1>
        <p>Every task is tied to a project with custom priorities and labels.</p>
      </section>

      {message && <p className="message">{message}</p>}

      <section className="workspace">
        <article className="card">
          <h2>Projects</h2>
          <div className="row">
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void createProject()}
              placeholder="Add a project"
            />
            <button type="button" onClick={() => void createProject()}>
              Save
            </button>
          </div>
        </article>

        <article className="card">
          <h2>Custom Options</h2>
          <div className="stack">
            <div className="row">
              <input
                value={newPriorityName}
                onChange={(e) => setNewPriorityName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void createPriority()}
                placeholder="New priority"
              />
              <button type="button" onClick={() => void createPriority()}>
                Add
              </button>
            </div>
            <div className="row">
              <input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void createLabel()}
                placeholder="New label"
              />
              <button type="button" onClick={() => void createLabel()}>
                Add
              </button>
            </div>
          </div>
        </article>

        <article className="card wide">
          <h2>New Task</h2>
          <div className="stack">
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void createTask()}
              placeholder="What needs to be done?"
            />
            <div className="row three-up">
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                <option value="" disabled>
                  Select project
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
                <option value="" disabled>
                  Select priority
                </option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button className="primary" type="button" onClick={() => void createTask()}>
                Add Task
              </button>
            </div>
            <div className="row">
              <select value={selectedLabel} onChange={(e) => setSelectedLabel(e.target.value)}>
                <option value="" disabled>
                  Select label
                </option>
                {labels.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addSelectedLabelToTask}>
                Attach Label
              </button>
            </div>
            {taskLabels.length > 0 && (
              <div className="chips">
                {taskLabels.map((label) => (
                  <button key={label} type="button" className="chip" onClick={() => removeLabelFromTask(label)}>
                    #{label} ×
                  </button>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="card board">
        <h2>Tasks by Project</h2>
        {loading ? (
          <p className="hint">Loading...</p>
        ) : (
          projects.map((project) => {
            const list = groupedTodos.get(project.id) ?? [];
            return (
              <div key={project.id} className="project-column">
                <h3>{project.name}</h3>
                {list.length === 0 ? (
                  <p className="hint">No tasks yet.</p>
                ) : (
                  <ul className="list">
                    {list.map((todo) => (
                      <li key={todo.id} className={todo.done ? "done" : ""}>
                        <label>
                          <input type="checkbox" checked={todo.done} onChange={() => void toggleTask(todo.id)} />
                          <span>{todo.text}</span>
                        </label>
                        <div className="meta">
                          <span className="badge priority">{todo.priority}</span>
                          {todo.labels.map((label) => (
                            <span className="badge label" key={`${todo.id}-${label}`}>
                              #{label}
                            </span>
                          ))}
                          <button type="button" onClick={() => void removeTask(todo.id)}>
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
