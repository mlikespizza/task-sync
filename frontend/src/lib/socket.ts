// src/lib/socket.ts
import socketIOClient from 'socket.io-client';
// The type is available under the 'Socket' property of the main export
// or from the global SocketIOClient namespace.
// To ensure it works in your module, we can define it like this:
type Socket = SocketIOClient.Socket;

const socket: Socket = socketIOClient("http://localhost:3001", {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
});

export default socket;