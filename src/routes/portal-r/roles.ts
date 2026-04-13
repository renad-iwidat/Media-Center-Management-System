/**
 * Roles Routes
 * Handles all role-related endpoints
 */

import { Router } from 'express';
import { RoleController } from '../../controllers/portal-r';

const router = Router();

// Get all roles
router.get('/', RoleController.getAllRoles);

// Get role by ID
router.get('/:id', RoleController.getRoleById);

// Create a new role
router.post('/', RoleController.createRole);

// Update a role
router.put('/:id', RoleController.updateRole);

// Delete a role
router.delete('/:id', RoleController.deleteRole);

export default router;
