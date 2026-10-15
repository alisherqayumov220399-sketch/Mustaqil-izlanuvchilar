import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getDatabase,
  getRevision,
  mutateDatabase,
  addActivity
} from '../data/dbManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .slice(0, 50);
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${uniqueSuffix}_${safeBase}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.zip', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Faqat ruxsat etilgan fayl formatlari: ${allowed.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

/* ============================================================
   1. SYNC & REVISION ENDPOINTS
   ============================================================ */

/**
 * GET /api/sync
 * Barcha ma'lumotlar va reviziya raqamini olish
 */
router.get('/sync', (req, res) => {
  try {
    const db = getDatabase();
    res.json({
      success: true,
      revision: db.revision,
      lastModified: db.lastModified,
      data: {
        accounts: db.accounts || [],
        researchers: db.researchers || [],
        expertiseCases: db.expertiseCases || [],
        monitoringFiles: db.monitoringFiles || [],
        monitoringReports: db.monitoringReports || [],
        kengashFiles: db.kengashFiles || [],
        postDefenseFiles: db.postDefenseFiles || [],
        activityLog: db.activityLog || [],
        normativeDocuments: db.normativeDocuments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/sync/version
 * Tezkor reviziya tekshiruvi (Polling uchun)
 */
router.get('/sync/version', (req, res) => {
  try {
    const rev = getRevision();
    res.json({ success: true, ...rev });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/sync
 * To'liq yoki qisman sinxronizatsiya
 */
router.post('/sync', (req, res) => {
  try {
    const { collections, actorName, actorAction } = req.body;
    if (!collections || typeof collections !== 'object') {
      return res.status(400).json({ success: false, message: "collections obyekti talab qilinadi" });
    }

    const result = mutateDatabase((db) => {
      const allowedKeys = [
        'accounts',
        'researchers',
        'expertiseCases',
        'monitoringFiles',
        'monitoringReports',
        'kengashFiles',
        'postDefenseFiles',
        'activityLog',
        'normativeDocuments'
      ];

      for (const key of allowedKeys) {
        if (Array.isArray(collections[key])) {
          db[key] = collections[key];
        }
      }

      if (actorName && actorAction) {
        const newEntry = {
          id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: actorName,
          action: actorAction,
          time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        };
        db.activityLog = [newEntry, ...(db.activityLog || [])].slice(0, 30);
      }
    });

    const db = getDatabase();
    res.json({
      success: true,
      revision: result.revision,
      lastModified: result.lastModified,
      data: db
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ============================================================
   2. FILE UPLOAD & DOWNLOAD ENDPOINTS
   ============================================================ */

/**
 * POST /api/upload
 * Har qanday ruxsat etilgan faylni serverga yuklash
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Fayl biriktirilmadi!" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const result = {
      fileUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    const { category, username, researcherName } = req.body;
    if (researcherName && category) {
      addActivity(researcherName, `${category} uchun fayl yukladi: ${req.file.originalname}`);
    }

    res.status(201).json({
      success: true,
      message: "Fayl serverga muvaffaqiyatli yuklandi!",
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/download/:filename
 * Faylni brauzer orqali yuklab olish majburlash
 */
router.get('/download/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Fayl serverda topilmadi!" });
    }
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ============================================================
   3. AUTHENTICATION ENDPOINTS
   ============================================================ */

/**
 * POST /api/auth/login
 */
router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = String(username || '').trim();

    if (cleanUser === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        user: { role: 'admin', username: 'admin', name: 'Administrator' }
      });
    }

    const db = getDatabase();
    const account = (db.accounts || []).find(
      (a) => a.username.toLowerCase() === cleanUser.toLowerCase() && a.password === password
    );

    if (account) {
      return res.json({
        success: true,
        user: { role: 'researcher', ...account }
      });
    }

    res.status(401).json({
      success: false,
      message: 'Foydalanuvchi logini yoki parol noto‘g‘ri!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/update-password
 */
router.post('/auth/update-password', (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ success: false, message: "Username va yangi parol talab qilinadi" });
    }

    let found = false;
    mutateDatabase((db) => {
      db.accounts = (db.accounts || []).map((acc) => {
        if (acc.username.toLowerCase() === username.toLowerCase()) {
          found = true;
          return { ...acc, password: newPassword };
        }
        return acc;
      });
    });

    if (!found) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi hisobi topilmadi" });
    }

    res.json({ success: true, message: "Parol muvaffaqiyatli yangilandi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ============================================================
   4. POST-DEFENSE SPECIFIC STATUS & UPLOAD
   ============================================================ */

router.put('/post-defense/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!['Qabul qilindi', 'Rad etildi', 'Kutilmoqda'].includes(status)) {
      return res.status(400).json({ success: false, message: "Noto'g'ri holat!" });
    }

    let targetDoc = null;
    mutateDatabase((db) => {
      db.postDefenseFiles = (db.postDefenseFiles || []).map((doc) => {
        if (doc.id === id) {
          targetDoc = {
            ...doc,
            status,
            rejectReason: status === 'Rad etildi' ? (rejectReason || '').trim() : '',
            reviewedAt: new Date().toISOString()
          };
          return targetDoc;
        }
        return doc;
      });
    });

    if (!targetDoc) {
      return res.status(404).json({ success: false, message: "Hujjat topilmadi" });
    }

    addActivity(
      'Administrator',
      `Himoyadan keyingi hujjat holati o'zgartirildi: ${targetDoc.name} -> ${status}`
    );

    res.json({ success: true, data: targetDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ============================================================
   5. KENGASH / SEMINAR STATUS
   ============================================================ */

router.put('/kengash/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    let targetDoc = null;
    mutateDatabase((db) => {
      db.kengashFiles = (db.kengashFiles || []).map((doc) => {
        if (doc.id === id) {
          targetDoc = {
            ...doc,
            status,
            rejectReason: status === 'Rad etildi' ? (rejectReason || '').trim() : ''
          };
          return targetDoc;
        }
        return doc;
      });
    });

    if (!targetDoc) {
      return res.status(404).json({ success: false, message: "Hujjat topilmadi" });
    }

    addActivity(
      'Administrator',
      `Seminar/Kengash hujjati holati: ${targetDoc.name || 'Hujjat'} -> ${status}`
    );

    res.json({ success: true, data: targetDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
