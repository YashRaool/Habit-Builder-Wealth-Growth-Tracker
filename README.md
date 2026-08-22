# Financial Habit Builder & Wealth Growth Tracker

A production-ready full-stack web application for tracking financial habits, transactions, savings goals, and wealth growth.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts + Lucide |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| State | React Context + Axios |

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running on `localhost:27017` (or update `MONGO_URI` in `server/.env`)

### 1. Install Dependencies

```bash
# Server
cd server
npm install

# Client (new terminal)
cd client
npm install
```

### 2. Configure Environment

`server/.env` is pre-configured for local development. Update `MONGO_URI` if using MongoDB Atlas.

### 3. Seed the Database

```bash
cd server
npm run seed
```

This creates:
- **admin@finance.app** / `Password123!` (Admin role)
- **alex@finance.app** / `Password123!` (User role)
- 40+ transactions spanning 3 months
- 4 active habits with streak history
- 3 savings goals with contributions
- 4 asset holdings with history snapshots

### 4. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── config/        # MongoDB connection
│   │   ├── models/        # Mongoose schemas
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # Auth, RBAC, error handling
│   │   └── utils/         # Response helpers
│   ├── seed/              # Database seed script
│   ├── index.js           # Express app entry
│   └── .env               # Environment variables
└── client/
    ├── src/
    │   ├── api/           # Axios + API modules
    │   ├── components/    # Reusable UI components
    │   │   ├── ui/        # Button, Card, Modal, Badge, etc.
    │   │   └── layout/    # Sidebar, Navbar, Layout
    │   ├── context/       # AuthContext, ToastContext
    │   ├── pages/         # Route-level page components
    │   └── routes/        # ProtectedRoute, AdminRoute
    └── index.html
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Authentication |
| `/register` | Account creation |
| `/dashboard` | Overview with charts and streaks |
| `/transactions` | CRUD with filters, search, pagination |
| `/habits` | Streak tracking with 7-day grid |
| `/goals` | Progress bars with contribution modal |
| `/wealth` | Net-worth chart, asset allocation |
| `/admin` | Platform metrics, user/feedback management |

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/transactions?type=&category=&search=&page=&sort=
GET    /api/transactions/summary?months=6
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id

GET    /api/habits
POST   /api/habits
POST   /api/habits/:id/checkin
GET    /api/habits/:id/history
PUT    /api/habits/:id
DELETE /api/habits/:id

GET    /api/goals?status=active|completed
POST   /api/goals
POST   /api/goals/:id/contribute
PUT    /api/goals/:id
DELETE /api/goals/:id

GET    /api/wealth/net-worth
GET    /api/wealth/history?period=6m|1y
GET    /api/wealth/assets
POST   /api/wealth/assets
PUT    /api/wealth/assets/:id
DELETE /api/wealth/assets/:id

GET    /api/admin/metrics        (admin only)
GET    /api/admin/users          (admin only)
PUT    /api/admin/users/:id      (admin only)
GET    /api/admin/feedback       (admin only)
PUT    /api/admin/feedback/:id   (admin only)
POST   /api/admin/feedback       (any user — submit feedback)
```
