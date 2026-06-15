import { Router } from 'express';
import { chatStream } from '../controllers/chat.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// Endpoint dilindungi: harus punya hak akses read ke modul "/chat"
router.post('/stream', authenticate, requirePermission('/chat', 'read'), chatStream);

export default router;
