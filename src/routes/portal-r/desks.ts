/**
 * Desk Routes
 * Routes for desk management
 */

import { Router } from 'express';
import { DeskController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /desks - Get all desks
 */
router.get('/', DeskController.getAllDesks);

/**
 * GET /desks/:id - Get desk by ID
 */
router.get('/:id', DeskController.getDeskById);

/**
 * GET /desks/:id/with-teams - Get desk with teams
 */
router.get('/:id/with-teams', DeskController.getDeskWithTeams);

/**
 * POST /desks - Create a new desk
 */
router.post('/', DeskController.createDesk);

/**
 * PUT /desks/:id - Update a desk
 */
router.put('/:id', DeskController.updateDesk);

/**
 * DELETE /desks/:id - Delete a desk
 */
router.delete('/:id', DeskController.deleteDesk);

export default router;
