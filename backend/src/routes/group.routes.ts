import { Router } from 'express';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../controllers/group.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requirePermission('/management/groups', 'read'), getGroups);
router.post('/', authenticate, requirePermission('/management/groups', 'write'), createGroup);
router.put('/:id', authenticate, requirePermission('/management/groups', 'write'), updateGroup);
router.delete('/:id', authenticate, requirePermission('/management/groups', 'write'), deleteGroup);

export default router;
