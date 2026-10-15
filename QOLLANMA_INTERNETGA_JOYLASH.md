# "Ilm+" Tizimini To'liq Ishchi Holatda Ishlatish va Internetga Joylash Qo'llanmasi

Ushbu loyiha **"Ilm+ | Mustaqil izlanuvchilar monitoringi"** axborot tizimi bo'lib, **Markaziy Server (Node.js/Express) + Real Fayllar Bazasi (Multer/JSON DB) + Zamonaviy Frontend (React SPA)** to'liq integratsiya qilingan holda ishchi holatga keltirildi.

Endi brauzer `localStorage` cheklovlari olib tashlandi:
1. **Markaziy Ma'lumotlar Bazasi**: `backend/data/db.json` faylida barcha tadqiqotchilar, hisoblar, arizalar, monitoring hisobotlari, kengash va himoyadan keyingi bosqich ma'lumotlari saqlanadi.
2. **Haqiqiy Fayllar Ombori**: Tadqiqotchi yoki admin yuklagan barcha fayllar (`.pdf`, `.docx`, `.zip`, `.xlsx`, `.jpg`) serverning `backend/uploads/` papkasiga saqlanadi va hamma tomonidan original holatda yuklab olinadi.
3. **Jonli Ikki Tomonlama Sinxronizatsiya (Real-Time Live Sync)**:
   - Tadqiqotchi ariza yuborsa yoki hujjat yuklasa, Admin panelida bir necha soniyada avtomatik aks etadi.
   - Admin arizani qabul qilsa yoki rad etsa, tadqiqotchi kabinetida sahifani yangilamasdan (real-vaqtda) yangilanadi.

---

## 1. O'z Kompyuteringizda (Lokal Tarmoqda) Ishga Tushirish

### Eng oson usul:
- Loyiha papkasidagi **`saytni-ochish.bat`** faylini ikki marta bosing.
- Tizim serverni ishga tushiradi va brauzerda `http://localhost:5000` manzilini ochadi.

### Terminal orqali:
```bash
# Barcha komponentlarni bitta serverda ishga tushirish (Frontend + Backend API):
npm start
```

### Xona yoki Institut Wi-Fi tarmog'idagi boshqa kompyuter va telefonlardan kirish:
1. Kompyuteringizning mahalliy IP manzilini bilib oling (Terminalda `ipconfig` deb yozing, masalan `192.168.1.45`).
2. Institutdagi tadqiqotchilar o'z kompyuteri yoki telefonidan quyidagi manzilga kirishadi:
   ```
   http://192.168.1.45:5000
   ```
3. Barcha foydalanuvchilar bitta umumiy bazaga ulanadi va real vaqtda bir-birlarining ma'lumotlarini ko'rishadi!

---

## 2. Saytni Butun Dunyo Bo'yicha Real Internetga Bepul Joylash (24/7 Rejim)

Haqiqiy fayllar va ma'lumotlar bazasi ishlashi uchun sayt Node.js server bilan birga internetga joylanishi kerak. Quyidagi usullar **100% bepul** va eng qulayidir:

### 1-usul: Render.com (Tavsiya etiladi - Eng oson va professional)
1. Loyihani o'z GitHub hisobingizga yuklang (`git push origin main`).
2. [Render.com](https://render.com) saytiga kiring va ro'yxatdan o'ting.
3. **"New +"** tugmasini bosib, **"Web Service"** ni tanlang.
4. GitHub omboringizni tanlang va quyidagi sozlamalarni kiriting:
   - **Name**: `ilm-monitoring` (yoki ixtiyoriy nom)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. **"Deploy Web Service"** tugmasini bosing.
6. 2 daqiqada sizga bepul xavfsiz internet havolasi beriladi (masalan: `https://ilm-monitoring.onrender.com`).
   *Ushbu havola orqali dunyoning istalgan joyidan admin ham, tadqiqotchilar ham tizimga kira oladilar.*

---

### 2-usul: Railway.app (Juda tez va qulay)
1. [Railway.app](https://railway.app) ga kiring va GitHub orqali kiring.
2. **"New Project"** -> **"Deploy from GitHub repo"** ni tanlang.
3. Loyihangizni tanlang. Railway loyihani o'zi aniqlab, avtomatik `npm start` orqali ishga tushiradi.
4. **Settings** -> **Generate Domain** tugmasini bosing va bepul manzilga ega bo'ling.

---

### 3-usul: O'z kompyuteringizni darhol Internetga chiqarish (Ngrok yoki Localtunnel)
Agar server xarid qilmasdan, kompyuteringizdagi serverni 1 daqiqada butun internetga ochib bermoqchi bo'lsangiz:
1. Kompyuteringizda serverni yoqing: `npm start`
2. Yangi terminal ochib, quyidagi buyruqni bering:
   ```bash
   npx localtunnel --port 5000
   ```
3. Terminal sizga internet havolasi beradi (masalan: `https://smooth-ox-45.loca.lt`).
4. Ushbu havolani tadqiqotchilarga bersangiz, ular to'g'ridan-to'g'ri tizimga kirib ma'lumot kiritishlari mumkin!

---

## 3. Sinov Uchun Kirish Ma'lumotlari

### Administrator Kabineti:
- **Login**: `admin`
- **Parol**: `admin123`

### Tadqiqotchi Kabinetlari (Namunalar):
1. **Mamatov Dilshod**:
   - **Login**: `dilshod`
   - **Parol**: `dilshod123`
2. **Xasanov Baxtiyor**:
   - **Login**: `baxrom`
   - **Parol**: `baxrom123`
3. **Qodirova Shahnoza**:
   - **Login**: `nodir`
   - **Parol**: `nodir123`

*(Shuningdek, Admin panelida yangi tadqiqotchilarni ro'yxatga olish, ularga login/parol berish va parollarini o'zgartirish to'liq ishchi holatda).*

---

## 4. Tizimda Integratsiya Qilingan Asosiy Bo'limlar:
- **Dastlabki Ekspertiza**: Tadqiqotchi dissertatsiya arizasini va 11 ta nizom hujjatlarini yuklaydi. Admin ularni ko'radi, fayllarni yuklab oladi, xulosa shakllantiradi va kengashga tavsiya etadi.
- **Ish Reja va Monitoring**: Tadqiqotchi choraklik ish reja hujjatlarini (.pdf, .docx) yuklaydi. Admin barcha hujjatlarni ko'radi, hisobotlarni tasdiqlaydi yoki qaytaradi.
- **Kengash jarayoni**: Kengash hujjatlari va qarorlari almashiladi.
- **Himoyadan keyingi monitoring**: OAK uchun zarur bo'lgan hujjatlar shakllantiriladi va yuklanadi.
- **Ichki normativ hujjatlar**: Admin yuklagan universitet nizomlarini barcha tadqiqotchilar o'z kabinetlaridan yuklab oladilar.
