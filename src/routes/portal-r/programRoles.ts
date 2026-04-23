/**
 * Program Role Routes
 * Routes for program role management
 */

import { Router } from 'express';
import { ProgramRoleController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /program-roles - Get all program roles
 */
router.get('/', ProgramRoleController.getAllProgramRoles);

/**
 * GET /program-roles/:id - Get program role by ID
 */
router.get('/:id', ProgramRoleController.getProgramRoleById);

/**
 * GET /programs/:programId/roles - Get roles by program
 */
router.get('/program/:programId', ProgramRoleController.getRolesByProgram);

/**
 * GET /users/:userId/roles - Get roles by user
 */
router.get('/user/:userId', ProgramRoleController.getRolesByUser);

/**
 * POST /program-roles - Create a new program role
 */
router.post('/', ProgramRoleController.createProgramRole);

/**
 * PUT /program-roles/:id - Update a program role
 */
router.put('/:id', ProgramRoleController.updateProgramRole);

/**
 * DELETE /program-roles/:id - Delete a program role
 */
router.delete('/:id', ProgramRoleController.deleteProgramRole);

/**
 * GET /programs/:programId/presenters - Get program presenters
 */
router.get('/program/:programId/presenters', ProgramRoleController.getProgramPresenters);

/**
 * GET /programs/:programId/producers - Get program producers
 */
router.get('/program/:programId/producers', ProgramRoleController.getProgramProducers);

export default router;
