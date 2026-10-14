# FlavorCraft — Food Delivery Order Management System

A full-stack food delivery Order Management System built with **Next.js (App Router)**, **TypeScript (Strict Mode)**, **Tailwind CSS**, **Zod**, and **Vitest**.

Developed following strict **Test-Driven Development (TDD)**, the application features real-time order tracking via Server-Sent Events (SSE) with polling fallback, serverless status simulation, zero-trust price recalculation, and a repository persistence layer supporting both in-memory and Neon PostgreSQL (via Drizzle ORM).

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React / Next.js)"]
        UI["Storefront UI & Cart Drawer"]
        Form["Checkout Form (Zod Client Validation)"]
        Tracker["Order Tracking Page (/orders/:id)"]
        SSEClient["SSE Listener (EventSource)"]
        PollClient["Polling Fallback (setInterval)"]
        CartStore["Cart State (Context + localStorage)"]
    end

    subgraph API ["Next.js Route Handlers (/api)"]
        RateLimiter["In-Memory Rate Limiter"]
        AuthGuard["Admin Token Guard (x-admin-token)"]
        APIMenu["GET /api/menu"]
        APIOrdersPost["POST /api/orders"]
        APIOrdersList["GET /api/orders"]
        APIOrdersGet["GET /api/orders/:id"]
        APIOrdersPatch["PATCH /api/orders/:id/status"]
        APIOrdersDelete["DELETE /api/orders/:id"]
        APIOrdersStream["GET /api/orders/:id/stream (SSE)"]
    end

    subgraph Domain ["Domain & Services Layer"]
        Validation["Shared Zod Schemas & Sanitization"]
        MenuService["Menu Service (Seeded Items)"]
        OrderService["Order Service (Business Rules)"]
        StatusSimulation["Status Timing Engine (Elapsed-Time)"]
    end

    subgraph Persistence ["Persistence Layer (Repository Pattern)"]
        RepoFactory["Repository Factory (getOrderRepository)"]
        InMemoryRepo["InMemoryOrderRepository (Default / Tests)"]
        PostgresRepo["PostgresOrderRepository (Drizzle ORM)"]
        NeonDB[("Neon Serverless Postgres")]
    end

    UI --> Form
    Form --> APIOrdersPost
    Tracker --> SSEClient
    Tracker --> PollClient
    SSEClient --> APIOrdersStream
    PollClient --> APIOrdersGet

    APIOrdersPost --> RateLimiter --> Validation --> OrderService
    APIOrdersPatch --> AuthGuard --> Validation --> OrderService
    APIOrdersDelete --> AuthGuard --> OrderService
    APIMenu --> MenuService

    OrderService --> StatusSimulation
    OrderService --> MenuService
    OrderService --> RepoFactory

    RepoFactory -->|DATABASE_URL unset| InMemoryRepo
    RepoFactory -->|DATABASE_URL set| PostgresRepo --> NeonDB
