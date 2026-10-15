import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import apiRoutes from './routes/apiRoutes.js';
import postDefenseRoutes from './routes/postDefenseRoutes.js';
import { initDatabase } from './data/dbManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Baza initsializatsiyasi
initDatabase();

// CORS sozlamalari (Internet va har qanday domendan kirish uchun)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Katta hajmdagi JSON va ma'lumotlar uchun
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Uploads statik papkasi (fayllarni to'g'ridan-to'g'ri ko'rish va yuklab olish)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Ilm+ Monitoring Real-Time API Server',
    environment: process.env.NODE_ENV || 'production',
    time: new Date().toISOString()
  });
});

// Asosiy API marshrutlari
app.use('/api', apiRoutes);
app.use('/api/post-defense', postDefenseRoutes);

// Agar loyiha build qilingan bo'lsa (dist mavjud bo'lsa), frontendni ham to'liq o'zi tarqatadi (Full-stack)
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  console.log(`[Ilm+] Frontend dist papkasi ulandi: ${distDir}`);
  app.use(express.static(distDir));

  // SPA fallback (barcha sahifalarni index.html ga yo'naltirish)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexHtml = path.join(distDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      next();
    }
  });
}

// 404 handler API lar uchun
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API marshruti topilmadi' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[Ilm+ Server xatosi]:', err);
  res.status(500).json({ success: false, message: err.message || 'Server xatosi yuz berdi' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(` [Ilm+] Server internet va lokal tarmoqda ishga tushdi!`);
  console.log(` Manzil: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(` API Sync: http://localhost:${PORT}/api/sync`);
  console.log(`========================================================`);
});
