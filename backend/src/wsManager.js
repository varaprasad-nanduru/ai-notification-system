import { WebSocket } from 'ws';

const connections = new Map();

export const wsManager = {
  connect(ws, clientId) {
    connections.set(clientId, ws);
  },

  disconnect(clientId) {
    connections.delete(clientId);
  },

  broadcast(message) {
    const json = JSON.stringify(message);
    for (const [clientId, ws] of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(json);
      } else {
        connections.delete(clientId);
      }
    }
  },

  get connectionCount() {
    return connections.size;
  },
};
