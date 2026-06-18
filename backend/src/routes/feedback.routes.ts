import { Router } from 'express';
import { submitFeedback, getFeedbacks, resolveFeedback } from '../controllers/feedback.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// Endpoint for users to submit feedback (no read permission required, just auth or public depending on design)
// Since chat requires auth, we just authenticate.
router.post('/', authenticate, submitFeedback);

// Endpoints for admin to view and resolve feedbacks
// We require read/write permission to the /admin/evaluasi-ai module (we will define this module)
router.get('/', authenticate, requirePermission('/admin/evaluasi-ai', 'read'), getFeedbacks);
router.put('/:id/resolve', authenticate, requirePermission('/admin/evaluasi-ai', 'write'), resolveFeedback);

export default router;
