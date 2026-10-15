import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INITIAL_RESEARCHERS,
  INITIAL_ACCOUNTS,
  INITIAL_MONITORING_REPORTS,
  INITIAL_MONITORING_FILES,
  INITIAL_KENGASH_FILES,
  INITIAL_POST_DEFENSE_FILES,
  INITIAL_ACTIVITY_LOG
} from '../../src/data/initialData.js';
import { INITIAL_EXPERTISE_CASES } from '../../src/data/expertiseData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// In-memory cache
let dbCache = null;
let saveTimer = null;

function getSeedData() {
  return {
    revision: 1,
    lastModified: new Date().toISOString(),
    accounts: JSON.parse(JSON.stringify(INITIAL_ACCOUNTS)),
    researchers: JSON.parse(JSON.stringify(INITIAL_RESEARCHERS)),
    expertiseCases: JSON.parse(JSON.stringify(INITIAL_EXPERTISE_CASES)),
    monitoringFiles: JSON.parse(JSON.stringify(INITIAL_MONITORING_FILES)),
    monitoringReports: JSON.parse(JSON.stringify(INITIAL_MONITORING_REPORTS)),
    kengashFiles: JSON.parse(JSON.stringify(INITIAL_KENGASH_FILES)),
    postDefenseFiles: JSON.parse(JSON.stringify(INITIAL_POST_DEFENSE_FILES)),
    activityLog: JSON.parse(JSON.stringify(INITIAL_ACTIVITY_LOG)),
    normativeDocuments: []
  };
}

export function initDatabase() {
  if (dbCache) return dbCache;

  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
      if (!dbCache.revision) dbCache.revision = 1;
      if (!dbCache.lastModified) dbCache.lastModified = new Date().toISOString();
      console.log(`[Ilm+ DB] Ma'lumotlar bazasi yuklandi. Reviziya: ${dbCache.revision}`);
      return dbCache;
    } catch (e) {
      console.error('[Ilm+ DB] Fayldan o‘qishda xatolik, yangi baza yaratilmoqda:', e.message);
    }
  }

  dbCache = getSeedData();
  saveDatabaseSync();
  console.log(`[Ilm+ DB] Yangi boshlang'ich baza yaratildi: ${DB_FILE}`);
  return dbCache;
}

export function saveDatabaseSync() {
  if (!dbCache) return;
  try {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbCache, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Ilm+ DB] Saqlashda xatolik:', err);
  }
}

export function saveDatabaseDebounced() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDatabaseSync();
    saveTimer = null;
  }, 200);
}

export function getDatabase() {
  if (!dbCache) initDatabase();
  return dbCache;
}

export function getRevision() {
  if (!dbCache) initDatabase();
  return {
    revision: dbCache.revision,
    lastModified: dbCache.lastModified
  };
}

export function mutateDatabase(callback) {
  if (!dbCache) initDatabase();
  callback(dbCache);
  dbCache.revision = (dbCache.revision || 0) + 1;
  dbCache.lastModified = new Date().toISOString();
  saveDatabaseDebounced();
  return {
    revision: dbCache.revision,
    lastModified: dbCache.lastModified
  };
}

export function addActivity(name, action) {
  mutateDatabase((db) => {
    if (!Array.isArray(db.activityLog)) db.activityLog = [];
    const newEntry = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name || 'Foydalanuvchi',
      action: action || 'Harakat bajarildi',
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };
    db.activityLog = [newEntry, ...db.activityLog].slice(0, 30);
  });
}
