# Saytni Ochish va Internetga Joylash Bo'yicha Qo'llanma

Ushbu loyiha **React + Vite** asosida tuzilgan **"Ilm+ | Mustaqil izlanuvchilar monitoringi"** tizimidir.
Barcha zarur konfiguratsiyalar (`vite.config.js`, `vercel.json`, `netlify.toml`, `public/_redirects`, `.github/workflows/deploy.yml`) to'liq sozlandi.

---

## 1. Saytni o'z kompyuteringizda ochish (Lokal rejim)

### Eng oson usul:
- Loyiha papkasidagi **`saytni-ochish.bat`** faylini ikki marta bosing (double-click).
- Brauzer avtomatik ravishda `http://localhost:5173` manzilida ochiladi.

### Yoki terminal (PowerShell / CMD) orqali:
```bash
npm run dev
```
Sayt manzillari:
- Kompyuterda: `http://localhost:5173/`
- Bir xil Wi-Fi dagi telefon yoki boshqa qurilmalarda ham ko'rish mumkin (chunki `--host` yoqilgan).

---

## 2. Saytni Internetga bepul joylash (3 ta oson usul)

### 1-usul: Netlify Drop (Eng oson, 1 daqiqada tayyor!)
Hech qanday kod yozish shart emas:
1. Loyiha papkasidagi **`internetga-tayyorlash.bat`** ni bosing (yoki terminalda `npm run build` qiling).
2. Brauzerda [app.netlify.com/drop](https://app.netlify.com/drop) saytiga kiring.
3. Loyihangiz ichidagi **`dist`** papkasini brauzer oynasiga shunchaki sudrab (drag & drop) tashlang.
4. Netlify sizga darhol bepul internet havolasi (masalan, `https://ilm-monitoring.netlify.app`) taqdim etadi!

---

### 2-usul: Vercel orqali joylash (Professional va tezkor)
Loyihada `vercel.json` to'liq sozlangan:
1. [vercel.com](https://vercel.com) saytiga kiring va ro'yxatdan o'ting.
2. **"Add New Project"** tugmasini bosing.
3. Loyihani GitHub orqali ulab bering yoki terminalda quyidagi buyruqni bering:
   ```bash
   npx vercel
   ```
4. Vercel loyihani avtomatik qurib, internetga joylaydi.

---

### 3-usul: GitHub Pages orqali joylash
Loyihaga `.github/workflows/deploy.yml` va `base: './'` sozlamalari qo'shilgan:
1. Loyihani GitHub omboringizga (repository) yuklang.
2. GitHub sahifangizda **Settings** -> **Pages** bo'limiga kiring.
3. **Build and deployment** bo'limida Source qilib **GitHub Actions** ni tanlang.
4. Har safar kod yuklaganingizda sayt avtomatik yangilanib turadi.

---

### 4-usul: Surge orqali darhol internetga chiqarish
Terminalda bitta buyruq bilan:
```bash
npm run build
npx surge dist
```
O'zingiz istagan domen nomini kiritasiz va sayt internetda ishga tushadi!

---

## 3. Loyihadagi kiritilgan o'zgarishlar va sozlamalar:
- [x] **`vite.config.js`**: `base: './'` nisbiy yo'llar ulandi, avtomatik brauzerda ochish (`open: true`) va tarmoq orqali kirish (`host: true`) faollashtirildi.
- [x] **`vercel.json`**: Vercel uchun marshrutlash va build sozlamalari yaratildi.
- [x] **`netlify.toml`** va **`public/_redirects`**: Netlify va Cloudflare Pages uchun 404 xatolarining oldini oluvchi SPA sozlamasi qo'shildi.
- [x] **`.github/workflows/deploy.yml`**: GitHub Pages orqali avtomatik joylash kodi kiritildi.
- [x] **`package.json`**: `dev:host`, `serve` qulay buyruqlari qo'shildi.
- [x] **`saytni-ochish.bat`** va **`internetga-tayyorlash.bat`**: Windows tizimida bir tugma bilan ishga tushirish skriptlari yaratildi.
