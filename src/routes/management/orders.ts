import { Router, Request, Response } from 'express';
import { OrderController } from '../../controllers/management/OrderController';

/**
 * Order Routes
 * 
 * All routes for order management:
 * - CRUD operations
 * - Status management
 * - Filtering and search
 * - Business logic endpoints
 */

const router = Router();
const orderController = new OrderController();

// ============ CRUD Operations ============

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', (req: Request, res: Response) => {
  orderController.createOrder(req, res);
});

/**
 * GET /api/orders/:id
 * Get a single order by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  orderController.getOrder(req, res);
});

/**
 * GET /api/orders
 * Get all orders with pagination
 */
router.get('/', (req: Request, res: Response) => {
  orderController.getAllOrders(req, res);
});

/**
 * PUT /api/orders/:id
 * Update an order
 */
router.put('/:id', (req: Request, res: Response) => {
  orderController.updateOrder(req, res);
});

/**
 * DELETE /api/orders/:id
 * Delete an order
 */
router.delete('/:id', (req: Request, res: Response) => {
  orderController.deleteOrder(req, res);
});

// ============ Status Management ============

/**
 * PATCH /api/orders/:id/status
 * Change order status
 */
router.patch('/:id/status', (req: Request, res: Response) => {
  orderController.changeOrderStatus(req, res);
});

/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order (soft delete)
 */
router.patch('/:id/cancel', (req: Request, res: Response) => {
  orderController.cancelOrder(req, res);
});

/**
 * GET /api/orders/statuses
 * Get all available order statuses
 */
router.get('/statuses', (req: Request, res: Response) => {
  orderController.getOrderStatuses(req, res);
});

/**
 * GET /api/orders/:id/history
 * Get order status change history
 */
router.get('/:id/history', (req: Request, res: Response) => {
  orderController.getOrderHistory(req, res);
});

// ============ Filtering & Search ============

/**
 * GET /api/orders/desk/:deskId
 * Get orders by desk
 */
router.get('/desk/:deskId', (req: Request, res: Response) => {
  orderController.getOrdersByDesk(req, res);
});

/**
 * GET /api/orders/status/:statusId
 * Get orders by status
 */
router.get('/status/:statusId', (req: Request, res: Response) => {
  orderController.getOrdersByStatus(req, res);
});

/**
 * GET /api/orders/program/:programId
 * Get orders by program
 */
router.get('/program/:programId', (req: Request, res: Response) => {
  orderController.getOrdersByProgram(req, res);
});

// ============ Business Logic ============

/**
 * GET /api/orders/:id/progress
 * Calculate order progress
 */
router.get('/:id/progress', (req: Request, res: Response) => {
  orderController.calculateOrderProgress(req, res);
});

/**
 * GET /api/orders/:id/deadline
 * Validate order deadline
 */
router.get('/:id/deadline', (req: Request, res: Response) => {
  orderController.validateOrderDeadline(req, res);
});

/**
 * GET /api/orders/:id/can-delete
 * Check if order can be deleted
 */
router.get('/:id/can-delete', (req: Request, res: Response) => {
  orderController.canDeleteOrder(req, res);
});

/**
 * GET /api/orders/:id/details
 * Get order with all details (tasks, progress, history)
 */
router.get('/:id/details', (req: Request, res: Response) => {
  orderController.getOrderWithDetails(req, res);
});

/**
 * PATCH /api/orders/:id/auto-status
 * Auto-update order status based on task statuses
 */
router.patch('/:id/auto-status', (req: Request, res: Response) => {
  orderController.updateOrderStatusBasedOnTasks(req, res);
});

// ============ KPI & Analytics ============

/**
 * GET /api/orders/:id/kpi
 * Get order KPI metrics
 */
router.get('/:id/kpi', (req: Request, res: Response) => {
  orderController.getOrderKPI(req, res);
});

/**
 * GET /api/orders/:id/statistics
 * Get order statistics with completion percentage
 */
router.get('/:id/statistics', (req: Request, res: Response) => {
  orderController.getOrderStatistics(req, res);
});

/**
 * GET /api/orders/:id/full-details
 * Get order with all relations, tasks, content, history, and KPI
 */
router.get('/:id/full-details', (req: Request, res: Response) => {
  orderController.getOrderFullDetails(req, res);
});

// ============ Archive ============

/**
 * POST /api/orders/:id/archive
 * Archive an order and its related content
 */
router.post('/:id/archive', (req: Request, res: Response) => {
  orderController.archiveOrder(req, res);
});

/**
 * GET /api/orders/all-with-kpi
 * Get all orders with their KPI data
 */
router.get('/all-with-kpi', (req: Request, res: Response) => {
  orderController.getAllOrdersWithKPI(req, res);
});

export default router;
