import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import ingestRoutes from './routes/ingest.routes';
import chatRoutes from './routes/chat.routes';
import externalLinkRoutes from './routes/external-link.routes';
import userRoutes from './routes/user.routes';
import groupRoutes from './routes/group.routes';
import permissionRoutes from './routes/permission.routes';
import feedbackRoutes from './routes/feedback.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/external-links', externalLinkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
