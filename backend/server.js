import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import postDefenseRoutes from './routes/postDefenseRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS sozlamalari
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads statik papkasi
const uploadDir = path.join(__dirname, 'uploads/post-defense');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Ilm+ Monitoring Backend API',
    time: new Date().toISOString()
  });
});

// Post-defense marshrutlari
app.use('/api/post-defense', postDefenseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API marshruti topilmadi' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Server xatosi' });
});

app.listen(PORT, () => {
  console.log(`[Ilm+] Backend API server ishga tushdi: http://localhost:${PORT}`);
  console.log(`[Ilm+] Health check: http://localhost:${PORT}/api/health`);
});
