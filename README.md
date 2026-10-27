# 💸 Financial Habit Builder & Wealth Growth Tracker (WealthHabit)

> **Institutional-grade personal finance, behavioural habit tracking, savings milestones, and asset portfolio analytics.**

WealthHabit bridges the critical gap between daily financial micro-habits and long-term net worth accumulation. It empowers individuals to manage cash flows, develop compounding positive fiscal routines, track tangible savings goals, and analyze multi-asset portfolio distributions through a unified, high-performance responsive interface.

<p align="center">
  <b>💰 Finance Tracking • 🔥 Habit Building • 🎯 Goal Planning • 📈 Wealth Growth</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5.3.1-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.19.2-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_8.4-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/JWT-Protected-blueviolet?style=flat-square" alt="JWT" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

---

### 🚀 Live Production & Evaluator Access

| Resource | URL | Status |
| :--- | :--- | :--- |
| **Live Web App** | [https://yashraool.github.io/Habit-Builder-Wealth-Growth-Tracker/login](https://yashraool.github.io/Habit-Builder-Wealth-Growth-Tracker/login) | ![Active](https://img.shields.io/badge/Status-Online-brightgreen?style=flat-square) |
| **Backend API** | [https://wealthhabit-backend.onrender.com/api/health](https://wealthhabit-backend.onrender.com/api/health) | ![Active](https://img.shields.io/badge/Status-Live_Render-blue?style=flat-square) |

#### 🔑 Ready-to-Use Demo Credentials
- **Admin Access:** `admin@finance.app` / `Password123!` or Google Login (`yashhraool9@gmail.com`)
- **Member Access:** `alex@finance.app` / `Password123!` or Google Login (`alex.johnson@gmail.com`)
*(All demo accounts include pre-seeded 90-day transactions, 84-day habit heatmaps, savings goals, and investment assets.)*

---

## 🌐 Overview

### 👤 User Capabilities
- **Income & Expense Tracking:** Log income and expense records with category tagging, search, multi-condition filtering, and pagination.
- **Micro-Habit Consistency:** Build positive monetary routines (e.g., zero impulse buys, daily logging, emergency transfers) with 7-day visual strips, 30-day activity calendars, streak calculations, and one-click check-ins.
- **Target Savings Milestones:** Define target dates, priority tags, and dedicated contribution modals with automated progress percentage indicators.
- **Multi-Asset Wealth Portfolio:** Monitor cash reserves, equity positions, crypto holdings, and real estate allocations with historical valuations and interactive net-worth trajectory charts.
- **User Support & Feedback:** Direct feedback submission mechanism for platform enhancements, bug reporting, and feature suggestions.

### 🛡️ Admin Capabilities
- **Executive Platform Telemetry:** View total registered accounts, transaction volume totals, active habits, completed savings milestones, and aggregate platform wealth.
- **User Administration:** Inspect member registries, adjust active account states, and manage user roles.
- **Feedback Moderation Pipeline:** Review community bug reports, update ticket progression statuses (`open`, `in_progress`, `resolved`), and record internal administrative notes.

---

## ✨ Core Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>📊 Financial Dashboard</h3>
      <ul>
        <li>Real-time net worth calculation, monthly inflow/outflow, and savings rate.</li>
        <li>Interactive monthly expense breakdown and income vs. expense cash flow charts.</li>
        <li>Active habit streak indicators and upcoming savings goal deadlines at a glance.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>💳 Money & Transaction Management</h3>
      <ul>
        <li>Granular categorization across essential living costs, discretionary spend, and income streams.</li>
        <li>Real-time search, category filters, type toggles, and sorting controls.</li>
        <li>Modal-based transaction authoring and instant summary metrics aggregation.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🔥 Financial Habits & Streaks</h3>
      <ul>
        <li>Configurable daily, weekly, and monthly routines with financial impact tags.</li>
        <li>Interactive 7-day quick check-in strip and rolling 30-day historical compliance grid.</li>
        <li>Automated current and best streak counters to motivate compounding consistency.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🎯 Financial Savings Goals</h3>
      <ul>
        <li>Target date calculations, required monthly contribution estimates, and status badges.</li>
        <li>Direct milestone contribution modal with instant progress bar synchronization.</li>
        <li>Celebratory completion markers and goal status management.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📈 Wealth & Asset Portfolio</h3>
      <ul>
        <li>Multi-asset inventory supporting Cash, Stocks, Crypto, Real Estate, and Retirement accounts.</li>
        <li>Interactive asset allocation pie chart and 6-month/1-year portfolio valuation trends.</li>
        <li>Asset valuation updates with automatic net worth recalculation.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Admin Console & Moderation</h3>
      <ul>
        <li>Platform-wide KPI telemetry cards with real-time aggregates.</li>
        <li>Account roster with role management and status toggling.</li>
        <li>Feedback ticketing system with triage statuses and admin resolution notes.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🖥️ Product Preview

### Dashboard Architecture Wireframe

```text
+---------------------------------------------------------------------------------------+
|  WEALTHHABIT INSTITUTIONAL CONSOLE                      [Alex Johnson] [Logout]       |
+-------------------+-------------------------------------------------------------------+
|  [NAV SIDEBAR]    |  [FINANCIAL OVERVIEW KPI CARDS]                                   |
|  - Dashboard      |  +----------------+ +----------------+ +----------------+ +----+  |
|  - Transactions   |  | Net Worth      | | Monthly Income | | Monthly Spend  | |Rate|  |
|  - Habits         |  | $142,500.00    | | +$8,250.00     | | -$3,410.00     | | 58%|  |
|  - Goals          |  +----------------+ +----------------+ +----------------+ +----+  |
|  - Wealth         |                                                                   |
|  - Feedback       |  [RECHARTS ANALYTICS VIEW]                                        |
|  - Admin (RBAC)   |  +---------------------------------+ +-------------------------+  |
|                   |  | Cash Flow Trend (Income/Expense)| | Expense Allocation Donut|  |
|  [1-Click Switch] |  | [Area / Bar Chart Visualization]| | [Category Distribution] |  |
|  * Admin Console  |  +---------------------------------+ +-------------------------+  |
|  * Standard User  |                                                                   |
|                   |  [ACTIVE HABIT STREAKS]             [SAVINGS TARGETS PROGRESS]    |
|  [Profile & Theme]|  | * Log Daily Spend   [7-Day: ●●●●●] | Emergency Fund  [78% ████░] |
|  * USD / Dark Mode|  | * No Impulse Buys   [Streak: 14d]| House Downpay   [42% ██░░░] |
+-------------------+-------------------------------------------------------------------+
```

### Screenshot Asset Tree
```text
docs/screenshots/
├── 01_login_evaluator_access.png       # Login with 1-click evaluator credential chips
├── 02_executive_dashboard.png          # KPI cards, Recharts cashflow, and habit strip
├── 03_transaction_ledger.png           # Filterable, paginated transaction ledger
├── 04_habit_activity_map.png           # 7-day check-in strip & 30-day compliance matrix
├── 05_savings_goals_progress.png       # Target milestone cards with contribution modal
├── 06_wealth_portfolio_allocation.png  # Multi-asset breakdown & net-worth trend
└── 07_admin_telemetry_console.png      # Platform metrics, user roles & feedback triage
```

---

## 🧠 Product Philosophy

```text
               +------------------------------------------------+
               |               WEALTH ACCUMULATION              |
               |       Long-term multi-asset compounding        |
               +-----------------------^------------------------+
                                       |
               +-----------------------+------------------------+
               |                 SAVINGS GOALS                  |
               |      Dedicated capital allocation milestones   |
               +-----------------------^------------------------+
                                       |
               +-----------------------+------------------------+
               |               FINANCIAL HABITS                 |
               |       Daily behavioural discipline & routines   |
               +-----------------------^------------------------+
                                       |
               +-----------------------+------------------------+
               |               CASH FLOW CONTROL                |
               |      Transparent income and expense tracking   |
               +------------------------------------------------+
```

1. **Cash Flow Control:** Awareness precedes improvement. Categorizing every dollar creates operational clarity.
2. **Financial Habits:** Wealth is the downstream byproduct of daily micro-decisions. Small daily streaks build massive compounding returns.
3. **Savings Goals:** Purpose-driven milestone earmarking prevents capital leakage into impulse consumption.
4. **Wealth Portfolio:** Transforming saved cash into diversified asset ownership drives financial independence.

---

## ⚙️ Tech Stack

### Frontend
| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Core Framework** | React | `18.3.1` | Declarative component UI library |
| **Build Tool** | Vite | `5.3.1` | Next-generation frontend tooling and HMR |
| **Styling** | Tailwind CSS | `3.4.4` | Utility-first CSS framework with design tokens |
| **Routing** | React Router DOM | `6.23.1` | Client-side routing with RBAC guards |
| **Icons** | Lucide React | `0.395.0` | Clean, modern feather icon set |
| **Charts** | Recharts | `3.0.0` | Composable SVG analytics and financial charts |
| **State & HTTP** | React Context + Axios | `1.7.2` | Global auth/toast context and API transport |
| **Date Utilities** | date-fns | `3.6.0` | Modern, lightweight date manipulation |

### Backend
| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | `>= 18` | Asynchronous event-driven JavaScript runtime |
| **Web Server** | Express.js | `4.19.2` | REST API micro-framework |
| **Security** | Helmet + CORS | `7.1.0` / `2.8.5` | Secure HTTP headers and cross-origin resource sharing |
| **Rate Limiter** | express-rate-limit | `7.3.1` | Endpoint DDoS and brute-force mitigation |
| **Validation** | express-validator | `7.1.0` | Schema validation and input sanitation |
| **Authentication** | JWT (`jsonwebtoken`) | `9.0.2` | Stateless bearer token authentication |
| **Password Hashing** | bcryptjs | `2.4.3` | Salted 12-round password hashing |
| **Logger** | Morgan | `1.10.0` | HTTP request logging middleware |

### Database & Seeding
| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Primary Database** | MongoDB Atlas / Local | `>= 6.0` | NoSQL document database |
| **ODM** | Mongoose | `8.4.1` | Schema definition, validation, and queries |
| **Fallback Engine** | `mongodb-memory-server` | `11.2.0` | Zero-config in-memory database for Render & local dev |
| **Auto-Seeder** | `server/seed/seed.js` | Built-in | Automated demo database initialization |

---

## 🏗️ System Architecture

```text
[ Client Tier: React 18 + Vite + Tailwind CSS ]
   |
   | HTTPS Requests / Bearer JWT
   v
[ Gateway Tier: Express REST API ]
   |-- Security: Helmet, CORS, Rate Limiters (15/15m auth, 300/15m general)
   |-- Authentication: JWT Token Verification (auth.js)
   |-- Authorization: Role-Based Access Control (rbac.js -> 'admin' | 'user')
   |-- Controller Handlers:
   |     * authController.js       * transactionController.js
   |     * habitController.js      * goalController.js
   |     * wealthController.js     * adminController.js
   v
[ Data Tier: MongoDB Document Store ]
   |-- Managed by Mongoose 8.4
   |-- Models: User, Transaction, Habit, SavingsGoal, Asset, Feedback
   |-- Fallback: MongoMemoryServer with automatic database seeding
```

---

## 📁 Project Structure

```text
financial-habit-tracker/
├── package.json                   # Root orchestrator scripts
├── README.md                      # Comprehensive project documentation
├── client/                        # React Frontend (Vite)
│   ├── index.html                 # Single-page application template
│   ├── package.json               # Client dependencies and scripts
│   ├── vite.config.js             # Vite configuration and proxy rules
│   ├── tailwind.config.js         # Tailwind typography, colors, and shadows
│   └── src/
│       ├── main.jsx               # Application bootstrap
│       ├── App.jsx                # Route declarations & provider nesting
│       ├── api/                   # Modular Axios API service callers
│       │   ├── auth.js            # Authentication endpoints
│       │   ├── transactions.js    # Transaction CRUD & summary
│       │   ├── habits.js          # Habit streak & check-in APIs
│       │   ├── goals.js           # Goals & contribution endpoints
│       │   ├── wealth.js          # Asset & net worth analytics
│       │   └── admin.js           # Platform metrics & moderation
│       ├── components/
│       │   ├── layout/            # Layout, Navbar, Sidebar, PageHeader, ProfileModal
│       │   └── ui/                # Alert, Badge, Button, Card, Input, Modal, Skeleton, Spinner
│       ├── context/               # AuthContext (JWT/User state), ToastContext
│       ├── pages/                 # Full view pages
│       │   ├── Login.jsx          # Login with 1-click demo evaluator credentials
│       │   ├── Register.jsx       # Registration with validation
│       │   ├── Dashboard.jsx      # Financial overview & Recharts dashboard
│       │   ├── Transactions.jsx   # Ledger with search, filters & pagination
│       │   ├── Habits.jsx         # 7-day strip & 30-day activity map
│       │   ├── Goals.jsx          # Savings goals with contribution modal
│       │   ├── Wealth.jsx         # Asset portfolio & net worth chart
│       │   ├── Feedback.jsx       # User feedback submission form
│       │   ├── Admin.jsx          # Admin telemetry & moderation console
│       │   └── NotFound.jsx       # 404 handler
│       ├── routes/                # ProtectedRoute & AdminRoute guards
│       └── styles/                # tokens.css design system tokens
└── server/                        # Express Backend
    ├── index.js                   # Express server bootstrap & route mounting
    ├── package.json               # Server dependencies and scripts
    ├── .env.example               # Template environment configuration
    ├── seed/
    │   └── seed.js                # Database seeder (40+ items, Alex & Admin)
    └── src/
        ├── config/
        │   └── db.js              # Robust MongoDB connector with in-memory fallback
        ├── controllers/           # Business logic controllers
        ├── middleware/            # JWT auth, RBAC authorization, errorHandler
        ├── models/                # Mongoose schemas (User, Transaction, Habit, etc.)
        ├── routes/                # Express router modules
        └── utils/                 # Standard response formatting helpers
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `>= 18.x`
- **npm:** `>= 9.x`
- **MongoDB:** Local MongoDB instance running on port `27017` **OR** free MongoDB Atlas cluster *(optional: automated in-memory MongoDB will run automatically if no URI is supplied)*.

### 1. Clone the Repository
```bash
git clone https://github.com/YashRaool/Habit-Builder-Wealth-Growth-Tracker.git
cd Habit-Builder-Wealth-Growth-Tracker
```

### 2. Configure & Run Backend Server

```bash
cd server
npm install
```

Create a `.env` file in `server/` (or use the defaults):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/financial_habit_tracker
JWT_SECRET=super_secure_jwt_random_secret_key_production_grade_32_chars
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

Start the server:
```bash
# Development mode with hot reload:
npm run dev

# Or standard execution:
npm start
```
*Note: If local MongoDB is not running, the server automatically starts an in-memory database and seeds it with demo accounts.*

### 3. Configure & Run Frontend Client

In a new terminal window:
```bash
cd client
npm install
npm run dev
```

The application is now live at **`http://localhost:5173`**.

---

## 🔐 Demo Credentials

The platform includes pre-seeded demo accounts. The **Login screen includes 1-Click Demo Access buttons** to instantly prefill and evaluate both user roles.

| Role | Name | Email | Password | Access Level |
|---|---|---|---|---|
| **Evaluator User** | Alex Johnson | `alex@finance.app` | `Password123!` | Standard account with 40+ transactions, 4 habits, 3 goals, 4 assets |
| **System Admin** | Admin User | `admin@finance.app` | `Password123!` | Full platform telemetry, user administration, and feedback moderation |

---

## 🔌 REST API

All API endpoints are prefixed with `/api`. Protected routes require standard `Authorization: Bearer <jwt_token>` headers.

### 🔑 Authentication (`/api/auth`)
```http
POST   /api/auth/register          # Create new user account
POST   /api/auth/login             # Authenticate credentials & return JWT
GET    /api/auth/me                # Get authenticated user profile [Protected]
PUT    /api/auth/me                # Update name, currency, or preferences [Protected]
PUT    /api/auth/password          # Change account password [Protected]
```

### 💳 Transactions (`/api/transactions`)
```http
GET    /api/transactions           # List transactions (supports ?type=&category=&search=&page=&sort=)
GET    /api/transactions/summary   # Income, expense, and savings rate summary (?months=6)
GET    /api/transactions/:id       # Retrieve single transaction by ID
POST   /api/transactions           # Create new transaction record
PUT    /api/transactions/:id       # Update existing transaction
DELETE /api/transactions/:id       # Remove transaction record
```

### 🔥 Habits (`/api/habits`)
```http
GET    /api/habits                 # Retrieve user habits with current streaks
POST   /api/habits                 # Create new habit routine
GET    /api/habits/:id             # Get habit details
PUT    /api/habits/:id             # Update habit metadata
DELETE /api/habits/:id             # Delete habit routine
POST   /api/habits/:id/checkin     # Toggle habit check-in for a specific date
GET    /api/habits/:id/history     # Retrieve completion history for 30-day map
```

### 🎯 Savings Goals (`/api/goals`)
```http
GET    /api/goals                  # List savings goals (?status=active|completed)
POST   /api/goals                  # Create a new savings milestone
GET    /api/goals/:id              # Retrieve goal details
PUT    /api/goals/:id              # Update goal attributes
DELETE /api/goals/:id              # Delete savings milestone
POST   /api/goals/:id/contribute   # Add monetary contribution to goal
```

### 📈 Wealth & Assets (`/api/wealth`)
```http
GET    /api/wealth/net-worth       # Calculate aggregate net worth across all asset categories
GET    /api/wealth/history         # Valuation timeline (?period=6m|1y)
GET    /api/wealth/assets          # List asset portfolio holdings
POST   /api/wealth/assets          # Add an asset holding (Cash, Stocks, Crypto, etc.)
PUT    /api/wealth/assets/:id      # Update asset value or quantity
DELETE /api/wealth/assets/:id      # Remove asset record
```

### 💬 Feedback & Admin Console (`/api/admin`)
```http
POST   /api/admin/feedback         # Submit feedback or bug report [Any authenticated user]
GET    /api/admin/metrics          # Executive platform telemetry metrics [Admin only]
GET    /api/admin/users            # List all registered platform users [Admin only]
PUT    /api/admin/users/:id        # Update user status or assign role [Admin only]
DELETE /api/admin/users/:id        # Delete user account [Admin only]
GET    /api/admin/feedback         # View all community feedback tickets [Admin only]
PUT    /api/admin/feedback/:id     # Update ticket status & admin notes [Admin only]
```

### 🩺 Health Check
```http
GET    /api/health                 # Service availability & timestamp status
```

---

## 🔒 Security

- **Strict Passwords & Salting:** Passwords hashed with `bcryptjs` using 12 cost rounds; never stored in plaintext.
- **JWT Cryptography:** Signed tokens with configurable expirations and stateless Bearer validation.
- **HTTP Protection:** Powered by `helmet` to set secure Content-Security-Policy, HSTS, and XSS headers.
- **DDoS & Brute-Force Rate Limiting:** Separate rate-limiting tiers for authentication endpoints (15 req/15 min) and API queries (300 req/15 min).
- **Sanitized Inputs:** Handled with `express-validator` to eliminate malformed payloads and injection attacks.
- **Role-Based Guards:** Dual-layer RBAC route protection on both backend Express routers and frontend React routing.

---

## 📈 Roadmap

- [x] Full transaction ledger with search, filtering, and pagination.
- [x] Dynamic 7-day strip and rolling 30-day habit compliance grid.
- [x] Savings goals with interactive contribution modal.
- [x] Multi-asset portfolio breakdown and net-worth trend lines.
- [x] Admin console with platform telemetry and user moderation.
- [x] Automated in-memory fallback for zero-downtime production deploys.
- [ ] Automated recurring transaction schedules.
- [ ] CSV / Excel financial statement export.
- [ ] Live currency conversion integration.
- [ ] Push and email notification digests for habit streaks.

---

## 🤝 Contributing

Contributions are warmly welcomed! Please follow these steps:

1. **Fork the Repository:** Create a personal fork on GitHub.
2. **Create a Feature Branch:** `git checkout -b feature/AmazingFeature`
3. **Commit Your Changes:** `git commit -m 'feat: add AmazingFeature'`
4. **Push to the Branch:** `git push origin feature/AmazingFeature`
5. **Open a Pull Request:** Submit a PR detailing your changes.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for modern personal financial mastery.<br />
  <sub>WealthHabit &copy; 2026. All rights reserved.</sub>
</p>
