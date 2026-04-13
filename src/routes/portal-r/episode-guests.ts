/**
 * Episode Guest Routes
 * Routes for episode guest management
 */

import { Router } from 'express';
import { EpisodeGuestController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /episode-guests - Get all episode guests or filter by episode_id/guest_id
 */
router.get('/', EpisodeGuestController.getAllEpisodeGuests);

/**
 * POST /episode-guests - Create a new episode guest
 */
router.post('/', EpisodeGuestController.createEpisodeGuest);

/**
 * DELETE /episode-guests/:episodeId/:guestId - Delete an episode guest
 */
router.delete('/:episodeId/:guestId', EpisodeGuestController.deleteEpisodeGuest);

export default router;
