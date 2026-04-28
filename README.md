# 🎬 Media Center Management System

نظام متكامل لإدارة مركز الإعلام الداخلي — من الفكرة حتى الأرشفة.

**Production:** [media-center-management-system.onrender.com](https://media-center-management-system.onrender.com)

---

## 🏗️ Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt + Role-Based Permissions
- **Real-time:** Socket.IO (WebSocket)
- **Deployment:** Render

---

## 🎯 Features

### ✅ Orders & Tasks Management
- Full CRUD with status lifecycle: `Created → Pending → In Progress → Review → Done → Cancelled`
- Task assignment, reassignment, bulk operations
- Comments, attachments, task dependencies (circular detection via DFS)
- Auto order status update based on task completion
- Deadline validation (task deadline cannot exceed order deadline)
- Order close validation (requires completed tasks + content)

### ✅ Shooting Management
- Create shooting events linked to orders/tasks
- Source type tracking (internal/external)
- Enriched views with derived status from linked task

### ✅ Content & Archive
- Content creation (direct or from shooting pipeline)
- Batch content creation from single shooting (report + social + video)
- Unified search & filter: `GET /api/content?keyword=&type=&status=&creator=&from=&to=&archived=`
- Auto-archive when `is_final = true`
- Reuse tracking: count, history, analytics (most reused content)
- Tags management

### ✅ KPI & Analytics Dashboard
- Dashboard summary with date range filter
- Monthly trends comparison
- Per-user, per-order, per-task KPI
- Top performers leaderboard
- Reuse statistics
- Recalculate endpoints (single + bulk)

### ✅ Authentication & Permissions
- JWT-based authentication (24h token expiry)
- Multi-role per user (via `user_roles` table)
- 24 granular permissions across 9 categories
- DB-based permission checking (not hardcoded roles)
- Admin-only: KPI dashboard, user management, role management

### ✅ Real-time Notifications
- WebSocket (Socket.IO) for instant delivery
- DB persistence for offline users
- Auto-triggers: task assigned, status changed, content uploaded, deadline approaching
- Unread count + mark as read

### ✅ Portal (Setup & Configuration)
- Desks, Teams, Team Members
- Users, Roles, Media Units
- Programs, Episodes, Guests
- Program Roles (presenter, producer, etc.)
- Episode enrichment (derived status from order, guest count, content count)

---

## 📊 API Overview

| Module | Endpoints | Auth Required |
|--------|-----------|---------------|
| Auth | 5 | Partial (login is public) |
| Orders | 23 | Yes + orders.* permissions |
| Tasks | 28 | Yes + tasks.* permissions |
| Shootings | 11 | Yes + shootings.* permissions |
| Content & Archive | 18 | Yes + content.* permissions |
| KPI & Dashboard | 11 | Yes + kpi.view (admin only) |
| Notifications | 5 | Yes |
| Permissions | 6 | Yes + roles.manage (admin only) |
| Portal | ~80 | Yes |
| **Total** | **~187** | |

---

## 🔄 Core Workflow

```
1. Login → JWT Token + WebSocket connection
2. Create Order (linked to program/episode)
3. Create Tasks → Assign to employees
4. Execute: Shooting → Content Pipeline (or direct upload)
5. Content becomes final → Auto-archived
6. KPI auto-calculated (task + order + user)
7. Real-time notifications to stakeholders
8. Dashboard shows everything to management
```

---

## 🔗 Integration with News & AI System

The system integrates with a separate News & AI Hub system on the same database:
- Shared authentication (same JWT)
- News editing tasks execute in the news system
- Published articles import as content linked to tasks
- AI usage tracked per user for KPI
- See `docs/INTEGRATION-PLAN.md` for details

---

## 📁 Project Structure

```
src/
├── config/          # Database & environment config
├── controllers/
│   ├── management/  # Orders, Tasks, Shootings, Content, KPI, Auth, Notifications, Permissions
│   └── portal-r/    # Desks, Teams, Users, Programs, Episodes, Guests
├── middleware/       # JWT auth + permission checking
├── models/
│   ├── management/  # Order, Task, Shooting, Desk, Team, User, Role, MediaUnit, ProgramRole
│   └── content/     # Content, Program, Episode, Guest
├── routes/
│   ├── management/  # All management API routes
│   └── portal-r/    # All portal API routes
├── services/
│   ├── management/  # Business logic, automation, KPI, auth, permissions, notifications
│   └── portal-r/    # Portal services (using unified models)
├── types/           # TypeScript interfaces + DTOs
└── index.ts         # Express + HTTP server + Socket.IO
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET

# Run migrations
npx ts-node scripts/run-single-migration.ts <migration_file>

# Seed admin password
npx ts-node scripts/seed-admin.ts

# Development
npm run dev

# Production build
npm run build && npm start
```

---
