import React, { useState } from 'react';
import { FileArchive, Upload, Check, X, CircleAlert, Trash2, Eye } from 'lucide-react';
import { KENGASH_DOCUMENTS } from '../data/kengashData';

export function KengashStudentView({ user, kengashFiles, setKengashFiles, isSeminar, locale }) {
  const [uploadError, setUploadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDegree, setNewDegree] = useState('PhD');

  const appMeta = kengashFiles.find(f => f.isApp && f.username === user.username && !!f.isSeminar === !!isSeminar);

  const handleCreate = (e) => {
    e.preventDefault();
    setKengashFiles(prev => [...prev, { isApp: true, id: crypto.randomUUID(), username: user.username, degree: newDegree, isSeminar: !!isSeminar }]);
    setShowCreateModal(false);
  };

  const handleUpload = (reqId, file) => {
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.zip') && !ext.endsWith('.pdf') && !ext.endsWith('.doc') && !ext.endsWith('.docx')) {
      setUploadError('Faqat .pdf, .doc, .docx yoki .zip formatidagi fayllar qabul qilinadi.');
      return;
    }
    setUploadError('');
    const newFile = {
      id: crypto.randomUUID(),
      reqId,
      username: user.username,
      name: file.name,
      size: file.size,
      status: 'Kutilmoqda',
      date: new Date().toLocaleDateString('uz-UZ'),
      isSeminar: !!isSeminar
    };
    setKengashFiles(prev => [...prev.filter(f => !(f.reqId === reqId && f.username === user.username && !!f.isSeminar === !!isSeminar)), newFile]);
  };

  const removeFile = (reqId) => {
    setKengashFiles(prev => prev.filter(f => !(f.reqId === reqId && f.username === user.username && !!f.isSeminar === !!isSeminar)));
  };

  if (!appMeta) {
    return (
      <section className="module-view panel">
        <div className="module-toolbar">
          <div>
            <span className="section-kicker">{isSeminar ? (locale === 'ru' ? 'НАУЧНЫЙ СЕМИНАР' : locale === 'en' ? 'SCIENTIFIC SEMINAR' : 'ILMIY SEMINAR') : (locale === 'ru' ? 'РАЗОВЫЙ СОВЕТ' : locale === 'en' ? 'ONE-TIME COUNCIL' : 'BIR MARTALIK KENGASH')}</span>
            <h2>{isSeminar ? (locale === 'ru' ? 'Заявка на научный семинар' : locale === 'en' ? 'Application for Scientific Seminar' : 'Ilmiy seminarga ariza') : (locale === 'ru' ? 'Заявка на разовый совет' : locale === 'en' ? 'Application for One-time Council' : 'Bir martalik kengashga ariza')}</h2>
            <p>{isSeminar ? (locale === 'ru' ? 'Создать заявку на организацию научного семинара.' : locale === 'en' ? 'Create an application to organize a scientific seminar.' : 'Ilmiy seminar tashkil etish uchun ariza yarating.') : (locale === 'ru' ? 'Создать заявку на организацию разового совета.' : locale === 'en' ? 'Create an application to organize a one-time council.' : 'Bir martalik ilmiy kengash tashkil etish uchun ariza yarating.')}</p>
          </div>
          <button className="primary-button" onClick={() => setShowCreateModal(true)}>{locale === 'ru' ? 'Создать' : locale === 'en' ? 'Create' : 'Yaratish'}</button>
        </div>
        
        {showCreateModal && (
          <div className="modal-backdrop">
            <section className="researcher-detail-modal" style={{ width: 400 }}>
              <div className="modal-top">
                <div><span className="section-kicker">{locale === 'ru' ? 'СОЗДАТЬ' : locale === 'en' ? 'CREATE' : 'YARATISH'}</span><h2>{locale === 'ru' ? 'Создание заявки' : locale === 'en' ? 'Create Application' : 'Ariza yaratish'}</h2></div>
                <button className="icon-button" onClick={() => setShowCreateModal(false)}><X size={19}/></button>
              </div>
              <form onSubmit={handleCreate} style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                <label className="input-group">
                  <span>{locale === 'ru' ? 'Тип соискателя' : locale === 'en' ? 'Researcher type' : 'Izlanuvchi turi'}</span>
                  <select value={newDegree} onChange={e => setNewDegree(e.target.value)}>
                    <option value="PhD">Mustaqil izlanuvchi PhD</option>
                    <option value="DSc">Mustaqil izlanuvchi DSc</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="submit" className="primary-button">{locale === 'ru' ? 'Создать' : locale === 'en' ? 'Create' : 'Yaratish'}</button>
                  <button type="button" className="secondary-button" onClick={() => setShowCreateModal(false)}>{locale === 'ru' ? 'Отмена' : locale === 'en' ? 'Cancel' : 'Bekor qilish'}</button>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="module-view panel normative-admin-view">
      <div className="module-toolbar">
        <div>
          <span className="section-kicker">{isSeminar ? (locale === 'ru' ? 'НАУЧНЫЙ СЕМИНАР' : locale === 'en' ? 'SCIENTIFIC SEMINAR' : 'ILMIY SEMINAR') : (locale === 'ru' ? 'РАЗОВЫЙ СОВЕТ' : locale === 'en' ? 'ONE-TIME COUNCIL' : 'BIR MARTALIK KENGASH')} ({appMeta.degree})</span>
          <h2>{locale === 'ru' ? 'Загрузка документов' : locale === 'en' ? 'Upload Documents' : 'Hujjatlarni yuklash'}</h2>
          <p>{locale === 'ru' ? 'Все требуемые документы должны быть загружены в указанных форматах.' : locale === 'en' ? 'All required documents must be uploaded in the specified formats.' : 'Barcha talab etiladigan hujjatlar belgilangan formatlarda (.pdf, .doc, .docx, .zip) yuklanishi shart.'}</p>
        </div>
      </div>
      {uploadError && <div className="upload-error"><CircleAlert size={15} /> {uploadError}</div>}
      
      <div className="document-list" style={{ marginTop: '20px' }}>
        {KENGASH_DOCUMENTS.filter(req => appMeta.degree === 'DSc' || (req.id !== 'k3' && req.id !== 'k10')).map((req, index) => {
          const uploadedFile = kengashFiles.find(f => f.reqId === req.id && f.username === user.username && !!f.isSeminar === !!isSeminar);
          return (
            <div className="document-row" key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>{index + 1}. {req.name}</strong>
                {uploadedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '13px', color: '#a0aab2', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FileArchive size={14} /> {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB) - 
                      <strong style={{ color: uploadedFile.status === 'Qabul qilindi' ? '#58a071' : uploadedFile.status === 'Rad etildi' ? '#da1e28' : '#00c8ff' }}>{uploadedFile.status}</strong>
                    </span>
                    {uploadedFile.status === 'Rad etildi' && uploadedFile.rejectReason && (
                      <span style={{ fontSize: '12px', color: '#da1e28', padding: '4px 8px', background: '#ffebe9', borderRadius: '4px', display: 'inline-block', alignSelf: 'flex-start' }}>
                        <strong>Qaytarish sababi:</strong> {uploadedFile.rejectReason}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: '#da1e28' }}>{locale === 'ru' ? 'Не загружено' : locale === 'en' ? 'Not uploaded' : 'Yuklanmagan'}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!uploadedFile || uploadedFile.status === 'Rad etildi' || uploadedFile.status === 'Kutilmoqda' ? (
                  <label className="secondary-button" style={{ cursor: 'pointer', padding: '6px 12px' }}>
                    <Upload size={14} /> Yuklash
                    <input type="file" accept=".zip,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => handleUpload(req.id, e.target.files[0])} />
                  </label>
                ) : null}
                {uploadedFile && uploadedFile.status === 'Kutilmoqda' && (
                  <button className="icon-button" onClick={() => removeFile(req.id)}>
                    <Trash2 size={15} color="#da1e28" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function KengashAdminView({ kengashFiles, setKengashFiles, researchers, isSeminar, locale }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});

  // Get users who have uploaded at least one file for this specific type (seminar vs kengash)
  const activeUsers = [...new Set(kengashFiles.filter(f => !!f.isSeminar === !!isSeminar).map(f => f.username))];

  const handleReasonChange = (fileId, value) => {
    setRejectReasons(prev => ({ ...prev, [fileId]: value }));
  };

  const updateStatus = (fileId, status) => {
    if (status === 'Rad etildi' && !rejectReasons[fileId]) {
      alert("Iltimos, qaytarish sababini kiriting!");
      return;
    }
    setKengashFiles(prev => prev.map(f => f.id === fileId ? { ...f, status, rejectReason: status === 'Rad etildi' ? rejectReasons[fileId] : f.rejectReason } : f));
  };

  const acceptAll = (username) => {
    if(window.confirm("Barcha kutilayotgan hujjatlarni qabul qilasizmi?")) {
      setKengashFiles(prev => prev.map(f => (f.username === username && f.status === 'Kutilmoqda') ? { ...f, status: 'Qabul qilindi' } : f));
    }
  };

  if (selectedUser) {
    const userFiles = kengashFiles.filter(f => f.username === selectedUser && !!f.isSeminar === !!isSeminar);
    const researcher = researchers.find(r => r.username === selectedUser) || { name: selectedUser };
    
    return (
      <section className="module-view panel">
        <div className="module-toolbar">
          <div>
            <span className="section-kicker">{isSeminar ? "ILMIY SEMINAR HUJJATLARI" : "BIR MARTALIK KENGASH HUJJATLARI"}</span>
            <h2>{researcher.name}</h2>
            <p>{locale === 'ru' ? 'Проверка и утверждение загруженных документов' : locale === 'en' ? 'Verification and approval of uploaded documents' : 'Yuklangan hujjatlarni tekshirish va tasdiqlash'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="secondary-button" onClick={() => setSelectedUser(null)}>{locale === 'ru' ? 'Назад' : locale === 'en' ? 'Back' : 'Ortga qaytish'}</button>
            <button className="primary-button" onClick={() => acceptAll(selectedUser)}><Check size={15} />{locale === 'ru' ? 'Принять все' : locale === 'en' ? 'Accept all' : 'Barchasini qabul qilish'}</button>
          </div>
        </div>

        <div className="document-list" style={{ marginTop: '20px' }}>
          {KENGASH_DOCUMENTS.map((req, index) => {
            const uploadedFile = userFiles.find(f => f.reqId === req.id);
            return (
              <div className="document-row" key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: '5px' }}>{index + 1}. {req.name}</strong>
                  {uploadedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '13px', color: '#a0aab2', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileArchive size={14} /> {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB) - 
                        <strong style={{ color: uploadedFile.status === 'Qabul qilindi' ? '#58a071' : uploadedFile.status === 'Rad etildi' ? '#da1e28' : '#00c8ff' }}>{uploadedFile.status}</strong>
                      </span>
                      {uploadedFile.status === 'Rad etildi' && uploadedFile.rejectReason && (
                        <span style={{ fontSize: '12px', color: '#da1e28', padding: '4px 8px', background: '#ffebe9', borderRadius: '4px', display: 'inline-block', alignSelf: 'flex-start' }}>
                          <strong>Qaytarish sababi:</strong> {uploadedFile.rejectReason}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#da1e28' }}>{locale === 'ru' ? 'Не загружено' : locale === 'en' ? 'Not uploaded' : 'Yuklanmagan'}</span>
                  )}
                </div>
                {uploadedFile && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="icon-button" title={locale === 'ru' ? 'Скачать файл' : locale === 'en' ? 'Download file' : 'Faylni yuklab olish'}><FileArchive size={16} /></button>
                    {uploadedFile.status === 'Kutilmoqda' && (
                      <>
                        <button className="icon-button" style={{ color: '#58a071', borderColor: 'rgba(88,160,113,0.3)' }} onClick={() => updateStatus(uploadedFile.id, 'Qabul qilindi')} title="Qabul qilish"><Check size={15} /></button>
                        <input 
                          type="text" 
                          placeholder={locale === 'ru' ? 'Причина отклонения...' : locale === 'en' ? 'Reason for rejection...' : 'Qaytarish sababi...'} 
                          value={rejectReasons[uploadedFile.id] || ''} 
                          onChange={(e) => handleReasonChange(uploadedFile.id, e.target.value)} 
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #dce5e0', fontSize: '12px', width: '150px', background: 'transparent', color: 'inherit' }}
                        />
                        <button className="icon-button" style={{ color: '#da1e28', borderColor: 'rgba(218,30,40,0.3)' }} onClick={() => updateStatus(uploadedFile.id, 'Rad etildi')} title="Sabab bilan qaytarish"><X size={15} /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="module-view panel">
      <div className="module-toolbar">
        <div>
          <span className="section-kicker">{isSeminar ? "ILMIY SEMINAR" : "BIR MARTALIK KENGASH"}</span>
          <h2>{locale === 'ru' ? 'Список подавших документы' : locale === 'en' ? 'List of applicants' : 'Hujjat topshirganlar ro\'yxati'}</h2>
          <p>{isSeminar ? "Seminar uchun hujjat yuklagan izlanuvchilar ro'yxati" : "Kengash uchun .zip formatda hujjat yuklagan izlanuvchilar ro'yxati"}</p>
        </div>
      </div>
      
      {activeUsers.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>{locale === 'ru' ? 'Никто еще не загрузил документы.' : locale === 'en' ? 'No one has uploaded documents yet.' : 'Hali hech kim hujjat yuklamagan.'}</div>
      ) : (
        <div className="table-scroll" style={{ marginTop: '20px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 15px' }}>{locale === 'ru' ? 'Соискатель' : locale === 'en' ? 'Researcher' : 'Izlanuvchi'}</th>
                <th style={{ padding: '12px 15px' }}>{locale === 'ru' ? 'Загруженные документы' : locale === 'en' ? 'Uploaded documents' : 'Yuklangan hujjatlar'}</th>
                <th style={{ padding: '12px 15px' }}>Kutilmoqda</th>
                <th style={{ padding: '12px 15px', textAlign: 'right' }}>{locale === 'ru' ? 'Действие' : locale === 'en' ? 'Action' : 'Amal'}</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.filter(u => u).map(username => {
                const userFiles = kengashFiles.filter(f => f.username === username && !f.isApp && !!f.isSeminar === !!isSeminar);
                const appMeta = kengashFiles.find(f => f.isApp && f.username === username && !!f.isSeminar === !!isSeminar);
                const degree = appMeta?.degree || 'PhD';

                const pendingCount = userFiles.filter(f => f.status === 'Kutilmoqda').length;
                const researcher = researchers.find(r => r.username === username) || { 
                  name: username, 
                  initials: (username || 'I').slice(0, 2).toUpperCase(), 
                  color: 'blue' 
                };
                
                const requiredDocsCount = degree === 'DSc' ? 16 : 14;

                return (
                  <tr key={username}>
                    <td style={{ padding: '12px 15px' }}>
                      <div className="researcher-cell">
                        <span className={`avatar avatar-${researcher.color || 'blue'}`}>{researcher.initials}</span>
                        <span><strong>{researcher.name}</strong><small>{degree}</small></span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 15px' }}>{userFiles.length} / {requiredDocsCount} ta</td>
                    <td style={{ padding: '12px 15px' }}>
                      {pendingCount > 0 ? <strong style={{ color: '#00c8ff' }}>{pendingCount} ta hujjat</strong> : <span style={{ color: '#58a071' }}>{locale === 'ru' ? 'Все проверено' : locale === 'en' ? 'All reviewed' : 'Barchasi ko\'rib chiqilgan'}</span>}
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                      <button className="secondary-button" onClick={() => setSelectedUser(username)}>
                        <Eye size={14} />{locale === 'ru' ? 'Просмотр' : locale === 'en' ? 'View' : 'Ko\'rish'}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
