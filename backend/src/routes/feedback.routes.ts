import { Router } from 'express';
import { submitFeedback, getFeedbacks, resolveFeedback, deleteFeedback } from '../controllers/feedback.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// Endpoint for users to submit feedback (no read permission required, just auth or public depending on design)
// Since chat requires auth, we just authenticate.
router.post('/', authenticate, submitFeedback);

// Endpoints for admin to view and resolve feedbacks
// We require read/write permission to the /admin/feedbacks module (we will define this module)
router.get('/', authenticate, requirePermission('/admin/feedbacks', 'read'), getFeedbacks);
router.put('/:id/resolve', authenticate, requirePermission('/admin/feedbacks', 'write'), resolveFeedback);
router.delete('/:id', authenticate, requirePermission('/admin/feedbacks', 'write'), deleteFeedback);

export default router;
