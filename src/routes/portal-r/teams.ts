/**
 * Team Routes
 * Routes for team management
 */

import { Router } from 'express';
import { TeamController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /teams - Get all teams
 */
router.get('/', TeamController.getAllTeams);

/**
 * GET /teams/:id - Get team by ID
 */
router.get('/:id', TeamController.getTeamById);

/**
 * GET /desks/:deskId/teams - Get teams by desk
 */
router.get('/desk/:deskId', TeamController.getTeamsByDesk);

/**
 * POST /teams - Create a new team
 */
router.post('/', TeamController.createTeam);

/**
 * PUT /teams/:id - Update a team
 */
router.put('/:id', TeamController.updateTeam);

/**
 * DELETE /teams/:id - Delete a team
 */
router.delete('/:id', TeamController.deleteTeam);

/**
 * POST /teams/:id/members - Add user to team
 */
router.post('/:id/members', TeamController.addUserToTeam);

/**
 * DELETE /teams/:id/members/:userId - Remove user from team
 */
router.delete('/:id/members/:userId', TeamController.removeUserFromTeam);

/**
 * GET /teams/:id/members - Get team members
 */
router.get('/:id/members', TeamController.getTeamMembers);

export default router;
