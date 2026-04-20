# Management Routes

## Overview

Management routes handle all order and task management endpoints.

## Structure

```
management/
├── index.ts      - Main management router
├── orders.ts     - Order endpoints
├── tasks.ts      - Task endpoints
└── README.md     - This file
```

## Base Path

All management routes are under `/api`:

```
/api/orders/...
/api/tasks/...
```

## Order Routes

### CRUD Operations

#### Create Order
```
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
  "deadline": "2026-05-01",
  "program_id": "1",
  "episode_id": "1"
}
```

#### Get All Orders
```
GET /api/orders?limit=10&offset=0
```

#### Get Single Order
```
GET /api/orders/:id
```

#### Update Order
```
PUT /api/orders/:id
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "deadline": "2026-05-15"
}
```

#### Delete Order
```
DELETE /api/orders/:id
```

### Status Management

#### Change Status
```
PATCH /api/orders/:id/status
Content-Type: application/json

{
  "status_id": "3",
  "changed_by": "1"
}
```

#### Cancel Order
```
PATCH /api/orders/:id/cancel
Content-Type: application/json

{
  "cancelled_by": "1",
  "reason": "Project cancelled"
}
```

#### Get Statuses
```
GET /api/orders/statuses
```

#### Get History
```
GET /api/orders/:id/history
```

### Filtering & Search

#### Get by Desk
```
GET /api/orders/desk/:deskId?limit=10&offset=0
```

#### Get by Status
```
GET /api/orders/status/:statusId?limit=10&offset=0
```

#### Get by Program
```
GET /api/orders/program/:programId?limit=10&offset=0
```

### Business Logic

#### Calculate Progress
```
GET /api/orders/:id/progress

Response:
{
  "total": 5,
  "completed": 3,
  "inProgress": 1,
  "pending": 1,
  "percentage": 60
}
```

#### Validate Deadline
```
GET /api/orders/:id/deadline

Response:
{
  "isValid": true,
  "violations": []
}
```

#### Check if Deletable
```
GET /api/orders/:id/can-delete

Response:
{
  "canDelete": true,
  "reason": null
}
```

#### Get with Details
```
GET /api/orders/:id/details

Response:
{
  "id": "1",
  "title": "...",
  "tasks": [...],
  "progress": {...},
  "history": [...]
}
```

#### Auto-update Status
```
PATCH /api/orders/:id/auto-status
Content-Type: application/json

{
  "changed_by": "1"
}
```

---

## Task Routes

### CRUD Operations

#### Create Task
```
POST /api/tasks
Content-Type: application/json

{
  "title": "Film the interview",
  "description": "Film the interview with guest",
  "order_id": "1",
  "assigned_to": "5",
  "status_id": "1",
  "priority_id": "2",
  "deadline": "2026-04-25",
  "task_type_id": "1"
}
```

#### Get All Tasks
```
GET /api/tasks?limit=10&offset=0
```

#### Get Single Task
```
GET /api/tasks/:id
```

#### Update Task
```
PUT /api/tasks/:id
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "deadline": "2026-04-30"
}
```

#### Delete Task
```
DELETE /api/tasks/:id
```

### Status Management

#### Change Status
```
PATCH /api/tasks/:id/status
Content-Type: application/json

{
  "status_id": "3",
  "changed_by": "1"
}
```

#### Get Statuses
```
GET /api/tasks/statuses
```

#### Get History
```
GET /api/tasks/:id/history
```

### Assignment Management

#### Assign Task
```
POST /api/tasks/:id/assign
Content-Type: application/json

{
  "assigned_to": "5",
  "assigned_by": "1"
}
```

#### Reassign Task
```
POST /api/tasks/:id/reassign
Content-Type: application/json

{
  "new_user_id": "6",
  "assigned_by": "1"
}
```

#### Get Assignments
```
GET /api/tasks/:id/assignments
```

### Comments & Attachments

#### Add Comment
```
POST /api/tasks/:id/comments
Content-Type: application/json

{
  "user_id": "1",
  "comment": "This is a comment"
}
```

#### Get Comments
```
GET /api/tasks/:id/comments
```

#### Add Attachment
```
POST /api/tasks/:id/attachments
Content-Type: application/json

{
  "user_id": "1",
  "file_url": "https://example.com/file.pdf",
  "file_type": "pdf"
}
```

#### Get Attachments
```
GET /api/tasks/:id/attachments
```

### Relations & Dependencies

#### Add Relation
```
POST /api/tasks/:id/relations
Content-Type: application/json

{
  "related_task_id": "2",
  "relation_type": "depends_on"
}
```

#### Get Relations
```
GET /api/tasks/:id/relations
```

#### Validate Dependency
```
GET /api/tasks/:id/dependency

Response:
{
  "canStart": true,
  "blockedBy": [],
  "reason": null
}
```

### Filtering & Search

#### Get by Order
```
GET /api/tasks/order/:orderId?limit=10&offset=0
```

#### Get by Assignee
```
GET /api/tasks/assignee/:userId?limit=10&offset=0
```

#### Get by Status
```
GET /api/tasks/status/:statusId?limit=10&offset=0
```

#### Get Overdue Tasks
```
GET /api/tasks/overdue
```

### Business Logic

#### Calculate Progress
```
GET /api/tasks/:id/progress

Response:
{
  "status": "In Progress",
  "percentage": 50
}
```

#### Check if Deletable
```
GET /api/tasks/:id/can-delete

Response:
{
  "canDelete": true,
  "reason": null
}
```

#### Bulk Assign
```
POST /api/tasks/bulk-assign
Content-Type: application/json

{
  "task_ids": ["1", "2", "3"],
  "user_id": "5",
  "assigned_by": "1"
}

Response:
{
  "success": 3,
  "failed": 0,
  "errors": []
}
```

#### Bulk Change Status
```
POST /api/tasks/bulk-status
Content-Type: application/json

{
  "task_ids": ["1", "2", "3"],
  "status_id": "3",
  "changed_by": "1"
}

Response:
{
  "success": 3,
  "failed": 0,
  "errors": []
}
```

#### Get with Details
```
GET /api/tasks/:id/details

Response:
{
  "id": "1",
  "title": "...",
  "comments": [...],
  "attachments": [...],
  "relations": [...],
  "assignments": [...],
  "progress": {...},
  "history": [...]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields",
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Order not found: 999",
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```

---

## Testing

### Using curl

```bash
# Get all orders
curl http://localhost:3000/api/orders

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Order",
    "desk_id": "1",
    "status_id": "1",
    "priority_id": "2",
    "media_unit_id": "1",
    "created_by": "1"
  }'

# Get single order
curl http://localhost:3000/api/orders/1

# Change order status
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status_id": "3",
    "changed_by": "1"
  }'
```

### Using Postman

1. Create a new collection
2. Add requests for each endpoint
3. Use the examples above as request bodies
4. Test with different parameters

---