```

---

## 🚀 Key Features

1. **Artisan Menu & Catalog**:
   - 10 seeded culinary items across Pizza, Burgers, Pasta, Salads, Desserts, and Drinks.
   - Prices stored strictly in integer cents (e.g. `$12.99` as `1299`) to prevent floating-point inaccuracies.
   - High-resolution, responsive Unsplash photography with category filtering and real-time search.
2. **Persistent Cart & Checkout**:
   - React Context persisted to `localStorage`.
   - Quantity limits enforced: minimum 1, maximum 20 per item.
   - Duplicate order line items automatically merged.
   - Comprehensive customer validation (10-digit and E.164 international phone formats, minimum name and address lengths).
3. **Zero-Trust Pricing Architecture**:
   - The backend completely ignores client prices; all subtotals and totals are recalculated authoritatively from server menu items.
4. **Serverless Real-Time Status Simulation**:
   - Order statuses: `received` → `preparing` → `out_for_delivery` → `delivered` (or `cancelled`).
   - Status is computed dynamically on the server from elapsed time since `createdAt`, requiring **no background workers, cron jobs, or persistent servers**:
     - `0s - 15s`: Order Received
     - `15s - 45s`: Preparing
     - `45s - 90s`: Out for Delivery
     - `90s+`: Delivered
   - Configurable in a single configuration file (`src/lib/config/statusTiming.ts`).
   - Manual `PATCH` status updates or `DELETE` cancellations override the time simulation.
5. **Real-time Live Sync (SSE + Polling Fallback)**:
   - Live status updates stream via `GET /api/orders/:id/stream` (Server-Sent Events).
   - If the client environment or network drops SSE, tracking automatically falls back to 3-second polling.
6. **Strict State Transitions & Cancellation Guards**:
   - Forward-only state progression (`received` → `preparing` → `out_for_delivery` → `delivered`).
   - Invalid skips or backward transitions return `409 Conflict`.
   - Orders can only be cancelled before dispatch (`received` or `preparing`). Cancellation attempts after dispatch return `409 Conflict`.
7. **Security & Resiliency**:
   - In-memory fixed-window (30 requests per minute per IP) rate limiter protecting `POST /api/orders`. Because it is in-memory, limits apply per serverless instance; a shared store (Upstash Redis) would be the production fix.
   - Optional `ADMIN_TOKEN` protection on status override and cancellation endpoints.
   - Unified error response envelope `{ error: { code, message, details? } }` with zero stack-trace leakage.

---

## 📐 Design Decisions & Trade-offs

### 1. Repository Pattern (In-Memory vs Postgres)
- **Decision**: Decouple business logic from database drivers behind an `OrderRepository` interface. Use `InMemoryOrderRepository` by default and switch dynamically to `PostgresOrderRepository` (via Drizzle ORM and Neon) when `DATABASE_URL` is set.
- **Trade-off**: In-memory state is wiped if serverless functions recycle in stateless cloud environments; however, it provides instantaneous zero-configuration local development and rapid test suite execution (71 tests in ~4s). Providing the Neon PostgreSQL repository solves production persistence.

### 2. Time-Based Status Simulation on Serverless
- **Decision**: Calculate the simulated state as a pure function of `createdAt`, `manualStatus`, and `Date.now()`.
- **Trade-off**: Avoids the operational overhead, pricing, and infrastructure complexity of Redis / BullMQ workers or scheduled Lambdas. The trade-off is that external webhooks or physical IoT signals aren't received, though manual `PATCH` overrides satisfy administrative intervention.

### 3. Shared Zod Schemas for Client & Server
- **Decision**: Share validation rules (`customerSchema`, `orderItemInputSchema`, `phoneRegex`) between React components and API route handlers.
- **Trade-off**: Guarantees identical validation messages and constraints across the boundaries without duplicated code.

### 4. SSE with Polling Fallback
- **Decision**: Next.js route handlers implement a `ReadableStream` emitting `text/event-stream` for live updates, with client-side detection falling back to `setInterval` polling if `EventSource` errors.
- **Trade-off**: Provides real-time responsiveness for modern browsers; the client falls back to 3-second polling if the stream drops or the platform ends the long-lived connection.

---

## 📡 REST API Documentation

### Base URL: `/api`

### 1. Get Menu Items
- **Endpoint**: `GET /api/menu`
- **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "margherita-pizza",
      "name": "Classic Margherita Pizza",
      "description": "San Marzano tomato sauce, fresh mozzarella di bufala, basil...",
      "price": 1299,
      "category": "pizza",
      "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3..."
    }
  ]
}
```

---

### 2. Create Order
- **Endpoint**: `POST /api/orders`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "customer": {
    "name": "Jane Doe",
    "address": "123 Food Street, Apt 4B",
    "phone": "+14155552671"
  },
  "items": [
    { "menuItemId": "margherita-pizza", "quantity": 2 },
    { "menuItemId": "classic-cheeseburger", "quantity": 1 }
  ]
}
```
- **Response**: `201 Created`
```json
{
  "data": {
    "id": "ord-m1xyz-abcde",
    "customer": {
      "name": "Jane Doe",
      "address": "123 Food Street, Apt 4B",
      "phone": "+14155552671"
    },
    "items": [
      {
        "menuItemId": "margherita-pizza",
        "name": "Classic Margherita Pizza",
        "price": 1299,
        "quantity": 2,
        "subtotal": 2598
      },
      {
        "menuItemId": "classic-cheeseburger",
        "name": "Double Cheeseburger",
        "price": 1149,
        "quantity": 1,
        "subtotal": 1149
      }
    ],
    "total": 3747,
    "status": "received",
    "manualStatus": null,
    "createdAt": "2026-10-14T00:00:00.000Z",
    "updatedAt": "2026-10-14T00:00:00.000Z"
  }
}
```

---

### 3. List Orders
- **Endpoint**: `GET /api/orders`
- **Response**: `200 OK` (sorted newest first with real-time derived status)

---

### 4. Get Order by ID
- **Endpoint**: `GET /api/orders/:id`
- **Response**: `200 OK`
- **Error**: `404 Not Found` if id does not exist:
```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order with ID 'ord-xyz' not found",
    "details": { "orderId": "ord-xyz" }
  }
}
```

---

### 5. Update Order Status (Manual Override)
- **Endpoint**: `PATCH /api/orders/:id/status`
- **Headers**:
  - `Content-Type: application/json`
  - `x-admin-token: <ADMIN_TOKEN>` *(optional; required only if `ADMIN_TOKEN` env var is configured)*
- **Request Body**:
```json
{
  "status": "preparing"
}
```
- **Response**: `200 OK`
- **Error (Invalid Transition)**: `409 Conflict`
```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition order status from 'received' to 'out_for_delivery'. Only sequential forward transitions are permitted."
  }
}
```

---

### 6. Cancel Order
- **Endpoint**: `DELETE /api/orders/:id`
- **Headers**:
  - `x-admin-token: <ADMIN_TOKEN>` *(optional; required only if `ADMIN_TOKEN` env var is configured)*
- **Response**: `200 OK` (order status set to `cancelled`)
- **Error**: `409 Conflict` if order was already dispatched (`out_for_delivery` or `delivered`):
```json
{
  "error": {
    "code": "CANNOT_CANCEL_ORDER",
    "message": "Cannot cancel order with status 'out_for_delivery'. Orders can only be cancelled before dispatch (received or preparing)."
  }
}
```

---

### 7. Real-Time Status Stream (SSE)
- **Endpoint**: `GET /api/orders/:id/stream`
- **Response**: `200 OK` with `Content-Type: text/event-stream`
- **Stream Format**:
```text
data: {"id":"ord-123","status":"received",...}

