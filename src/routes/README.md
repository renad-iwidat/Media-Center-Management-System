# API Routes

## Overview

All API routes are organized by module for better maintainability and scalability.

## Structure

```
routes/
├── index.ts              - Main router (combines all modules)
├── management/
│   ├── index.ts         - Management module router
│   ├── orders.ts        - Order endpoints
│   ├── tasks.ts         - Task endpoints
│   └── README.md        - Management routes documentation
└── README.md            - This file
```

## Base URL

All API endpoints are prefixed with `/api`:

```
http://localhost:3000/api/...
```

## Available Routes

### Management Module

#### Orders
```
POST   /api/orders                    - Create order
GET    /api/orders                    - Get all orders
GET    /api/orders/:id                - Get single order
PUT    /api/orders/:id                - Update order
DELETE /api/orders/:id                - Delete order
PATCH  /api/orders/:id/status         - Change status
PATCH  /api/orders/:id/cancel         - Cancel order
GET    /api/orders/statuses           - Get all statuses
GET    /api/orders/:id/history        - Get status history
GET    /api/orders/desk/:deskId       - Get by desk
GET    /api/orders/status/:statusId   - Get by status
GET    /api/orders/program/:programId - Get by program
GET    /api/orders/:id/progress       - Calculate progress
GET    /api/orders/:id/deadline       - Validate deadline
GET    /api/orders/:id/can-delete     - Check if deletable
GET    /api/orders/:id/details        - Get with details
PATCH  /api/orders/:id/auto-status    - Auto-update status
```

#### Tasks
```
POST   /api/tasks                     - Create task
GET    /api/tasks                     - Get all tasks
GET    /api/tasks/:id                 - Get single task
PUT    /api/tasks/:id                 - Update task
DELETE /api/tasks/:id                 - Delete task
PATCH  /api/tasks/:id/status          - Change status
GET    /api/tasks/statuses            - Get all statuses
GET    /api/tasks/:id/history         - Get status history
POST   /api/tasks/:id/assign          - Assign task
POST   /api/tasks/:id/reassign        - Reassign task
GET    /api/tasks/:id/assignments     - Get assignments
POST   /api/tasks/:id/comments        - Add comment
GET    /api/tasks/:id/comments        - Get comments
POST   /api/tasks/:id/attachments     - Add attachment
GET    /api/tasks/:id/attachments     - Get attachments
POST   /api/tasks/:id/relations       - Add relation
GET    /api/tasks/:id/relations       - Get relations
GET    /api/tasks/:id/dependency      - Validate dependency
GET    /api/tasks/order/:orderId      - Get by order
GET    /api/tasks/assignee/:userId    - Get by assignee
GET    /api/tasks/status/:statusId    - Get by status
GET    /api/tasks/overdue             - Get overdue tasks
GET    /api/tasks/:id/progress        - Calculate progress
GET    /api/tasks/:id/can-delete      - Check if deletable
POST   /api/tasks/bulk-assign         - Bulk assign
POST   /api/tasks/bulk-status         - Bulk change status
GET    /api/tasks/:id/details         - Get with details
```

## Health Check

```
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```

## Query Parameters

### Pagination
```
?limit=10&offset=0
```

### Filtering
```
?status=active&desk=1
```

## Route Organization

Routes are organized by:
1. **Module** - Management, Content, Users, etc.
2. **Resource** - Orders, Tasks, etc.
3. **Operation** - CRUD, Status, Filtering, etc.

## Adding New Routes

1. Create a new file in the appropriate module folder
2. Define routes using Express Router
3. Import and use in the module's index.ts
4. Update this README

Example:
```typescript
// src/routes/management/newResource.ts
import { Router } from 'express';
import { NewResourceController } from '../../controllers/management/NewResourceController';

const router = Router();
const controller = new NewResourceController();

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/', (req, res) => controller.create(req, res));

export default router;
```

Then in `src/routes/management/index.ts`:
```typescript
import newResourceRouter from './newResource';
router.use('/newresource', newResourceRouter);
```

## Testing Routes

### Using curl
```bash
# Get all orders
curl http://localhost:3000/api/orders

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","desk_id":"1",...}'

# Get single order
curl http://localhost:3000/api/orders/1
```

### Using Postman
1. Import the API collection
2. Set base URL to `http://localhost:3000/api`
3. Test endpoints with provided examples

## Error Handling

All routes include error handling:
- Missing required fields → 400 Bad Request
- Resource not found → 404 Not Found
- Business logic errors → 400 Bad Request
- Server errors → 500 Internal Server Error

## Next Steps

1. Add authentication middleware
2. Add request validation middleware
3. Add rate limiting
4. Add logging middleware
5. Add CORS configuration
6. Create API documentation (Swagger/OpenAPI)

---
