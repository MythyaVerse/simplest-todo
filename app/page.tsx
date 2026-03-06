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
  const [error, setError] = useState<string>("");

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

    return grouped;
  }, [projects, todos]);

  async function loadData() {
    setError("");
    setLoading(true);

    try {
      const [projectsRes, todosRes, prioritiesRes, labelsRes] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/todos", { cache: "no-store" }),
        fetch("/api/options/priorities", { cache: "no-store" }),
        fetch("/api/options/labels", { cache: "no-store" }),
      ]);

      if (!projectsRes.ok || !todosRes.ok || !prioritiesRes.ok || !labelsRes.ok) {
        throw new Error("Failed to load data.");
      }

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
    } catch {
      setError("Could not load tasks. Try refreshing.");
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
    if (!res.ok) return setError("Project could not be created.");
    const item = (await res.json()) as Project;
    setProjects((prev) => [...prev, item]);
    setSelectedProjectId(item.id);
    setNewProjectName("");
  }

  async function createPriority() {
    const name = newPriorityName.trim().toLowerCase();
    if (!name) return;
    const res = await fetch("/api/options/priorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return setError("Priority could not be created.");
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
    if (!res.ok) return setError("Label could not be created.");
    const item = (await res.json()) as OptionItem;
    setLabels((prev) => [...prev, item]);
    setSelectedLabel(item.name);
    setNewLabelName("");
  }

  async function createTask() {
    const text = taskText.trim();
    if (!text || !selectedProjectId || !selectedPriority) return;

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

    if (!res.ok) return setError("Task could not be created.");
    const todo = (await res.json()) as Todo;
    setTodos((prev) => [todo, ...prev]);
    setTaskText("");
    setTaskLabels([]);
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
    if (!res.ok) return setError("Task could not be updated.");
    const updated = (await res.json()) as Todo;
    setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
  }

  async function removeTask(id: string) {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!res.ok) return setError("Task could not be removed.");
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  return (
    <main className="app">
      <header className="header"><div><p className="eyebrow">Simplest Todo</p><h1>Project Tasks</h1></div></header>

      <section className="panel">
        <h2>Add project</h2>
        <div className="row"><input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name" /><button type="button" onClick={() => void createProject()}>Add</button></div>
      </section>

      <section className="panel">
        <h2>Manage options</h2>
        <div className="row"><input value={newPriorityName} onChange={(e) => setNewPriorityName(e.target.value)} placeholder="New priority" /><button type="button" onClick={() => void createPriority()}>Add Priority</button></div>
        <div className="row"><input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="New label" /><button type="button" onClick={() => void createLabel()}>Add Label</button></div>
      </section>

      <section className="panel">
        <h2>Add task</h2>
        <div className="stack">
          <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="Task title" />
          <div className="row three-up">
            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>{priorities.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
            <button type="button" className="primary" onClick={() => void createTask()}>Add Task</button>
          </div>
          <div className="row">
            <select value={selectedLabel} onChange={(e) => setSelectedLabel(e.target.value)}>{labels.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}</select>
            <button type="button" onClick={addSelectedLabelToTask}>Add Label To Task</button>
          </div>
          {taskLabels.length > 0 && <div className="chips">{taskLabels.map((label) => <button key={label} type="button" className="chip" onClick={() => removeLabelFromTask(label)}>#{label} ×</button>)}</div>}
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {loading ? <p className="empty">Loading...</p> : (
        <section className="panel">
          <h2>Tasks by project</h2>
          {projects.map((project) => {
            const list = groupedTodos.get(project.id) ?? [];
            return <div key={project.id} className="project-block"><h3>{project.name}</h3>{list.length === 0 ? <p className="empty">No tasks yet.</p> : <ul className="list">{list.map((todo) => <li key={todo.id} className={todo.done ? "done" : ""}><label><input type="checkbox" checked={todo.done} onChange={() => void toggleTask(todo.id)} /><span>{todo.text}</span></label><div className="meta"><span className="badge">{todo.priority}</span>{todo.labels.map((label) => <span className="badge label" key={`${todo.id}-${label}`}>#{label}</span>)}<button type="button" onClick={() => void removeTask(todo.id)}>×</button></div></li>)}</ul>}</div>;
          })}
        </section>
      )}
    </main>
  );
}
