/**
 * Program Routes
 * Routes for program management
 */

import { Router } from 'express';
import { ProgramController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /programs - Get all programs
 */
router.get('/', ProgramController.getAllPrograms);

/**
 * GET /programs/:id - Get program by ID
 */
router.get('/:id', ProgramController.getProgramById);

/**
 * GET /programs/:id/with-episodes - Get program with episodes
 */
router.get('/:id/with-episodes', ProgramController.getProgramWithEpisodes);

/**
 * GET /programs/:id/with-roles - Get program with team members
 */
router.get('/:id/with-roles', ProgramController.getProgramWithRoles);

/**
 * POST /programs - Create a new program
 */
router.post('/', ProgramController.createProgram);

/**
 * PUT /programs/:id - Update a program
 */
router.put('/:id', ProgramController.updateProgram);

/**
 * DELETE /programs/:id - Delete a program
 */
router.delete('/:id', ProgramController.deleteProgram);

export default router;
