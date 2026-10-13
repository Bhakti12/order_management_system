# Video Walkthrough Script & Notes (12–15 Minutes)

**Project**: FlavorCraft — Food Delivery Order Management System  
**Presenter**: Senior Full-Stack Engineer  
**Format**: Loom / Screen Recording  
**Target Duration**: 12–15 Minutes

---

## ⏱️ Video Timeline & Outline

```
00:00 - 02:45  Section 1: Introduction & Live End-to-End Product Demo
02:45 - 05:30  Section 2: Architecture, Directory Structure & Separation of Concerns
05:30 - 08:30  Section 3: Backend API, Zero-Trust Pricing & Serverless Status Engine
08:30 - 11:00  Section 4: Test-Driven Development (TDD) Workflow & Test Suite Tour
11:00 - 13:15  Section 5: AI Collaboration, Critical Bugs Found & Solutions
13:15 - 15:00  Section 6: Production Deployment Strategy & Future Roadmap
```

---

## Section 1: Introduction & Live End-to-End Demo (00:00 – 02:45)

### 🎙️ Talking Points:
- **Hook & Goal**:
  > *"Hi everyone! In this video, I'll be walking you through the Order Management feature I built for FlavorCraft, an artisan food delivery app. The entire system was developed following strict Test-Driven Development (TDD) using Next.js App Router, TypeScript in strict mode, Tailwind CSS, Zod, and Vitest."*
- **Storefront & Menu Navigation**:
  - Show the responsive menu grid loaded with 10 seeded items across pizzas, burgers, pastas, salads, desserts, and drinks.
  - Demonstrate instant category filtering (e.g. clicking "Pizza" or "Desserts") and text search.
  - Highlight integer cent pricing formatted properly in USD (`$12.99`).
- **Cart Interactions**:
  - Add multiple items to the cart. Show instant visual feedback ("Added" state).
  - Open the slide-over Cart Drawer.
  - Demonstrate quantity modification (`+` and `-`), showing boundary enforcement (minimum 1, maximum 20).
  - Show live recalculation of subtotal and total.
- **Checkout & Real-Time Tracking**:
  - Click "Proceed to Checkout".
  - Trigger inline validation by clicking "Place Order" with empty inputs (Name min 2, Address min 5, Phone formatting).
  - Fill in valid customer details and submit.
  - Show immediate redirection to `/orders/[id]`.
- **Live Status Stepper & Simulation**:
  - Point out the active stepper (`Order Received` → `Preparing` → `Out for Delivery` → `Delivered`).
  - Show the live indicator displaying active Server-Sent Events (SSE).
  - Explain the elapsed-time serverless simulation (15s received, 30s preparing, 45s out for delivery, then delivered).
  - Demonstrate the "Reviewer Demo Tools" on screen: click "Advance Status (PATCH)" to show immediate forward transition override!
  - Place a second order and demonstrate cancellation before dispatch (showing the `Cancel Order` button turning the order into `Cancelled`).

---

## Section 2: Architecture & Codebase Tour (02:45 – 05:30)

### 🎙️ Talking Points:
- **High-Level Design Philosophy**:
  > *"My primary goal was clean separation of concerns, testability, and serverless compatibility without reliance on long-running background workers."*
- **Walkthrough of Directory Structure**:
  - `src/app`: Thin App Router handlers and pages. Routes contain zero business rules—they simply parse input, invoke services, and return standardized responses.
  - `src/components`: Accessible, reusable UI components (`MenuItemCard`, `MenuGrid`, `CartDrawer`, `CheckoutForm`, `OrderStatusStepper`).
  - `src/context`: React Context (`CartContext`) managing cart items with `localStorage` persistence and boundary clamping.
  - `src/services`: Core domain business services (`orderService`, `menuService`).
  - `src/repositories`: Persistence abstraction following the **Repository Pattern** (`OrderRepository` interface).
    - `InMemoryOrderRepository`: Fast, zero-dependency persistence for local development and testing.
    - `PostgresOrderRepository`: Drizzle ORM implementation querying Neon serverless PostgreSQL when `DATABASE_URL` is set.
    - `src/repositories/index.ts`: Dynamic factory that resolves the active repository based on the environment.
  - `src/lib/config`: Single source of truth for status progression timing (`statusTiming.ts`).
  - `src/lib/validation`: Shared Zod schemas ensuring complete parity between frontend forms and backend REST APIs.
  - `src/lib/http`: Unified error envelope, status codes, rate limiter, and auth checks.

---

## Section 3: Backend API, Zero-Trust Pricing & Status Engine (05:30 – 08:30)

### 🎙️ Talking Points:
- **Zero-Trust Pricing**:
  - Open `src/services/orderService.ts`.
  - Explain why client-submitted item prices are **never trusted**:
    > *"A malicious user could modify the client payload to send a price of 1 cent. In our `orderService.createOrder`, the server takes only `menuItemId` and `quantity`, fetches the authoritative price from `menuService`, and recalculates item subtotals and order totals on the server."*
