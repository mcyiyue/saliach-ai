import { Router } from 'express';
import { 
  ingestDocument, 
  listDocuments, 
  deleteDocument, 
  updateDocument,
  ingestUnifiedFile
} from '../controllers/ingest.controller';
import { authenticate, requirePermission } from '../middleware/rbac.middleware';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit to 10MB
  }
});

const router = Router();

// Endpoint CRUD Dokumen Knowledge Base
router.post('/', authenticate, requirePermission('/admin/ingest', 'write'), ingestDocument);
router.post('/upload', authenticate, requirePermission('/admin/ingest', 'write'), upload.single('file'), ingestUnifiedFile);
router.get('/', authenticate, requirePermission('/admin/ingest', 'read'), listDocuments);
router.delete('/', authenticate, requirePermission('/admin/ingest', 'write'), deleteDocument);
router.put('/', authenticate, requirePermission('/admin/ingest', 'write'), updateDocument);

export default router;
