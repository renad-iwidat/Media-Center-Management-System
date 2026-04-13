/**
 * Guest Routes
 * Routes for guest management
 */

import { Router } from 'express';
import { GuestController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /guests - Get all guests
 */
router.get('/', GuestController.getAllGuests);

/**
 * GET /guests/:id - Get guest by ID
 */
router.get('/:id', GuestController.getGuestById);

/**
 * GET /guests/search - Search guests by name
 */
router.get('/search', GuestController.searchGuests);

/**
 * POST /guests - Create a new guest
 */
router.post('/', GuestController.createGuest);

/**
 * PUT /guests/:id - Update a guest
 */
router.put('/:id', GuestController.updateGuest);

/**
 * DELETE /guests/:id - Delete a guest
 */
router.delete('/:id', GuestController.deleteGuest);

export default router;
