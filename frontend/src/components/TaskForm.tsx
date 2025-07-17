import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import socket from "@/lib/socket";
import { useTaskStore } from "@/store/taskStore";
import { Task } from "@/types";

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addTask = useTaskStore((s: any) => s.addTask);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return;
    setLoading(true);
    const newTask: Task = {
      id: uuidv4(),
      title: title.trim(),
      status: "todo",
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      // Optimistically add to local state
      addTask(newTask);
      socket.emit("new-task", newTask);
      const response = await fetch("http://localhost:3001/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      setTitle("");
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-6" aria-label="Add new task">
      <input
        type="text"
        placeholder="Enter a task..."
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        className="flex-1"
        aria-label="Task title"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!title.trim() || loading}
        className="bg-sky-500 text-white hover:bg-sky-600 disabled:bg-slate-700 disabled:cursor-not-allowed"
        aria-disabled={!title.trim() || loading}
      >
        {loading ? "Adding..." : "+ Add Task"}
      </button>
      {error && <span className="text-red-500 ml-2 text-sm">{error}</span>}
    </form>
  );
}
