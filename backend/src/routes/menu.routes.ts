import { Router } from 'express';
import { getMenuTree } from '../controllers/menu.controller';
import { authenticate } from '../middleware/rbac.middleware';

const router = Router();

router.get('/tree', authenticate, getMenuTree);

export default router;
