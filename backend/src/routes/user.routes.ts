import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requirePermission('/management/users', 'read'), getUsers);
router.post('/', authenticate, requirePermission('/management/users', 'write'), createUser);
router.put('/:id', authenticate, requirePermission('/management/users', 'write'), updateUser);
router.delete('/:id', authenticate, requirePermission('/management/users', 'write'), deleteUser);

export default router;
