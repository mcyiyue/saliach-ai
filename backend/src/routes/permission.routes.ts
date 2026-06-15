import { Router } from 'express';
import { getModules, getGroupPermissions, updateGroupPermissions } from '../controllers/permission.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/modules', authenticate, requirePermission('/management/permissions', 'read'), getModules);
router.get('/:groupId', authenticate, requirePermission('/management/permissions', 'read'), getGroupPermissions);
router.post('/:groupId', authenticate, requirePermission('/management/permissions', 'write'), updateGroupPermissions);

export default router;
