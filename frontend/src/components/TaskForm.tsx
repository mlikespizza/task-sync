import { useState } from "react";
export default function TaskForm() {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    // emit socket event to backend here
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-6">
      <input
        type="text"
        placeholder="Enter a task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="bg-sky-500 text-white hover:bg-sky-600 disabled:bg-slate-700 disabled:cursor-not-allowed"
      >
        + Add Task
      </button>
    </form>
  );
}