- **Serverless Status Simulation Engine**:
  - Open `src/lib/config/statusTiming.ts`.
  - Explain how real-time progression works in a serverless environment (e.g. Vercel) where background worker processes do not exist:
    > *"Status is derived mathematically: `currentTime - createdAt`. If elapsed seconds are under 15s, it's 'received'; between 15s and 45s, 'preparing'; between 45s and 90s, 'out_for_delivery'; and beyond 90s, 'delivered'. If a manual PATCH or DELETE occurs, `manualStatus` overrides the simulation."*
- **SSE Stream with Polling Fallback**:
  - Open `src/app/api/orders/[id]/stream/route.ts` and `src/app/orders/[id]/page.tsx`.
  - Explain that modern browsers use `EventSource` to receive push updates without HTTP overhead. If the client disconnects or SSE fails, the client seamlessly degrades to 3-second HTTP polling.
- **Security & Edge Cases**:
  - Rate Limiter: In-memory sliding window on `POST /api/orders` returning `429 Too Many Requests`.
  - Admin Security: Optional `ADMIN_TOKEN` protection on `PATCH` and `DELETE` via `x-admin-token` header.
  - Conflict Guards: Forward-only transitions enforced (`409 Conflict`), and cancellation rejected once dispatched.

---

## Section 4: Test-Driven Development (TDD) Workflow (08:30 – 11:00)

### 🎙️ Talking Points:
- **TDD Rigor**:
  - Show the Git commit log (`git log --oneline`).
  - Demonstrate the red-green commit pairs:
    1. Validation & Status Timing: `test: ... (red)` → `feat: ... (green)`
    2. Repositories & Services: `test: ... (red)` → `feat: ... (green)`
    3. REST API & SSE: `test: ... (red)` → `feat: ... (green)`
    4. UI Components & State: `test: ... (red)` → `feat: ... (green)`
- **Running Tests Live**:
  - Run `npm test` in the terminal:
    Show **71 tests passing across 13 test files**.
  - Run `npm run test:coverage`:
    Show **86.3% overall line coverage**, with **100% coverage** on `orderService`, `menuService`, `statusTiming`, and `validation`.
- **Key Test Cases Highlighted**:
  - Fake timers in `statusTiming.test.ts` verifying time progression across exact millisecond boundaries.
  - Duplicate item line merging in `validation.test.ts`.
  - Cancellation prevention in `orderService.test.ts`.
  - Rate limiter bursting in `orders.test.ts`.

---

## Section 5: AI Collaboration, Critical Bugs Found & Solutions (11:00 – 13:15)

### 🎙️ Talking Points:
- **How AI Was Leveraged**:
  - Used AI as an iterative pair programmer to scaffold boilerplate, draft test cases, and implement contracts.
  - Kept a running audit log in `AI_LOG.md` documenting every prompt, architectural decision, and review step.
- **Specific Bugs Caught & Resolved**:
  1. *Peer Dependency Conflict*: Next.js 15 generated `@types/node@20`, but Vitest 5 required `@types/node@^22` matching the local runtime. Diagnosed and resolved via explicit version alignment.
  2. *Drizzle Schema Syntax*: AI originally generated `.not null()` with a space instead of `.notNull()`. Caught immediately by ESLint and the TypeScript parser.
  3. *Zod 4 Error Model*: In Zod 4, validation issues reside on `error.issues` rather than `error.errors`. Updated `errorResponse` to support both models safely.
  4. *Button Accessible Name*: In `MenuItemCard`, an verbose `aria-label` masked the simple button text required by the component test matcher. Cleaned up to ensure accessible, unambiguous naming.
  5. *Next.js 15 Route Context*: In Next.js 15 App Router, `context.params` is a Promise. Handled using `await context.params` on API routes and React `use(params)` in client components.

---

## Section 6: Production Deployment & Future Roadmap (13:15 – 15:00)

### 🎙️ Talking Points:
- **Production Readiness**:
  - Run `npm run lint` → 0 warnings, 0 errors.
  - Run `npm run build` → Production optimized bundle generated cleanly.
- **Deployment Strategy**:
  - Vercel for instant edge deployment of the Next.js App Router.
  - Neon PostgreSQL for serverless database persistence via `DATABASE_URL` and `drizzle-kit push`.
- **What I Would Improve With More Time**:
  - **Edge Pub/Sub (Upstash Redis / Pusher)**: For instant cross-region WebSocket broadcasting across thousands of simultaneous browser sessions.
  - **Payment Integration**: Stripe Elements with webhook signature validation for authorization, capture, and cancellation refunds.
  - **Geolocation Tracking**: Real-time driver bike simulation moving along simulated GPS waypoints on an interactive Mapbox canvas.
- **Wrap-up & Thank You**:
  - Thank the hiring team for the opportunity and invite them to review the code, tests, and documentation.
