# Media Center Management System - Setup Guide

## 📋 Overview

This is a complete media center management system with a backend API and a modern React frontend. It allows you to manage:
- Employees and their schedules
- Programs and episodes
- Guests and their information
- Desks and teams organization
- Editorial policies

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## 📦 Backend Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=5000
NODE_ENV=development
```

### 3. Database Connection

The database connection is already configured. The system will:
- Connect to PostgreSQL using the `DATABASE_URL`
- Use existing tables (40 tables already in the database)
- Add missing columns if needed

### 4. Start Backend Server

```bash
npm run dev
```

The backend will start on `http://localhost:5000`

Health check: `http://localhost:5000/health`

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd portal-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in `portal-frontend/`:

```env
VITE_API_URL=http://localhost:5000/api/portal
```

### 4. Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🚀 Running Both Servers

### Terminal 1 - Backend
```bash
npm run dev
```

### Terminal 2 - Frontend
```bash
cd portal-frontend
npm run dev
```

## 📚 API Endpoints

All endpoints are prefixed with `/api/portal`

### Desks
- `GET /desks` - Get all desks
- `GET /desks/:id` - Get desk by ID
- `POST /desks` - Create desk
- `PUT /desks/:id` - Update desk
- `DELETE /desks/:id` - Delete desk

### Teams
- `GET /teams` - Get all teams
- `GET /teams/:id` - Get team by ID
- `POST /teams` - Create team
- `PUT /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team

### Users (Employees)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Programs
- `GET /programs` - Get all programs
- `GET /programs/:id` - Get program by ID
- `POST /programs` - Create program
- `PUT /programs/:id` - Update program
- `DELETE /programs/:id` - Delete program

### Episodes
- `GET /episodes` - Get all episodes
- `GET /episodes/:id` - Get episode by ID
- `POST /episodes` - Create episode
- `PUT /episodes/:id` - Update episode
- `DELETE /episodes/:id` - Delete episode

### Guests
- `GET /guests` - Get all guests
- `GET /guests/:id` - Get guest by ID
- `POST /guests` - Create guest
- `PUT /guests/:id` - Update guest
- `DELETE /guests/:id` - Delete guest
- `GET /guests/search?name=...` - Search guests by name

### Program Roles
- `GET /program-roles` - Get all program roles
- `GET /program-roles/:id` - Get program role by ID
- `POST /program-roles` - Create program role
- `PUT /program-roles/:id` - Update program role
- `DELETE /program-roles/:id` - Delete program role

### Editorial Policies
- `GET /policies` - Get all policies
- `GET /policies/:id` - Get policy by ID
- `POST /policies` - Create policy
- `PUT /policies/:id` - Update policy
- `DELETE /policies/:id` - Delete policy

## 🧪 Testing

Run tests for backend services:

```bash
npm run test
```

Run specific test file:

```bash
npm run test -- src/tests/portal-r/UserService.test.ts
```

Clean up test data:

```bash
npm run cleanup:test
```

## 📁 Project Structure

```
.
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── tests/           # Test files
│   ├── utils/           # Utility functions
│   └── index.ts         # Entry point
├── portal-frontend/     # React frontend
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main app
│   └── package.json
├── package.json
├── tsconfig.json
└── DATABASE_SCHEMA.md   # Database schema documentation
```

## 🔧 Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run cleanup:test` - Clean up test data

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 Database Schema

The system uses 40 existing tables in PostgreSQL. Key tables include:
- `desks` - Desk/Department information
- `teams` - Team information
- `users` - Employee information
- `programs` - Program information
- `episodes` - Episode information
- `guests` - Guest information
- `program_roles` - User roles in programs
- `editorial_policies` - Editorial policies

See `DATABASE_SCHEMA.md` for complete schema details.

## 🐛 Troubleshooting

### Backend won't start
- Check if PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check if port 5000 is available

### Frontend can't connect to API
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### Database connection errors
- Verify PostgreSQL credentials
- Check if database exists
- Ensure network connectivity to database

## 📞 Support

For issues or questions, check:
1. Backend logs in terminal
2. Browser console for frontend errors
3. Database connection status

## 📄 License

ISC
