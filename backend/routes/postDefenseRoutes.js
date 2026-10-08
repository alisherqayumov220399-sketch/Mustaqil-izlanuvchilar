/**
 * Himoyadan keyingi hujjatlar marshrutlari va kontrollerlari (Express.js)
 * RESTful API endpoints:
 * 1. GET  /api/post-defense/requirements
 * 2. GET  /api/post-defense/my-documents
 * 3. POST /api/post-defense/upload
 * 4. GET  /api/post-defense/admin/all
 * 5. PUT  /api/post-defense/:id/status
 * 6. GET  /api/post-defense/:id/download
 */

import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { POST_DEFENSE_REQUIREMENTS, PostDefenseStatusEnum, createDocumentRecord } from '../models/PostDefenseDocument.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/post-defense');
const dataFile = path.join(__dirname, '../uploads/documents.json');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function loadDocuments() {
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(content || '[]');
    }
  } catch (e) {
    console.error('Error loading documents:', e);
  }
  return [];
}

function saveDocuments(docs) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving documents:', e);
  }
}

// Multer saqlash konfiguratsiyasi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `pd-${req.body.reqId || 'doc'}-${uniqueSuffix}${ext}`);
  }
});

// Fayl formatini tekshirish (.pdf, .doc, .docx, .zip)
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Faqat .pdf, .doc, .docx yoki .zip formatidagi fayllar qabul qilinadi!"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 60 * 1024 * 1024 } // 60MB gacha
});

/**
 * 1. GET /api/post-defense/requirements
 */
router.get('/requirements', (req, res) => {
  res.json({ success: true, data: POST_DEFENSE_REQUIREMENTS });
});

/**
 * 2. GET /api/post-defense/my-documents
 */
router.get('/my-documents', (req, res) => {
  try {
    const username = req.user?.username || req.query.username;
    const docs = loadDocuments();
    const userDocs = username ? docs.filter(d => d.username === username) : docs;
    res.json({ success: true, data: userDocs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. POST /api/post-defense/upload
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    const { reqId, username, researcherName } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Fayl biriktirilmadi!" });
    }

    const docDef = POST_DEFENSE_REQUIREMENTS.find(d => d.id === reqId);
    if (!docDef) {
      return res.status(400).json({ success: false, message: "Noto'g'ri hujjat turi!" });
    }

    const docs = loadDocuments();
    const documentRecord = createDocumentRecord({
      reqId,
      reqTitle: docDef.name,
      username: username || 'tadqiqotchi',
      researcherName: researcherName || username || 'Tadqiqotchi',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: PostDefenseStatusEnum.PENDING,
      rejectReason: '',
      uploadedAt: new Date().toISOString()
    });

    // Upsert: agar foydalanuvchi bu talabga avval fayl yuklagan bo'lsa yangilanadi
    const existingIndex = docs.findIndex(d => d.username === documentRecord.username && d.reqId === reqId);
    if (existingIndex >= 0) {
      docs[existingIndex] = documentRecord;
    } else {
      docs.push(documentRecord);
    }
    saveDocuments(docs);

    res.status(201).json({
      success: true,
      message: "Hujjat muvaffaqiyatli yuklandi!",
      data: documentRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 4. GET /api/post-defense/admin/all
 */
router.get('/admin/all', (req, res) => {
  try {
    const { status, search } = req.query;
    let docs = loadDocuments();

    if (status) {
      docs = docs.filter(d => d.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        (d.researcherName && d.researcherName.toLowerCase().includes(q)) ||
        (d.reqTitle && d.reqTitle.toLowerCase().includes(q)) ||
        (d.originalName && d.originalName.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 5. PUT /api/post-defense/:id/status
 */
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!['Qabul qilindi', 'Rad etildi'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Holat faqat 'Qabul qilindi' yoki 'Rad etildi' bo'lishi mumkin!"
      });
    }

    if (status === 'Rad etildi' && (!rejectReason || !rejectReason.trim())) {
      return res.status(400).json({
        success: false,
        message: "Hujjatni qaytarish uchun izoh / sabab kiritish majburiydir!"
      });
    }

    const docs = loadDocuments();
    const doc = docs.find(d => d.id === id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Hujjat topilmadi!" });
    }

    doc.status = status;
    doc.rejectReason = status === 'Rad etildi' ? rejectReason.trim() : '';
    doc.reviewedAt = new Date().toISOString();
    doc.history = doc.history || [];
    doc.history.push({
      action: status === 'Qabul qilindi' ? 'APPROVED' : 'REJECTED',
      timestamp: new Date().toISOString(),
      reason: doc.rejectReason
    });

    saveDocuments(docs);

    res.json({
      success: true,
      message: status === 'Qabul qilindi' ? "Hujjat tasdiqlandi!" : "Hujjat qaytarildi!",
      data: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 6. GET /api/post-defense/:id/download
 */
router.get('/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const docs = loadDocuments();
    const doc = docs.find(d => d.id === id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Hujjat topilmadi!" });
    }

    const filePath = path.join(uploadDir, doc.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Fayl diskda topilmadi!" });
    }

    res.download(filePath, doc.originalName);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
