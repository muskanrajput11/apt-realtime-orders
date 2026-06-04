# Real-Time Orders Notification System

Whenever data changes in the database, connected clients get updated
instantly — no page refresh, no polling.

---

## How It Works

1. A change happens in the `orders` table (insert/update/delete)
2. PostgreSQL trigger fires and sends a notification
3. Node.js backend receives it and pushes it via WebSocket
4. Browser updates the UI in real time

---

##  Tech Used

- **Node.js + Express** — Backend server
- **PostgreSQL** — Database with built-in LISTEN/NOTIFY
- **WebSockets** — Push updates to browser instantly
- **HTML + JS** — Live dashboard in browser

---

## How to Run

 1. Install dependencies
```bash
npm install

 2. Set Up the Database
```bash
psql -U postgres
CREATE DATABASE orders_db;
\c orders_db

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  product_name VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('pending', 'shipped', 'delivered')),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION notify_order_change()
RETURNS TRIGGER AS $$
DECLARE payload JSON;
BEGIN
  payload = json_build_object(
    'operation',     TG_OP,
    'id',            NEW.id,
    'customer_name', NEW.customer_name,
    'product_name',  NEW.product_name,
    'status',        NEW.status,
    'updated_at',    NEW.updated_at
  );
  PERFORM pg_notify('orders_channel', payload::TEXT);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_change_trigger
AFTER INSERT OR UPDATE OR DELETE
ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_change();

3. Configure DB Password
In server.js and db.js, update:
password: 'your_postgres_password'

4. Start the Server
```bash
node server.js

5. Open the Dashboard
Go to: http://localhost:3000

Testing
Via Browser UI:
Fill the form and click Add Order
Row appears instantly with a flash animation

Via psql directly:
INSERT INTO orders (customer_name, product_name, status)
VALUES ('Alice', 'Laptop', 'pending');
→ Browser updates automatically!

Open multiple tabs — all receive updates simultaneously.

### Scalability Considerations
Challenge	         Solution
Multiple servers	 Replace pg LISTEN with Redis pub/sub
Many WS connections	 Use a load balancer + sticky sessions
High write volume	 Add debouncing or batch notifications
Auth	             Add JWT token validation on WS handshake

### Project Structure
├── server.js       → Backend server
├── db.js           → Database connection
├── client/
│   └── index.html  → Live browser dashboard
└── README.md

Muskan Rajput — Built for Apt Interview Assignment