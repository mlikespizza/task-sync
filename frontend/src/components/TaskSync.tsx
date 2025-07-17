// src/components/TaskSync.tsx
"use client";

import { useEffect, useState } from "react";
import TaskForm from "@/components/TaskForm";
import TaskBoard from "@/components/TaskBoard";
import socket from "@/lib/socket";

export default function TaskSync() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/70 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-sky-400 text-2xl font-bold">🧠 TaskSync</div>
          <div className="text-3xl font-bold text-sky-400">Hello Tailwind!</div>

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

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <TaskForm />
        <TaskBoard />
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-4 border-t border-slate-800">
        TaskSync &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
