# System Architecture

## Overview

Media Center Management System is a full-stack application with:
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL
- **Deployment**: Docker + Render

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Render.com    │
                    │   (Hosting)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │Frontend │         │ Backend │         │Database │
   │(React)  │         │(Node.js)│         │(Postgres)│
   │Port 80  │         │Port 3000│         │Port 5432│
   └────┬────┘         └────┬────┘         └────┬────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                    HTTP/REST API
                    /api/portal/*
```

---

## Component Architecture

### Frontend (React + Vite)

```
portal-frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main component
│   ├── index.css              # Global styles
│   ├── api/
│   │   ├── client.ts         # Axios client
│   │   └── services.ts       # API endpoints
│   ├── components/
│   │   ├── Modal.tsx         # Modal component
│   │   ├── Navbar.tsx        # Navigation
│   │   └── LoadingSpinner.tsx # Loading indicator
│   └── pages/
│       ├── Home.tsx          # Home page
│       ├── Users.tsx         # Users management
│       ├── Desks.tsx         # Desks management
│       ├── Teams.tsx         # Teams management
│       ├── Programs.tsx      # Programs management
│       ├── Episodes.tsx      # Episodes management
│       ├── Guests.tsx        # Guests management
│       ├── Roles.tsx         # Roles management
│       └── ProgramRoles.tsx  # Program roles
├── Dockerfile                # Docker image
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS
└── package.json              # Dependencies
```

### Backend (Node.js + Express)

```
src/
├── index.ts                  # Entry point
├── config/
│   ├── database.ts          # Database connection
│   └── environment.ts       # Environment config
├── controllers/
│   └── portal-r/
│       ├── UserController.ts
│       ├── DeskController.ts
│       ├── TeamController.ts
│       ├── ProgramController.ts
│       ├── EpisodeController.ts
│       ├── GuestController.ts
│       ├── RoleController.ts
│       ├── ProgramRoleController.ts
│       ├── MediaUnitController.ts
│       ├── TeamUserController.ts
│       └── EpisodeGuestController.ts
├── services/
│   └── portal-r/
│       ├── UserService.ts
│       ├── DeskService.ts
│       ├── TeamService.ts
│       ├── ProgramService.ts
│       ├── EpisodeService.ts
│       ├── GuestService.ts
│       ├── RoleService.ts
│       ├── ProgramRoleService.ts
│       ├── MediaUnitService.ts
│       └── EpisodeGuestService.ts
├── models/
│   └── portal-r/
│       ├── User.ts
│       ├── Desk.ts
│       ├── Team.ts
│       ├── Program.ts
│       ├── Episode.ts
│       ├── Guest.ts
│       ├── Role.ts
│       ├── ProgramRole.ts
│       ├── MediaUnit.ts
│       └── EpisodeGuest.ts
├── routes/
│   └── portal-r/
│       ├── users.ts
│       ├── desks.ts
│       ├── teams.ts
│       ├── programs.ts
│       ├── episodes.ts
│       ├── guests.ts
│       ├── roles.ts
│       ├── program-roles.ts
│       ├── media-units.ts
│       ├── team-users.ts
│       ├── episode-guests.ts
│       └── index.ts
├── Dockerfile                # Docker image
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

### Database (PostgreSQL)

```
media_center
├── users
├── roles
├── desks
├── teams
├── team_users
├── programs
├── episodes
├── guests
├── episode_guests
├── program_roles
├── media_units
└── ... (40 tables total)
```

---

## Data Flow

### User Request Flow

```
1. User Action (Frontend)
   ↓
2. React Component
   ↓
3. API Service (axios)
   ↓
4. HTTP Request to Backend
   ↓
5. Express Route Handler
   ↓
6. Controller
   ↓
7. Service Layer
   ↓
8. Database Query
   ↓
9. PostgreSQL
   ↓
10. Response (JSON)
   ↓
11. Frontend Update
   ↓
12. UI Render
```

### Example: Get Users

```
Frontend                Backend              Database
   │                      │                      │
   ├─ GET /users ────────>│                      │
   │                      ├─ Query users ──────>│
   │                      │                      │
   │                      │<─ Return rows ──────┤
   │                      │                      │
   │<─ JSON Response ─────┤                      │
   │                      │                      │
   └─ Update UI           │                      │
```

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/portal
```

### Endpoints

#### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Desks
- `GET /desks` - Get all desks
- `GET /desks/:id` - Get desk by ID
- `POST /desks` - Create desk
- `PUT /desks/:id` - Update desk
- `DELETE /desks/:id` - Delete desk

#### Teams
- `GET /teams` - Get all teams
- `GET /teams/:id` - Get team by ID
- `POST /teams` - Create team
- `PUT /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team

#### Programs
- `GET /programs` - Get all programs
- `GET /programs/:id` - Get program by ID
- `POST /programs` - Create program
- `PUT /programs/:id` - Update program
- `DELETE /programs/:id` - Delete program

#### Episodes
- `GET /episodes` - Get all episodes
- `GET /episodes?program_id=X` - Get episodes by program
- `POST /episodes` - Create episode
- `PUT /episodes/:id` - Update episode
- `DELETE /episodes/:id` - Delete episode

#### Guests
- `GET /guests` - Get all guests
- `GET /guests/:id` - Get guest by ID
- `POST /guests` - Create guest
- `PUT /guests/:id` - Update guest
- `DELETE /guests/:id` - Delete guest

#### Roles
- `GET /roles` - Get all roles
- `GET /roles/:id` - Get role by ID
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

#### Program Roles
- `GET /program-roles` - Get all program roles
- `GET /program-roles?program_id=X` - Get roles by program
- `POST /program-roles` - Create program role
- `PUT /program-roles/:id` - Update program role
- `DELETE /program-roles/:id` - Delete program role

#### Episode Guests
- `GET /episode-guests` - Get all episode guests
- `GET /episode-guests?episode_id=X` - Get guests by episode
- `POST /episode-guests` - Add guest to episode
- `DELETE /episode-guests/:episodeId/:guestId` - Remove guest from episode

---

## Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js 18** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **pg** - Database driver

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Render** - Hosting platform

---

## Deployment Architecture

### Local Development
```
Docker Compose
├── PostgreSQL (Port 5432)
├── Backend (Port 3000)
└── Frontend (Port 5173)
```

### Production (Render)
```
Render Services
├── PostgreSQL Database
├── Web Service (Backend)
└── Static Site (Frontend)
```

---

## Security Considerations

1. **Environment Variables**
   - Database credentials
   - API keys
   - Sensitive configuration

2. **Database**
   - Connection pooling
   - Prepared statements
   - Input validation

3. **API**
   - CORS configuration
   - Request validation
   - Error handling

4. **Frontend**
   - XSS protection
   - CSRF tokens
   - Secure headers

---

## Performance Optimization

1. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching

2. **Backend**
   - Database indexing
   - Query optimization
   - Connection pooling
   - Response caching

3. **Docker**
   - Multi-stage builds
   - Layer caching
   - Image optimization

---

## Scalability

### Horizontal Scaling
- Multiple backend instances
- Load balancer
- Database replication

### Vertical Scaling
- Increase server resources
- Optimize queries
- Cache frequently accessed data

---

## Monitoring & Logging

### Logs
- Application logs
- Database logs
- Docker logs

### Metrics
- Response time
- Error rate
- Database performance
- Resource usage

---

## Backup & Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Backup verification

### Disaster Recovery
- Backup restoration
- Service recovery
- Data integrity checks

---

## Future Enhancements

1. **Authentication**
   - JWT tokens
   - OAuth integration
   - Role-based access control

2. **Caching**
   - Redis integration
   - Query caching
   - Session caching

3. **Search**
   - Elasticsearch integration
   - Full-text search
   - Advanced filtering

4. **Real-time**
   - WebSocket support
   - Live notifications
   - Real-time updates

---

## References

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Render Documentation](https://render.com/docs)
