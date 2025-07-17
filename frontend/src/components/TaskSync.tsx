// src/components/TaskSync.tsx
"use client";

import { useEffect, useState } from "react";
import TaskForm from "@/components/TaskForm";
import TaskBoard from "@/components/TaskBoard";
import socket from "@/lib/socket";
import { useTaskStore } from "@/store/taskStore";

export default function TaskSync() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const authToken = useTaskStore((s) => s.authToken);
  const setAuthToken = useTaskStore((s) => s.setAuthToken);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    function onConnect() {
      setConnectionStatus("connected");
    }
    function onDisconnect() {
      setConnectionStatus("disconnected");
    }
    function onError(err: Error) {
      console.error("Socket error:", err);
      setConnectionStatus("disconnected");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, []);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      const data = await res.json();
      setAuthToken?.(data.token);
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken?.(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/70 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-sky-400 text-2xl font-bold">🧠 TaskSync</div>
          <span className="bg-sky-800 text-sky-200 text-xs px-2 py-1 rounded">v1.0</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span>
            {connectionStatus === 'connected'
              ? 'Connected'
              : connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Login Form */}
      {!authToken && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-xl shadow-md w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-xl font-bold text-sky-400 mb-2 text-center">Sign in to TaskSync</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <button
              type="submit"
              className="bg-sky-500 text-white rounded py-2 font-semibold hover:bg-sky-600 transition-colors"
              disabled={loginLoading}
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
            {loginError && <div className="text-red-400 text-sm text-center">{loginError}</div>}
          </form>
        </main>
      )}

      {/* Main Content */}
      {authToken && (
        <main className="flex-1 px-6 py-8">
          <div className="flex justify-end mb-4">
            <button onClick={handleLogout} className="text-sky-400 hover:underline text-sm">Logout</button>
          </div>
          <TaskForm />
          <TaskBoard />
        </main>
      )}

      {/* Footer */}
      <footer className="text-center text-gray-500 py-4 border-t border-slate-800">
        TaskSync &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
