"use client";
import React from "react";
import { useEffect } from "react";
import socket from "@/lib/socket";
import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
