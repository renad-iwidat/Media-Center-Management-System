import { Router } from 'express';
import { TeamUserController } from '../../controllers/portal-r';

const router = Router();

// GET /team-users?team_id=X or ?user_id=X
router.get('/', TeamUserController.getUsersByTeam);

// POST /team-users
router.post('/', TeamUserController.addUserToTeam);

// DELETE /team-users/:teamId/:userId
router.delete('/:teamId/:userId', TeamUserController.removeUserFromTeam);

export default router;
