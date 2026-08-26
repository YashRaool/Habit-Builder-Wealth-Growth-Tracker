# WealthHabit

**Financial Habit Builder & Wealth Growth Tracker**

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database setup
```bash
createdb wealthhabit
psql wealthhabit < backend/src/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env       # edit DATABASE_URL + JWT_SECRET
npm install
npm run seed               # seed demo data
npm run dev                # API on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                # UI on http://localhost:5173
```

## Demo accounts (after seed)
| Email | Password | Role |
|-------|----------|------|
| alex@wealthhabit.dev | Password123! | user |
| maya@wealthhabit.dev | Password123! | user |
| admin@wealthhabit.dev | Admin123! | admin |

## API Endpoints
| Method | Path | Auth |
|--------|------|------|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET | /api/auth/me | user |
| GET/POST/PUT/DELETE | /api/income | user |
| GET/POST/PUT/DELETE | /api/expenses | user |
| GET | /api/expenses/summary | user |
| GET/POST/PUT/DELETE | /api/habits | user |
| GET | /api/habits/:id/logs | user |
| POST | /api/habits/:id/checkin | user |
| GET/POST/PUT/DELETE | /api/goals | user |
| PATCH | /api/goals/:id/deposit | user |
| GET/POST/PUT/DELETE | /api/investments | user |
| GET/POST | /api/feedback | user |
| GET | /api/admin/stats | admin |
| GET | /api/admin/users | admin |
| GET/PATCH | /api/admin/feedback | admin |
