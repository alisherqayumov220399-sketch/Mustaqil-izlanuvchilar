/**
 * Himoyadan keyingi hujjatlar modeli (PostDefenseDocument)
 * Modellar, statuslar va yordamchi funksiyalar
 */

export const PostDefenseStatusEnum = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Qabul qilindi',
  REJECTED: 'Rad etildi'
};

export const POST_DEFENSE_REQUIREMENTS = [
  { id: 'pd_1', name: "Talabgorning obyektiv-ma'lumotnomasi", category: "Talabgorning obyektiv-ma'lumotnomasi", required: true },
  { id: 'pd_2', name: "Ilmiy kengash majlisining stenogrammasi", category: "Ilmiy kengash majlisining stenogrammasi", required: true },
  { id: 'pd_3', name: "Taqrizlar", category: "Rasmiy opponentlar va yetakchi tashkilotning taqrizlari", required: true },
  { id: 'pd_4', name: "Himoya to'g'risidagi e'lon nusxalari", category: "Dissertatsiya himoyasi to'g'risidagi e'lon nusxalari", required: true },
  { id: 'pd_5', name: "Amaliyotga joriy qilinganlik to'g'risidagi hujjatlar", category: "Ilmiy natijalarning amaliyotga joriy qilinganligi hujjatlari", required: true },
  { id: 'pd_6', name: "Talabgorning faoliyati va attestatsiya tadbirlarini tasdiqlovchi hujjat nusxalari", category: "Attestatsiya tadbirlari natijalarini tasdiqlovchi hujjatlar", required: true },
  { id: 'pd_7', name: "Asosiy ilmiy ishlar nusxalari", category: "Tasdiqlangan ilmiy ishlar ro'yxati, asosiy ilmiy ishlari nusxalari _uzl", required: true },
  { id: 'pd_8', name: "Fan doktori (DSc) ilmiy darajasi talabgori uchun fan nomzodi yoki falsafa doktori (PhD) yoxud unga tenglashtirilgan boshqa ilmiy daraja dissertatsiyasi avtoreferati", category: "Fan doktori (DSc) ilmiy darajasi talabgori uchun fan nomzodi yoki falsafa doktori (PhD) yoxud unga tenglashtirilgan boshqa ilmiy daraja dissertatsiyasi avtoreferati", required: false },
  { id: 'pd_9', name: "Dissertatsiya nusxasi", category: "Dissertatsiya", required: true },
  { id: 'pd_10', name: "Avtoreferat nusxasi", category: "Avtoreferat", required: true },
  { id: 'pd_11', name: "Tasdiqlangan ilmiy ishlar ro'yxati", category: "Tasdiqlangan ilmiy ishlar ro'yxati, asosiy ilmiy ishlari nusxalari _uzl", required: true },
  { id: 'pd_12', name: "Talabgor ismi, familiyasi va otasining ismi ma'lumotlarining (pasport bo'yicha) davlat tilidagi (lotincha) va ingliz tilidagi tasdiqlangan shakllari", category: "Talabgorning obyektiv-ma'lumotnomasi", required: true }
];

export function createDocumentRecord(data) {
  return {
    id: data.id || Date.now().toString(),
    reqId: data.reqId,
    reqTitle: data.reqTitle,
    username: data.username,
    researcherName: data.researcherName || data.username,
    fileName: data.fileName,
    originalName: data.originalName,
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || 'application/octet-stream',
    status: data.status || PostDefenseStatusEnum.PENDING,
    rejectReason: data.rejectReason || '',
    uploadedAt: data.uploadedAt || new Date().toISOString(),
    history: data.history || [
      {
        action: 'UPLOADED',
        timestamp: new Date().toISOString(),
        actor: data.username
      }
    ]
  };
}
