const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('pg');

const app = express();
const server = http.createServer(app);

// ─── Serve the client HTML ───────────────────────────────────
app.use(express.static('client'));
app.use(express.json());

// ─── WebSocket Server ─────────────────────────────────────────
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
  console.log('✅ New client connected');
  clients.push(ws);

  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clients = clients.filter(c => c !== ws);
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// ─── PostgreSQL LISTEN ────────────────────────────────────────
const pgClient = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'orders_db',
  password: 'postgres',   
  port: 5432,
});

pgClient.connect();
pgClient.query('LISTEN orders_channel');

pgClient.on('notification', (msg) => {
  console.log('📨 DB Change received:', msg.payload);
  const payload = JSON.parse(msg.payload);
  broadcast(payload);
});

// ─── REST API to insert orders (for testing) ──────────────────
app.post('/order', async (req, res) => {
  const { customer_name, product_name, status } = req.body;
  try {
    const { Pool } = require('pg');
    const pool = require('./db');
    await pool.query(
      'INSERT INTO orders (customer_name, product_name, status) VALUES ($1, $2, $3)',
      [customer_name, product_name, status]
    );
    res.json({ message: 'Order created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────
server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});