import { useState } from "react";
import socket from "@/lib/socket";
import { useTaskStore } from "@/store/taskStore";
export default function TaskForm() {
  const [title, setTitle] = useState('');
  const { addTask } = useTaskStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      // Create new task object
      const newTask = {
        id: Date.now().toString(), // temporary ID
        title: title.trim(),
        status: 'todo' as const,
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to local state immediately for better UX
      addTask(newTask);
      
      // Send to backend via API
      const response = await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      });
      
      if (response.ok) {
        const createdTask = await response.json();
        // Update with real task from backend
        addTask(createdTask);
        // Emit socket event for real-time updates
        socket.emit('new-task', createdTask);
      } else {
        console.error('Failed to create task');
      }
      
      setTitle('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '25px',
      padding: '30px',
      marginBottom: '40px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)'
    }}>
      <h2 style={{
        textAlign: 'center',
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '25px',
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>Create New Task</h2>
      
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Enter a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: '1',
            minWidth: '300px',
            padding: '18px 25px',
            fontSize: '16px',
            border: '2px solid #e1e5e9',
            borderRadius: '50px',
            outline: 'none',
            background: '#fff',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}
          onFocus={(e) => {
            const target = e.target as HTMLInputElement;
            target.style.borderColor = '#667eea';
            target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.2)';
          }}
          onBlur={(e) => {
            const target = e.target as HTMLInputElement;
            target.style.borderColor = '#e1e5e9';
            target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
          }}
        />
        <button
          type="submit"
          disabled={!title.trim()}
          style={{
            padding: '18px 35px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            background: title.trim() ? 'linear-gradient(45deg, #667eea, #764ba2)' : '#ccc',
            border: 'none',
            borderRadius: '50px',
            cursor: title.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: title.trim() ? '0 6px 20px rgba(102, 126, 234, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '140px',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (title.trim()) {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (title.trim()) {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
            }
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span>
          Add Task
        </button>
      </form>
    </div>
  );
}
