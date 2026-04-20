# Management Controllers

## Overview

Controllers handle HTTP requests and responses for the management module (Orders and Tasks).

## Structure

```
management/
├── OrderController.ts    - Handles all Order-related endpoints
├── TaskController.ts     - Handles all Task-related endpoints
└── README.md            - This file
```

## OrderController

### Responsibilities
- Create, read, update, delete orders
- Manage order status transitions
- Filter orders by desk, status, program
- Calculate order progress
- Validate order deadlines
- Auto-update order status based on tasks

### Key Methods

#### CRUD Operations
- `createOrder()` - POST /api/orders
- `getOrder()` - GET /api/orders/:id
- `getAllOrders()` - GET /api/orders
- `updateOrder()` - PUT /api/orders/:id
- `deleteOrder()` - DELETE /api/orders/:id

#### Status Management
- `changeOrderStatus()` - PATCH /api/orders/:id/status
- `cancelOrder()` - PATCH /api/orders/:id/cancel
- `getOrderStatuses()` - GET /api/orders/statuses
- `getOrderHistory()` - GET /api/orders/:id/history

#### Business Logic
- `calculateOrderProgress()` - GET /api/orders/:id/progress
- `validateOrderDeadline()` - GET /api/orders/:id/deadline
- `canDeleteOrder()` - GET /api/orders/:id/can-delete
- `getOrderWithDetails()` - GET /api/orders/:id/details
- `updateOrderStatusBasedOnTasks()` - PATCH /api/orders/:id/auto-status

## TaskController

### Responsibilities
- Create, read, update, delete tasks
- Manage task status transitions
- Handle task assignments and reassignments
- Manage comments and attachments
- Handle task relations and dependencies
- Filter tasks by order, assignee, status
- Bulk operations (assign, change status)

### Key Methods

#### CRUD Operations
- `createTask()` - POST /api/tasks
- `getTask()` - GET /api/tasks/:id
- `getAllTasks()` - GET /api/tasks
- `updateTask()` - PUT /api/tasks/:id
- `deleteTask()` - DELETE /api/tasks/:id

#### Status Management
- `changeTaskStatus()` - PATCH /api/tasks/:id/status
- `getTaskStatuses()` - GET /api/tasks/statuses
- `getTaskHistory()` - GET /api/tasks/:id/history

#### Assignment Management
- `assignTask()` - POST /api/tasks/:id/assign
- `reassignTask()` - POST /api/tasks/:id/reassign
- `getTaskAssignments()` - GET /api/tasks/:id/assignments

#### Comments & Attachments
- `addComment()` - POST /api/tasks/:id/comments
- `getComments()` - GET /api/tasks/:id/comments
- `addAttachment()` - POST /api/tasks/:id/attachments
- `getAttachments()` - GET /api/tasks/:id/attachments

#### Relations & Dependencies
- `addRelation()` - POST /api/tasks/:id/relations
- `getRelations()` - GET /api/tasks/:id/relations
- `validateTaskDependency()` - GET /api/tasks/:id/dependency

#### Business Logic
- `calculateTaskProgress()` - GET /api/tasks/:id/progress
- `canDeleteTask()` - GET /api/tasks/:id/can-delete
- `bulkAssignTasks()` - POST /api/tasks/bulk-assign
- `bulkChangeStatus()` - POST /api/tasks/bulk-status
- `getTaskWithDetails()` - GET /api/tasks/:id/details

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

## Request Examples

### Create Order
```bash
POST /api/orders
Content-Type: application/json

{
  "title": "Produce Episode 5",
  "description": "Production of episode 5",
  "desk_id": "1",
  "status_id": "1",
  "priority_id": "2",
  "media_unit_id": "1",
  "created_by": "1",
  "deadline": "2026-05-01"
}
```

### Create Task
```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "Film the interview",
  "description": "Film the interview with guest",
  "order_id": "1",
  "assigned_to": "5",
  "status_id": "1",
  "priority_id": "2",
  "deadline": "2026-04-25"
}
```

### Change Task Status
```bash
PATCH /api/tasks/1/status
Content-Type: application/json

{
  "status_id": "3",
  "changed_by": "1"
}
```

### Bulk Assign Tasks
```bash
POST /api/tasks/bulk-assign
Content-Type: application/json

{
  "task_ids": ["1", "2", "3"],
  "user_id": "5",
  "assigned_by": "1"
}
```

## Error Handling

Controllers handle errors gracefully:
- Missing required fields → 400 Bad Request
- Resource not found → 404 Not Found
- Business logic errors → 400 Bad Request
- Server errors → 500 Internal Server Error

## Usage

```typescript
import { OrderController } from './controllers/management/OrderController';
import { TaskController } from './controllers/management/TaskController';

const orderController = new OrderController();
const taskController = new TaskController();

// Use in routes
app.post('/api/orders', (req, res) => orderController.createOrder(req, res));
app.get('/api/orders/:id', (req, res) => orderController.getOrder(req, res));
// ... etc
```

## Next Steps

1. Create routes that use these controllers
2. Add middleware for validation
3. Add authentication middleware
4. Add error handling middleware
5. Test all endpoints

---
