/**
 * User Routes
 * Routes for user management
 */

import { Router } from 'express';
import { UserController } from '../../controllers/portal-r';

const router = Router();

/**
 * GET /users - Get all users
 */
router.get('/', UserController.getAllUsers);

/**
 * GET /users/:id - Get user by ID
 */
router.get('/:id', UserController.getUserById);

/**
 * GET /users/:id/with-role - Get user with role details
 */
router.get('/:id/with-role', UserController.getUserWithRole);

/**
 * GET /teams/:teamId/users - Get users by team
 */
router.get('/team/:teamId', UserController.getUsersByTeam);

/**
 * POST /users - Create a new user
 */
router.post('/', UserController.createUser);

/**
 * PUT /users/:id - Update a user
 */
router.put('/:id', UserController.updateUser);

/**
 * DELETE /users/:id - Delete a user
 */
router.delete('/:id', UserController.deleteUser);

export default router;
