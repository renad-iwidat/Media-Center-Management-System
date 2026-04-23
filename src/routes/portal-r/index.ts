/**
 * Portal Routes - Main Router
 * Combines all portal routes
 */

import { Router } from 'express';
import desksRouter from './desks';
import teamsRouter from './teams';
import usersRouter from './users';
import programsRouter from './programs';
import episodesRouter from './episodes';
import guestsRouter from './guests';
import programRolesRouter from './programRoles';
import rolesRouter from './roles';
import teamUsersRouter from './team-users';
import mediaUnitsRouter from './media-units';
import episodeGuestsRouter from './episode-guests';

const router = Router();

/**
 * Portal API Routes
 * Base path: /api/portal
 */

router.use('/desks', desksRouter);
router.use('/teams', teamsRouter);
router.use('/users', usersRouter);
router.use('/programs', programsRouter);
router.use('/episodes', episodesRouter);
router.use('/guests', guestsRouter);
router.use('/program-roles', programRolesRouter);
router.use('/roles', rolesRouter);
router.use('/team-users', teamUsersRouter);
router.use('/media-units', mediaUnitsRouter);
router.use('/episode-guests', episodeGuestsRouter);

export default router;
