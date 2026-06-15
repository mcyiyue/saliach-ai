import { Router } from 'express';
import { getLinks, createLink, updateLink, deleteLink } from '../controllers/external-link.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// CRUD routes for ExternalLinks, protected by RBAC permissions for "/admin/external-links"
router.get('/', authenticate, requirePermission('/admin/external-links', 'read'), getLinks);
router.post('/', authenticate, requirePermission('/admin/external-links', 'write'), createLink);
router.put('/:id', authenticate, requirePermission('/admin/external-links', 'write'), updateLink);
router.delete('/:id', authenticate, requirePermission('/admin/external-links', 'write'), deleteLink);

export default router;
