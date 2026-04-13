/**
 * Episode Routes
 * Routes for episode management
 */

import { Router } from 'express';
import { EpisodeController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /episodes - Get all episodes or by program_id query parameter
 */
router.get('/', (req, res) => {
  const { program_id } = req.query;
  if (program_id) {
    return EpisodeController.getEpisodesByProgram(req, res);
  }
  return EpisodeController.getAllEpisodes(req, res);
});

/**
 * GET /episodes/:id - Get episode by ID
 */
router.get('/:id', EpisodeController.getEpisodeById);

/**
 * GET /episodes/:id/with-guests - Get episode with guests
 */
router.get('/:id/with-guests', EpisodeController.getEpisodeWithGuests);

/**
 * POST /episodes - Create a new episode
 */
router.post('/', EpisodeController.createEpisode);

/**
 * PUT /episodes/:id - Update an episode
 */
router.put('/:id', EpisodeController.updateEpisode);

/**
 * DELETE /episodes/:id - Delete an episode
 */
router.delete('/:id', EpisodeController.deleteEpisode);

/**
 * POST /episodes/:id/guests - Add guest to episode
 */
router.post('/:id/guests', EpisodeController.addGuestToEpisode);

/**
 * DELETE /episodes/:id/guests/:guestId - Remove guest from episode
 */
router.delete('/:id/guests/:guestId', EpisodeController.removeGuestFromEpisode);

/**
 * GET /episodes/:id/guests - Get episode guests
 */
router.get('/:id/guests', EpisodeController.getEpisodeGuests);

export default router;
