# Media Center Management System - Developer Guide

## 🏗️ Architecture Overview

### Backend Architecture
```
Express.js Server
├── Controllers (Handle HTTP requests)
├── Services (Business logic)
├── Models (Data structures)
├── Routes (API endpoints)
└── Database (PostgreSQL)
```

### Frontend Architecture
```
React + TypeScript
├── Pages (Full page components)
├── Components (Reusable components)
├── API (Axios client)
└── Styles (Tailwind CSS)
```

## 📂 Backend Structure

### `/src/config`
- `database.ts` - PostgreSQL connection pool
- `environment.ts` - Environment variables

### `/src/controllers/portal-r`
- `DeskController.ts` - Desk request handlers
- `TeamController.ts` - Team request handlers
- `UserController.ts` - User request handlers
- `ProgramController.ts` - Program request handlers
- `EpisodeController.ts` - Episode request handlers
- `GuestController.ts` - Guest request handlers
- `ProgramRoleController.ts` - Program role handlers
- `EditorialPolicyController.ts` - Policy handlers

### `/src/services/portal-r`
- `DeskService.ts` - Desk business logic
- `TeamService.ts` - Team business logic
- `UserService.ts` - User business logic
- `ProgramService.ts` - Program business logic
- `EpisodeService.ts` - Episode business logic
- `GuestService.ts` - Guest business logic
- `ProgramRoleService.ts` - Program role logic
- `EditorialPolicyService.ts` - Policy logic

### `/src/models/portal-r`
- `Desk.ts` - Desk interfaces and DTOs
- `Team.ts` - Team interfaces and DTOs
- `User.ts` - User interfaces and DTOs
- `Program.ts` - Program interfaces and DTOs
- `Episode.ts` - Episode interfaces and DTOs
- `Guest.ts` - Guest interfaces and DTOs
- `ProgramRole.ts` - Program role interfaces
- `EditorialPolicy.ts` - Policy interfaces

### `/src/routes/portal-r`
- `desks.ts` - Desk routes
- `teams.ts` - Team routes
- `users.ts` - User routes
- `programs.ts` - Program routes
- `episodes.ts` - Episode routes
- `guests.ts` - Guest routes
- `programRoles.ts` - Program role routes
- `editorialPolicies.ts` - Policy routes

## 🎨 Frontend Structure

### `/src/api`
- `client.ts` - Axios instance configuration
- `services.ts` - API endpoint definitions

### `/src/components`
- `Navbar.tsx` - Navigation component
- `Modal.tsx` - Reusable modal dialog
- `LoadingSpinner.tsx` - Loading indicator

### `/src/pages`
- `Home.tsx` - Dashboard/home page
- `Desks.tsx` - Desks and teams management
- `Users.tsx` - Employees management
- `Programs.tsx` - Programs and episodes management
- `Guests.tsx` - Guests management
- `Policies.tsx` - Editorial policies management

## 🔄 Data Flow

### Creating a Resource (Example: User)

1. **Frontend**
   ```
   User fills form → Click Save → API call
   ```

2. **API Call**
   ```
   POST /api/portal/users
   Body: { name, email, role_id, work_days, start_time, end_time }
   ```

3. **Backend**
   ```
   Route → Controller → Service → Database
   ```

4. **Response**
   ```
   { id, name, email, ..., created_at }
   ```

5. **Frontend**
   ```
   Update state → Re-render table
   ```

## 🧪 Testing

### Running Tests
```bash
npm run test
```

### Running Specific Test
```bash
npm run test -- src/tests/portal-r/UserService.test.ts
```

### Test Structure
Each service has a corresponding test file:
- `DeskService.test.ts` - 10 tests
- `UserService.test.ts` - 9 tests
- `ProgramService.test.ts` - 9 tests
- `GuestService.test.ts` - 8 tests
- `EpisodeService.test.ts` - 7 tests

### Cleaning Test Data
```bash
npm run cleanup:test
```

## 📝 Adding a New Feature

