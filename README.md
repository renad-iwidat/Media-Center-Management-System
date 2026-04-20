# 🎬 Media Center Management System

A comprehensive, system for managing media center operations including orders, tasks, content production, and more.



## 🎯 Features

### Orders Management
- ✅ Create, read, update, delete orders
- ✅ Status management with validation
- ✅ Progress calculation
- ✅ Deadline validation
- ✅ Auto-status updates based on tasks
- ✅ Order history tracking
- ✅ Filtering by desk, status, program

### Tasks Management
- ✅ Create, read, update, delete tasks
- ✅ Status management with validation
- ✅ Task assignment and reassignment
- ✅ Comments and attachments
- ✅ Task relations and dependencies
- ✅ Circular dependency prevention
- ✅ Progress calculation
- ✅ Bulk operations
- ✅ Overdue detection

### Business Logic
- ✅ Dynamic status ID fetching
- ✅ Status transition validation
- ✅ Deadline validation
- ✅ Dependency validation
- ✅ Delete prevention rules
- ✅ Auto-status updates

---

## 📊 API Endpoints

### Orders (19 endpoints)
```
POST   /api/orders                    - Create order
GET    /api/orders                    - Get all orders
GET    /api/orders/:id                - Get single order
PUT    /api/orders/:id                - Update order
DELETE /api/orders/:id                - Delete order
PATCH  /api/orders/:id/status         - Change status
PATCH  /api/orders/:id/cancel         - Cancel order
GET    /api/orders/statuses           - Get statuses
GET    /api/orders/:id/history        - Get history
GET    /api/orders/desk/:deskId       - Filter by desk
GET    /api/orders/status/:statusId   - Filter by status
GET    /api/orders/program/:programId - Filter by program
GET    /api/orders/:id/progress       - Calculate progress
GET    /api/orders/:id/deadline       - Validate deadline
GET    /api/orders/:id/can-delete     - Check if deletable
GET    /api/orders/:id/details        - Get with details
PATCH  /api/orders/:id/auto-status    - Auto-update status
```

### Tasks (31 endpoints)
```
POST   /api/tasks                     - Create task
GET    /api/tasks                     - Get all tasks
GET    /api/tasks/:id                 - Get single task
PUT    /api/tasks/:id                 - Update task
DELETE /api/tasks/:id                 - Delete task
PATCH  /api/tasks/:id/status          - Change status
GET    /api/tasks/statuses            - Get statuses
GET    /api/tasks/:id/history         - Get history
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
GET    /api/tasks/order/:orderId      - Filter by order
GET    /api/tasks/assignee/:userId    - Filter by assignee
GET    /api/tasks/status/:statusId    - Filter by status
GET    /api/tasks/overdue             - Get overdue tasks
GET    /api/tasks/:id/progress        - Calculate progress
GET    /api/tasks/:id/can-delete      - Check if deletable
POST   /api/tasks/bulk-assign         - Bulk assign
POST   /api/tasks/bulk-status         - Bulk change status
GET    /api/tasks/:id/details         - Get with details
```

---


**Status**: ✅ COMPLETE

---
