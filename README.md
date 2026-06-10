# ApplyFlow Job Application Tracker

This repository contains a job application tracking system built as a modular monolith.

## Getting Started

### Backend
```bash
cd backend
dotnet restore
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
The backend is configured to use PostgreSQL in development via Docker Compose.

```bash
docker compose up -d
```

## Notes
- The backend uses ASP.NET Core Web API.
- The frontend is a React + TypeScript application created with Vite.
- Authentication is handled with JWT tokens.