### Step 1: Create Model
```typescript
// src/models/portal-r/NewFeature.ts
export interface NewFeature {
  id: bigint;
  name: string;
  created_at: Date;
}

export interface CreateNewFeatureDTO {
  name: string;
}
```

### Step 2: Create Service
```typescript
// src/services/portal-r/NewFeatureService.ts
export class NewFeatureService {
  async getAll(): Promise<NewFeature[]> {
    const result = await this.pool.query('SELECT * FROM new_features');
    return result.rows;
  }
  // ... other methods
}
```

### Step 3: Create Controller
```typescript
// src/controllers/portal-r/NewFeatureController.ts
export class NewFeatureController {
  static async getAll(req: Request, res: Response) {
    try {
      const service = new NewFeatureService();
      const data = await service.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch' });
    }
  }
}
```

### Step 4: Create Routes
```typescript
// src/routes/portal-r/newFeatures.ts
import { Router } from 'express';
import { NewFeatureController } from '../../controllers/portal-r';

const router = Router();

router.get('/', NewFeatureController.getAll);
router.post('/', NewFeatureController.create);
// ... other routes

export default router;
```

### Step 5: Add to Main Router
```typescript
// src/routes/portal-r/index.ts
import newFeaturesRouter from './newFeatures';
router.use('/new-features', newFeaturesRouter);
```

### Step 6: Create Frontend Page
```typescript
// portal-frontend/src/pages/NewFeatures.tsx
export default function NewFeatures() {
  const [items, setItems] = useState([]);
  // ... component logic
}
```

### Step 7: Add to Navigation
```typescript
// portal-frontend/src/components/Navbar.tsx
<Link to="/new-features">New Features</Link>
```

## 🔐 Security Considerations

1. **Input Validation** - Validate all inputs in controllers
2. **SQL Injection** - Use parameterized queries (already done with pg)
3. **CORS** - Configured in backend
4. **Error Handling** - Don't expose sensitive errors
5. **Authentication** - Can be added later if needed

## 📊 Database Queries

### Common Patterns

**Get all records:**
```sql
SELECT * FROM table_name ORDER BY created_at DESC
```

**Get by ID:**
```sql
SELECT * FROM table_name WHERE id = $1
```

**Create:**
```sql
INSERT INTO table_name (col1, col2) VALUES ($1, $2) RETURNING *
```

**Update:**
```sql
UPDATE table_name SET col1 = $1 WHERE id = $2 RETURNING *
```

**Delete:**
```sql
DELETE FROM table_name WHERE id = $1
```

## 🚀 Deployment

### Build Backend
```bash
npm run build
npm run start
```

### Build Frontend
```bash
cd portal-frontend
npm run build
```

### Environment Variables for Production
```env
DATABASE_URL=postgresql://...
PORT=5000
NODE_ENV=production
```

## 📚 Dependencies

### Backend
- `express` - Web framework
- `pg` - PostgreSQL client
- `cors` - CORS middleware
- `helmet` - Security headers
- `dotenv` - Environment variables
- `typescript` - Type safety
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest

### Frontend
- `react` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `tailwindcss` - CSS framework
- `vite` - Build tool
- `typescript` - Type safety

## 🐛 Debugging

### Backend Debugging
```bash
# Add console.log statements
console.log('Debug info:', variable);

# Check logs in terminal
npm run dev
```

### Frontend Debugging
```bash
# Open browser DevTools (F12)
# Check Console tab for errors
# Use React DevTools extension
```

### Database Debugging
```bash
# Connect to PostgreSQL
psql -U user -d database_name

# Check tables
\dt

# Query data
SELECT * FROM table_name;
```

## 📖 Code Style

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Use async/await for promises
- Add JSDoc comments for functions

### React
- Use functional components
- Use hooks for state management
- Keep components small and focused
- Use TypeScript for props

### SQL
- Use parameterized queries
- Use meaningful table/column names
- Add indexes for frequently queried columns

## 🔗 API Documentation

See `SETUP_GUIDE.md` for complete API endpoint documentation.

## 📞 Contributing

1. Create a feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📄 License

ISC
