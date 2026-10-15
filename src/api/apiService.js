/**
 * Ilm+ Tizimi uchun Markazlashtirilgan Real-Vaqt API Servisi
 * Ushbu modul orqali barcha tadqiqotchilar va adminlar real internetda bir-birining
 * kiritgan ma'lumotlari, fayllari va tasdiqlarini ko'ra oladi.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

let currentRevision = 0;
let isConnected = true;
const connectionListeners = new Set();

export function setConnectionStatus(status) {
  if (isConnected !== status) {
    isConnected = status;
    connectionListeners.forEach(listener => listener(status));
  }
}

export function onConnectionChange(listener) {
  connectionListeners.add(listener);
  listener(isConnected);
  return () => connectionListeners.delete(listener);
}

/**
 * Serverdagi barcha joriy ma'lumotlarni yuklab olish (Initial fetch)
 */
export async function fetchServerSync() {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP xatosi: ${res.status}`);
    const result = await res.json();
    if (result.success && result.data) {
      currentRevision = result.revision || 1;
      setConnectionStatus(true);
      // Mahalliy xotiraga keshlab qo'yish
      try {
        localStorage.setItem('ilm_last_sync_revision', String(currentRevision));
        localStorage.setItem('ilm_cached_sync_data', JSON.stringify(result.data));
      } catch (e) {
        console.warn('LocalStorage kesh xatosi:', e.message);
      }
      return { success: true, revision: result.revision, data: result.data };
    }
    throw new Error(result.message || "Ma'lumot olinmadi");
  } catch (error) {
    console.warn("[Ilm+ Sync] Serverga ulanib bo'lmadi, lokal xotiradan foydalanilmoqda:", error.message);
    setConnectionStatus(false);
    try {
      const cached = localStorage.getItem('ilm_cached_sync_data');
      if (cached) {
        return { success: false, offline: true, data: JSON.parse(cached) };
      }
    } catch { }
    return { success: false, offline: true, data: null };
  }
}

/**
 * Serverga yangilangan to'plamlarni yuborish va saqlash
 */
export async function pushServerSync(collections, actorName = '', actorAction = '') {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        collections,
        actorName,
        actorAction
      })
    });
    if (!res.ok) throw new Error(`HTTP xatosi: ${res.status}`);
    const result = await res.json();
    if (result.success) {
      currentRevision = result.revision;
      setConnectionStatus(true);
      return { success: true, revision: result.revision, data: result.data };
    }
    throw new Error(result.message || 'Saqlashda xatolik');
  } catch (error) {
    console.error("[Ilm+ Sync] Ma'lumotlarni serverga yuborishda xatolik:", error.message);
    setConnectionStatus(false);
    return { success: false, offline: true, error: error.message };
  }
}

/**
 * Fayllarni serverga yuklash (Multer API orqali haqiqiy fayl saqlash)
 */
export async function uploadRealFile(file, category = 'Umumiy', metadata = {}) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (metadata.username) formData.append('username', metadata.username);
    if (metadata.researcherName) formData.append('researcherName', metadata.researcherName);
    if (metadata.reqId) formData.append('reqId', metadata.reqId);

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Yuklashda xatolik: ${res.status}`);
    }

    const result = await res.json();
    if (result.success && result.data) {
      setConnectionStatus(true);
      return {
        success: true,
        fileUrl: result.data.fileUrl,
        fileName: result.data.fileName,
        originalName: result.data.originalName,
        size: result.data.size,
        mimeType: result.data.mimeType
      };
    }
    throw new Error(result.message || 'Fayl javobi kutilmagan formatda');
  } catch (error) {
    console.error('[Ilm+ Upload] Fayl yuklashda xatolik:', error.message);
    // Offline rejimda blob URL orqali zaxira
    return {
      success: false,
      error: error.message,
      fileUrl: URL.createObjectURL(file),
      originalName: file.name,
      size: file.size
    };
  }
}

/**
 * Avtomatik orqa fonda sinxronlash (Live Polling har 3-4 soniyada)
 * Admin yoki boshqa tadqiqotchi biror narsa kiritganda, boshqa brauzerlarda sahifa yangilanmasdan avtomatik aks etadi.
 */
export function startLiveSync(onDataReceived, intervalMs = 3500) {
  let isChecking = false;

  const checkVersion = async () => {
    if (isChecking) return;
    isChecking = true;
    try {
      const res = await fetch(`${API_BASE}/api/sync/version`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const info = await res.json();
        setConnectionStatus(true);
        if (info.success && info.revision > currentRevision) {
          console.log(`[Ilm+ Live] Yangi ma'lumotlar aniqlandi (Rev: ${info.revision} > ${currentRevision}). Sinxronlanmoqda...`);
          const fullRes = await fetchServerSync();
          if (fullRes.success && fullRes.data) {
            onDataReceived(fullRes.data);
          }
        }
      } else {
        setConnectionStatus(false);
      }
    } catch {
      setConnectionStatus(false);
    } finally {
      isChecking = false;
    }
  };

  const intervalId = setInterval(checkVersion, intervalMs);

  const onFocusOrOnline = () => {
    checkVersion();
  };

  window.addEventListener('focus', onFocusOrOnline);
  window.addEventListener('online', onFocusOrOnline);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('focus', onFocusOrOnline);
    window.removeEventListener('online', onFocusOrOnline);
  };
}

/**
 * Faylni ochish yoki yuklab olish yordamchisi
 */
export function openOrDownloadFile(fileUrl, fileName = 'hujjat.pdf') {
  if (!fileUrl) {
    alert("Fayl havolasi topilmadi!");
    return;
  }
  
  // Agar nisbiy URL bo'lsa to'liq manzilga aylantirish
  const fullUrl = fileUrl.startsWith('http') || fileUrl.startsWith('blob:')
    ? fileUrl
    : `${API_BASE}${fileUrl}`;

  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
