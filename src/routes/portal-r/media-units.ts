/**
 * Media Units Routes
 */

import { Router } from 'express';
import { MediaUnitController } from '../../controllers/portal-r';

const router = Router();

// Get all media units
router.get('/', MediaUnitController.getAllMediaUnits);

// Get media unit by ID
router.get('/:id', MediaUnitController.getMediaUnitById);

// Create media unit
router.post('/', MediaUnitController.createMediaUnit);

// Update media unit
router.put('/:id', MediaUnitController.updateMediaUnit);

// Delete media unit
router.delete('/:id', MediaUnitController.deleteMediaUnit);

export default router;