data: {"id":"ord-123","status":"preparing",...}
```

---

### Error Codes Reference

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request payload failed Zod validation |
| `400` | `MALFORMED_JSON` | Invalid JSON body in request |
| `400` | `MENU_ITEM_NOT_FOUND` | Ordered item ID does not exist in catalog |
| `401` | `UNAUTHORIZED` | Missing or invalid admin token when protected |
| `404` | `ORDER_NOT_FOUND` | Order ID does not exist |
| `409` | `INVALID_STATUS_TRANSITION` | Attempted invalid or backward status transition |
| `409` | `CANNOT_CANCEL_ORDER` | Order has already been dispatched for delivery |
| `429` | `RATE_LIMIT_EXCEEDED` | Request rate limit exceeded |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server fault (no stack trace leaked) |

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js `v20.x` or `v22.x` (tested on Node v22.16.0)
- npm `v10.x` or later

### Installation
```bash
# 1. Clone repository
git clone https://github.com/Bhakti12/order_management_system
cd order_management_system

# 2. Install dependencies
npm install

# 3. Create local environment file
cp .env.example .env.local
```

### Running the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

The project follows a strict TDD methodology with atomic red-green git commits.

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run ESLint validation
npm run lint

# Build for production
npm run build
```

### Test Suite Summary
- **13 Test Suites**
- **71 Tests Passing (100%)**
- **86.3% Code Coverage (100% on Core Domain Services, Validation, and Config)**

---

## 🌐 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | No | *None (In-Memory)* | Postgres connection string for Neon. When unset, `InMemoryOrderRepository` is used. |
| `ADMIN_TOKEN` | No | *None (Open)* | Optional secret token for manual status update (`PATCH`) and cancellation (`DELETE`). **Note:** UI demo buttons (Cancel, fast-forward) do not send this token and will return `401 Unauthorized` if this is set; recommend leaving unset for demo deployments. |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Base public URL for client requests. |

---

## ☁️ Deployment Guide (Vercel & Neon Postgres)

### Step 1: Provision Neon Serverless PostgreSQL
1. Create a free account at [neon.tech](https://neon.tech).
2. Create a new project (e.g. `flavorcraft-db`).
3. Copy the pooled connection string:
   ```text
   postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Push Database Schema
- **macOS / Linux**:
  ```bash
  DATABASE_URL="your-neon-connection-string" npm run db:push
  ```
- **Windows PowerShell**:
  ```powershell
  $env:DATABASE_URL="your-neon-connection-string"; npm run db:push
  ```

### Step 3: Deploy to Vercel
1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import your repository.
3. In **Environment Variables**, add:
   - `DATABASE_URL` (*strongly recommended*): `postgresql://...` (without this, the default in-memory storage is not shared across serverless instances and can lose orders between requests).
   - `ADMIN_TOKEN` (*optional*): Leave unset for demo deployments. If set, the Cancel and fast-forward demo buttons in the UI will return `401 Unauthorized` because the demo UI does not send this token.
4. Click **Deploy**. Vercel will automatically build the Next.js App Router application.

---

## ⚠️ Known Limitations

- **In-Memory Rate Limiter**: Rate limiting is tracked in-memory and enforced per serverless instance rather than globally.
- **In-Memory Repository**: The in-memory repository is not shared across serverless instances; without Neon Postgres (`DATABASE_URL`), order state can be lost between serverless requests.
- **SSE Platform Timeouts**: Serverless platforms or edge proxies may terminate long-lived SSE connections due to execution timeouts; the client's 3-second polling fallback covers this seamlessly.
- **No Customer Authentication**: There is currently no authentication or login system for customers; orders are accessed via unique order IDs.

---

## 🔮 What I Would Improve With More Time

1. **Distributed Real-Time Pub/Sub**:
   - Replace in-memory SSE intervals with an edge-ready pub/sub engine like **Upstash Redis** or **Pusher**. This would broadcast status updates instantly across multiple serverless regions and client tabs.
2. **Payment Gateway Integration**:
   - Integrate **Stripe Elements** with webhook signature verification to handle authorization, capture, and refunds upon order cancellation.
3. **Customer Accounts & Order History**:
   - Implement **NextAuth.js** with OAuth (Google, GitHub) or passkeys to store customer address books and past order receipts.
4. **Driver Location Simulation**:
   - Render a live Mapbox/Leaflet vector map on `/orders/[id]` showing a moving delivery bike icon with GPS coordinates interpolated along route waypoints.
5. **Kitchen Display System (KDS)**:
   - Build a real-time `/admin/kitchen` kanban board for chefs to view incoming tickets, tap to prepare, and mark items ready for dispatch.
