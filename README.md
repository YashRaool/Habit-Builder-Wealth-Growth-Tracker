# 💰 WealthHabit

### Financial Habit Builder & Wealth Growth Tracker

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20Website-success?style=for-the-badge)](https://yashraool.github.io/Habit-Builder-Wealth-Growth-Tracker/)

> **Build better financial habits. Track your money. Reach your goals. Grow your wealth.**

WealthHabit is a full-stack personal finance and wealth management platform designed to help users take control of their financial habits, monitor income and expenses, manage savings goals, track investments, and understand long-term wealth growth.

## 🚀 Live Demo

**Website:** https://yashraool.github.io/Habit-Builder-Wealth-Growth-Tracker/

## ✨ Features

- 📊 Financial dashboard with income, expenses, savings, investments, and analytics
- 💵 Income and expense tracking with categories and summaries
- 🎯 Financial goals with target amounts, deadlines, deposits, and progress tracking
- 🔥 Financial habit builder with daily check-ins and streak tracking
- 📈 Investment tracking and portfolio overview
- 🔐 JWT authentication, bcrypt password hashing, protected routes, and role-based access
- 🛠️ Admin dashboard for platform statistics, users, and feedback
- 💬 User feedback management
- 📱 Responsive modern UI for desktop and mobile

## 🧰 Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Recharts
- Heroicons

### Backend
- Node.js
- Express.js
- REST API
- JWT Authentication
- bcryptjs

### Database
- PostgreSQL

### Deployment
- GitHub Pages for the frontend
- GitHub Actions for automated frontend builds and deployments

## 🏗️ Architecture

```text
React + Vite + Tailwind CSS
          │
          │ REST API
          ▼
Node.js + Express.js
          │
          │ SQL
          ▼
      PostgreSQL
```

## 📁 Project Structure

```text
Habit-Builder-Wealth-Growth-Tracker/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── db.js
│   │   ├── index.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── .env.example
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm
- Git

### Clone

```bash
git clone https://github.com/YashRaool/Habit-Builder-Wealth-Growth-Tracker.git
cd Habit-Builder-Wealth-Growth-Tracker
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Configure your database connection and JWT secret in `.env` before starting the backend.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide the local frontend URL in the terminal.

## 🔐 Security

- Passwords are hashed with bcryptjs.
- Authentication uses JWT tokens.
- Protected routes enforce authenticated access.
- Role-based authorization separates user and admin functionality.
- Production secrets should be stored in environment variables and must never be committed.

## 📌 Deployment

The frontend is deployed automatically to GitHub Pages whenever changes are pushed to `main`.

Deployment workflow: `.github/workflows/deploy.yml`

Live site: https://yashraool.github.io/Habit-Builder-Wealth-Growth-Tracker/

## 🗺️ Roadmap

- [ ] Advanced financial analytics
- [ ] Net-worth tracking improvements
- [ ] Recurring income and expense support
- [ ] Investment performance analytics
- [ ] Financial reports and exports
- [ ] Notifications and reminders
- [ ] Automated testing
- [ ] Swagger/OpenAPI documentation

## 🤝 Contributing

Contributions and improvements are welcome. Create a feature branch, make your changes, run the relevant tests/build checks, and open a pull request.

## 📄 License

This project is currently intended for educational, portfolio, and development purposes.

## 👨‍💻 About

**WealthHabit** combines personal finance tracking, financial habit building, savings goals, investment tracking, and wealth analytics into one modern application.

**Built with ❤️ for better financial habits and smarter wealth management.**
