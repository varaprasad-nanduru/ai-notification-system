import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { classifyNotification } from './aiClassifier.js';
import { notifStore } from './notifStore.js';
import { wsManager } from './wsManager.js';

const PORT = parseInt(process.env.PORT ?? '8000', 10);

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    service: 'AI Notification System',
    active_connections: wsManager.connectionCount,
  });
});

// List notifications
app.get('/api/notifications', (_req, res) => {
  res.json(notifStore.getAll());
});

// Create & classify a notification
app.post('/api/notifications', async (req, res) => {
  const { title, message, source = 'system' } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const classification = await classifyNotification(title, message);

  const notification = {
    id: uuidv4(),
    title,
    message,
    source,
    created_at: new Date().toISOString(),
    is_read: false,
    ...classification,
  };

  notifStore.add(notification);
  wsManager.broadcast({ type: 'new', data: notification });
  res.status(201).json(notification);
});

// Mark as read
app.patch('/api/notifications/:id/read', (req, res) => {
  const notif = notifStore.markRead(req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  wsManager.broadcast({ type: 'update', data: notif });
  res.json(notif);
});

// Mark as unread
app.patch('/api/notifications/:id/unread', (req, res) => {
  const notif = notifStore.markUnread(req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  wsManager.broadcast({ type: 'update', data: notif });
  res.json(notif);
});

// Delete
app.delete('/api/notifications/:id', (req, res) => {
  notifStore.delete(req.params.id);
  wsManager.broadcast({ type: 'delete', data: { id: req.params.id } });
  res.json({ status: 'deleted', id: req.params.id });
});

// ── HTTP + WebSocket server ──────────────────────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  // Parse client_id from URL: /ws/{client_id}
  const match = (req.url ?? '').match(/^\/ws\/(.+)$/);
  const clientId = match ? match[1] : uuidv4();

  wsManager.connect(ws, clientId);

  // Send current notification list immediately on connect
  ws.send(JSON.stringify({ type: 'initial', data: notifStore.getAll() }));

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'mark_read') {
        const notif = notifStore.markRead(msg.id);
        if (notif) wsManager.broadcast({ type: 'update', data: notif });
      } else if (msg.type === 'mark_unread') {
        const notif = notifStore.markUnread(msg.id);
        if (notif) wsManager.broadcast({ type: 'update', data: notif });
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('close', () => wsManager.disconnect(clientId));
  ws.on('error', () => wsManager.disconnect(clientId));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket listening on ws://localhost:${PORT}/ws/{client_id}`);
});
