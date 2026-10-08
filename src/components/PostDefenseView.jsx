import React, { useState, useRef, useMemo } from 'react';
import { 
  FileArchive, Upload, Check, X, CircleAlert, Trash2, Eye, FileText, 
  Search, Download, ChevronDown, CheckCircle2, XCircle, Clock, 
  RotateCcw, ArrowLeft, AlertTriangle
} from 'lucide-react';
import { POST_DEFENSE_DOCUMENTS, POST_DEFENSE_STATUSES } from '../data/postDefenseData';

export function PostDefenseStudentView({ user, postDefenseFiles, setPostDefenseFiles, locale }) {
  const [selectedReqId, setSelectedReqId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [reuploadTargetReq, setReuploadTargetReq] = useState(null);
  const fileInputRef = useRef(null);
  const reuploadInputRef = useRef(null);

  // Filtered documents for the dropdown matching user screenshot
  const filteredDropdownDocs = useMemo(() => {
    return POST_DEFENSE_DOCUMENTS.filter(doc => {
      const q = (searchQuery || '').toLowerCase();
      const rawName = (locale === 'ru' ? doc.translations?.ru?.name : locale === 'en' ? doc.translations?.en?.name : doc.name) || doc.name || '';
      const rawCat = (locale === 'ru' ? doc.translations?.ru?.category : locale === 'en' ? doc.translations?.en?.category : doc.category) || doc.category || '';
      const name = String(rawName).toLowerCase();
      const cat = String(rawCat).toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [searchQuery, locale]);

  // User's uploaded files
  const userFiles = useMemo(() => {
    return postDefenseFiles.filter(f => f.username === user.username);
  }, [postDefenseFiles, user.username]);

  // Statistics
  const stats = useMemo(() => {
    const totalRequired = POST_DEFENSE_DOCUMENTS.filter(d => d.required).length;
    const totalUploaded = userFiles.length;
    const approved = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.APPROVED).length;
    const pending = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.PENDING).length;
    const rejected = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.REJECTED).length;
    return { totalRequired, totalUploaded, approved, pending, rejected };
  }, [userFiles]);

  const handleFileUpload = (reqId, file) => {
    if (!file) return;
    const ext = file.name.toLowerCase();
    const validExts = ['.zip', '.pdf', '.doc', '.docx'];
    const isValid = validExts.some(e => ext.endsWith(e));
    if (!isValid) {
      setUploadError(locale === 'ru' ? 'Принимаются только файлы .pdf, .doc, .docx или .zip.' : locale === 'en' ? 'Only .pdf, .doc, .docx, or .zip files are allowed.' : 'Faqat .pdf, .doc, .docx yoki .zip formatidagi fayllar qabul qilinadi.');
      return;
    }

    if (file.size > 60 * 1024 * 1024) {
      setUploadError(locale === 'ru' ? 'Размер файла превышает 60 МБ.' : locale === 'en' ? 'File size exceeds 60 MB.' : 'Fayl hajmi 60 MB dan oshmasligi kerak.');
      return;
    }

    setUploadError('');
    const newFile = {
      id: crypto.randomUUID(),
      reqId,
      username: user.username,
      researcherName: user.name || user.username,
      name: file.name,
      size: file.size,
      status: POST_DEFENSE_STATUSES.PENDING,
      date: new Date().toLocaleDateString('uz-UZ'),
      timestamp: new Date().toISOString(),
      rejectReason: ''
    };

    setPostDefenseFiles(prev => [
      ...prev.filter(f => !(f.reqId === reqId && f.username === user.username)),
      newFile
    ]);

    setSuccessMessage(locale === 'ru' ? 'Файл успешно загружен!' : locale === 'en' ? 'File uploaded successfully!' : 'Hujjat muvaffaqiyatli yuklandi!');
    setSelectedReqId('');
    setDropdownOpen(false);
    setReuploadTargetReq(null);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const removeFile = (reqId) => {
    if (window.confirm(locale === 'ru' ? 'Вы уверены, что хотите удалить этот файл?' : locale === 'en' ? 'Are you sure you want to delete this file?' : 'Ushbu hujjatni o‘chirishni xohlaysizmi?')) {
      setPostDefenseFiles(prev => prev.filter(f => !(f.reqId === reqId && f.username === user.username)));
    }
  };

  const handleDownload = (file) => {
    const dummyContent = `Hujjat: ${file.name}\nTalabgor: ${file.researcherName}\nYuklangan sana: ${file.date}\nHolat: ${file.status}\n\nBu tizim orqali yuklangan haqiqiy test nusxasi.`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="module-view panel" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="module-toolbar">
        <div>
          <span className="section-kicker" style={{ color: '#0070f3', fontWeight: 'bold' }}>
            {locale === 'ru' ? 'АТТЕСТАЦИЯ ВАК / ПОСЛЕЗАЩИТНЫЕ ДОКУМЕНТЫ' : locale === 'en' ? 'HAC ATTESTATION / POST-DEFENSE DOCUMENTS' : 'OAK ATTESTATSIYASI / HIMOYADAN KEYINGI HUJJATLAR'}
          </span>
          <h2>
            {locale === 'ru' ? 'Himoyadan keyingi hujjatlar' : locale === 'en' ? 'Post-defense documents' : 'Himoyadan keyingi hujjatlar'}
          </h2>
          <p>
            {locale === 'ru' 
              ? 'Загрузка полного пакета документов в ВАК после защиты диссертации в соответствии с установленными требованиями.' 
              : locale === 'en' 
              ? 'Submission of complete post-defense documents for HAC review following dissertation defense.' 
              : 'Dissertatsiya himoyasidan so‘ng OAK (Oliy attestatsiya komissiyasi)ga taqdim etiladigan belgilangan shakldagi barcha rasmiy hujjatlar to‘plami.'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'Всего документов' : locale === 'en' ? 'Total Documents' : 'Jami hujjatlar'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
            {stats.totalUploaded} / {stats.totalRequired}
          </div>
          <small style={{ color: '#64748b' }}>{locale === 'ru' ? '11 обязательных, 1 для DSc' : locale === 'en' ? '11 required, 1 for DSc' : '11 ta majburiy, 1 ta DSc uchun'}</small>
        </div>
        <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'Принято' : locale === 'en' ? 'Approved' : 'Qabul qilindi'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d', marginTop: '4px' }}>{stats.approved}</div>
          <small style={{ color: '#166534' }}>{locale === 'ru' ? 'Проверено администратором' : locale === 'en' ? 'Verified by admin' : 'Admin tasdiqlagan'}</small>
        </div>
        <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: '11px', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'В ожидании' : locale === 'en' ? 'Pending' : 'Kutilmoqda'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>{stats.pending}</div>
          <small style={{ color: '#1e40af' }}>{locale === 'ru' ? 'На рассмотрении' : locale === 'en' ? 'Under review' : 'Ko‘rib chiqish jarayonida'}</small>
        </div>
        <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <span style={{ fontSize: '11px', color: '#991b1b', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'Возвращено' : locale === 'en' ? 'Returned' : 'Rad etildi / Qaytarildi'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>{stats.rejected}</div>
          <small style={{ color: '#991b1b' }}>{locale === 'ru' ? 'Требует исправления' : locale === 'en' ? 'Requires re-upload' : 'Qayta yuklash lozim'}</small>
        </div>
      </div>

      {/* Notifications */}
      {uploadError && (
        <div className="upload-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', marginTop: '15px' }}>
          <CircleAlert size={18} /> <span>{uploadError}</span>
        </div>
      )}
      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', color: '#15803d', marginTop: '15px' }}>
          <CheckCircle2 size={18} /> <span>{successMessage}</span>
        </div>
      )}

      {/* Upload dropdown matching user's exact UI from JPG images */}
      <div style={{ marginTop: '25px', padding: '18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#334155' }}>
          {locale === 'ru' ? 'Выберите тип предоставляемого документа для загрузки:' : locale === 'en' ? 'Select document type to upload:' : 'Taqdim etiladigan hujjat turini tanlang:'}
        </label>

        <div style={{ position: 'relative' }}>
          {/* Dropdown trigger header resembling the screenshot */}
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 14px', 
              border: '1px solid #cbd5e1', 
              borderRadius: '6px', 
              cursor: 'pointer',
              background: '#fff'
            }}
          >
            <span style={{ color: selectedReqId ? '#0f172a' : '#64748b', fontSize: '13px', fontWeight: selectedReqId ? '500' : 'normal' }}>
              {selectedReqId ? (
                (() => {
                  const doc = POST_DEFENSE_DOCUMENTS.find(d => d.id === selectedReqId);
                  if (!doc) return 'Taqdim etiladigan hujjat turini tanlang';
                  const title = locale === 'ru' ? doc.translations?.ru?.name : locale === 'en' ? doc.translations?.en?.name : doc.name;
                  const cat = locale === 'ru' ? doc.translations?.ru?.category : locale === 'en' ? doc.translations?.en?.category : doc.category;
                  return `${doc.required ? '* ' : ''}${title} / [ ${cat} ]`;
                })()
              ) : (
                locale === 'ru' ? 'Выберите тип предоставляемого документа' : locale === 'en' ? 'Select submitted document type' : 'Taqdim etiladigan hujjat turini tanlang'
              )}
            </span>
            <ChevronDown size={18} style={{ color: '#64748b', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {/* Dropdown list popup matching screenshot */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: '4px',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              maxHeight: '380px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Search bar within dropdown */}
              <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc' }}>
                <Search size={16} color="#64748b" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ru' ? 'Поиск типа документа...' : locale === 'en' ? 'Search document type...' : 'Hujjat turini qidirish...'}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px' }}
                  autoFocus
                />
              </div>

              {/* Items matching exact format in screenshot: * Name / [ Category ] */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filteredDropdownDocs.map((doc) => {
                  const isSelected = selectedReqId === doc.id;
                  const hasUploaded = userFiles.find(f => f.reqId === doc.id);
                  const title = locale === 'ru' ? doc.translations?.ru?.name : locale === 'en' ? doc.translations?.en?.name : doc.name;
                  const cat = locale === 'ru' ? doc.translations?.ru?.category : locale === 'en' ? doc.translations?.en?.category : doc.category;

                  return (
                    <div 
                      key={doc.id}
                      onClick={() => {
                        setSelectedReqId(doc.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        background: isSelected ? '#1e40af' : '#fff',
                        color: isSelected ? '#fff' : '#1e293b',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#fff';
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '10px' }}>
                        <span>
                          {doc.required ? <strong style={{ color: isSelected ? '#fff' : '#dc2626', marginRight: 4 }}>*</strong> : null}
                          {title} / <span style={{ color: isSelected ? '#e0e7ff' : '#64748b' }}>[ {cat} ]</span>
                        </span>
                      </div>
                      {hasUploaded && (
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: isSelected ? 'rgba(255,255,255,0.2)' : (hasUploaded.status === POST_DEFENSE_STATUSES.APPROVED ? '#dcfce7' : hasUploaded.status === POST_DEFENSE_STATUSES.REJECTED ? '#fee2e2' : '#dbeafe'),
                          color: isSelected ? '#fff' : (hasUploaded.status === POST_DEFENSE_STATUSES.APPROVED ? '#166534' : hasUploaded.status === POST_DEFENSE_STATUSES.REJECTED ? '#991b1b' : '#1e40af')
                        }}>
                          {hasUploaded.status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action button to upload the chosen document */}
        {selectedReqId && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
            <span style={{ fontSize: '13px', color: '#475569', flex: 1 }}>
              {(() => {
                const doc = POST_DEFENSE_DOCUMENTS.find(d => d.id === selectedReqId);
                return `${doc?.name} (${locale === 'ru' ? 'Форматы: PDF, DOC, DOCX, ZIP' : locale === 'en' ? 'Formats: PDF, DOC, DOCX, ZIP' : 'Formatlar: .pdf, .doc, .docx, .zip'})`;
              })()}
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".pdf,.doc,.docx,.zip" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(selectedReqId, e.target.files[0]);
                  e.target.value = '';
                }
              }} 
            />
            <button 
              type="button" 
              className="primary-button" 
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={16} /> {locale === 'ru' ? 'Выбрать и загрузить файл' : locale === 'en' ? 'Select and Upload File' : 'Faylni tanlash va yuklash'}
            </button>
          </div>
        )}
      </div>

      {/* Hidden input for row re-upload */}
      <input 
        type="file" 
        ref={reuploadInputRef} 
        accept=".pdf,.doc,.docx,.zip" 
        style={{ display: 'none' }} 
        onChange={(e) => {
          if (e.target.files?.[0] && reuploadTargetReq) {
            handleFileUpload(reuploadTargetReq, e.target.files[0]);
            e.target.value = '';
          }
        }} 
      />

      {/* Comprehensive list of all 12 post-defense documents */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
            {locale === 'ru' ? 'Список требуемых документов (12 пунктов)' : locale === 'en' ? 'Required Documents Checklist (12 items)' : 'Talab etiladigan rasmiy hujjatlar ro‘yxati (12 band)'}
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {stats.totalUploaded} / {POST_DEFENSE_DOCUMENTS.length} {locale === 'ru' ? 'загружено' : locale === 'en' ? 'uploaded' : 'yuklandi'}
          </span>
        </div>

        <div className="document-list" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
          {POST_DEFENSE_DOCUMENTS.map((req, index) => {
            const uploadedFile = userFiles.find(f => f.reqId === req.id);
            const isRejected = uploadedFile?.status === POST_DEFENSE_STATUSES.REJECTED;
            const isApproved = uploadedFile?.status === POST_DEFENSE_STATUSES.APPROVED;
            const isPending = uploadedFile?.status === POST_DEFENSE_STATUSES.PENDING;

            const title = locale === 'ru' ? req.translations?.ru?.name : locale === 'en' ? req.translations?.en?.name : req.name;
            const cat = locale === 'ru' ? req.translations?.ru?.category : locale === 'en' ? req.translations?.en?.category : req.category;

            return (
              <div 
                key={req.id} 
                style={{ 
                  padding: '16px 18px', 
                  borderBottom: index < POST_DEFENSE_DOCUMENTS.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: isRejected ? '#fff8f8' : isApproved ? '#fafffc' : '#fff',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>{index + 1}.</span>
                      {req.required ? (
                        <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }} title={locale === 'ru' ? 'Обязательный документ' : locale === 'en' ? 'Required document' : 'Majburiy hujjat'}>*</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>DSc</span>
                      )}
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{title}</strong>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', paddingLeft: '18px' }}>
                      [ {cat} ]
                    </div>

                    {/* Uploaded File Details & Status */}
                    {uploadedFile ? (
                      <div style={{ marginTop: '10px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FileArchive size={15} color="#0070f3" />
                            <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>· {uploadedFile.date}</span>

                          {/* Status Badge */}
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            padding: '3px 8px', 
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#e0f2fe',
                            color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#0369a1'
                          }}>
                            {isApproved && <CheckCircle2 size={13} />}
                            {isPending && <Clock size={13} />}
                            {isRejected && <XCircle size={13} />}
                            {uploadedFile.status}
                          </span>
                        </div>

                        {/* Admin Rejection Reason Alert */}
                        {isRejected && (
                          <div style={{ 
                            marginTop: '6px', 
                            padding: '10px 14px', 
                            background: '#fee2e2', 
                            border: '1px solid #f87171', 
                            borderRadius: '6px', 
                            color: '#991b1b',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px'
                          }}>
                            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong style={{ display: 'block', fontSize: '13px' }}>
                                {locale === 'ru' ? 'Причина отклонения администратором:' : locale === 'en' ? 'Reason for return by Administrator:' : 'Admin tomonidan qaytarish sababi:'}
                              </strong>
                              <p style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: '1.4' }}>
                                {uploadedFile.rejectReason || (locale === 'ru' ? 'Документ не соответствует требованиям. Пожалуйста, проверьте и загрузите повторно.' : locale === 'en' ? 'Document does not meet requirements. Please review and re-upload.' : 'Hujjat talabga javob bermaydi. Iltimos, kamchiliklarni to‘g‘rilab qayta yuklang.')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: '6px', paddingLeft: '18px', fontSize: '12px', color: '#94a3b8' }}>
                        {locale === 'ru' ? 'Документ еще не загружен' : locale === 'en' ? 'Document not uploaded yet' : 'Hujjat hali yuklanmagan'}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {uploadedFile && (
                      <>
                        <button 
                          className="icon-button" 
                          title={locale === 'ru' ? 'Просмотр информации' : locale === 'en' ? 'Preview details' : 'Ko‘rish'}
                          onClick={() => setPreviewDoc(uploadedFile)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="icon-button" 
                          title={locale === 'ru' ? 'Скачать файл' : locale === 'en' ? 'Download file' : 'Faylni yuklab olish'}
                          onClick={() => handleDownload(uploadedFile)}
                        >
                          <Download size={16} />
                        </button>
                      </>
                    )}

                    {/* Upload / Re-upload Button */}
                    {!uploadedFile ? (
                      <label className="secondary-button" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Upload size={14} /> {locale === 'ru' ? 'Загрузить' : locale === 'en' ? 'Upload' : 'Yuklash'}
                        <input 
                          type="file" 
                          accept=".zip,.pdf,.doc,.docx" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(req.id, e.target.files[0]);
                              e.target.value = '';
                            }
                          }} 
                        />
                      </label>
                    ) : isRejected ? (
                      <button 
                        className="primary-button" 
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#dc2626', borderColor: '#b91c1c' }}
                        onClick={() => {
                          setReuploadTargetReq(req.id);
                          reuploadInputRef.current?.click();
                        }}
                      >
                        <RotateCcw size={14} /> {locale === 'ru' ? 'Загрузить повторно' : locale === 'en' ? 'Re-upload' : 'Qayta yuklash'}
                      </button>
                    ) : isPending ? (
                      <button 
                        className="icon-button" 
                        title={locale === 'ru' ? 'Удалить файл' : locale === 'en' ? 'Delete file' : 'Faylni o‘chirish'}
                        onClick={() => removeFile(req.id)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Preview Modal */}
      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="researcher-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-top">
              <div>
                <span className="section-kicker">{locale === 'ru' ? 'ПРОСМОТР ДОКУМЕНТА' : locale === 'en' ? 'DOCUMENT PREVIEW' : 'HUJJATNI KO‘RISH'}</span>
                <h2>{previewDoc.name}</h2>
              </div>
              <button className="icon-button" onClick={() => setPreviewDoc(null)}><X size={19} /></button>
            </div>
            
            <div style={{ padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Тип документа:' : locale === 'en' ? 'Document Type:' : 'Hujjat turi:'}</span>
                <strong>{POST_DEFENSE_DOCUMENTS.find(d => d.id === previewDoc.reqId)?.name}</strong>

                <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Размер файла:' : locale === 'en' ? 'File Size:' : 'Fayl hajmi:'}</span>
                <span>{(previewDoc.size / (1024 * 1024)).toFixed(2)} MB</span>

                <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Дата загрузки:' : locale === 'en' ? 'Upload Date:' : 'Yuklangan sana:'}</span>
                <span>{previewDoc.date}</span>

                <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Текущий статус:' : locale === 'en' ? 'Current Status:' : 'Hozirgi holat:'}</span>
                <span style={{ fontWeight: 'bold', color: previewDoc.status === POST_DEFENSE_STATUSES.APPROVED ? '#15803d' : previewDoc.status === POST_DEFENSE_STATUSES.REJECTED ? '#dc2626' : '#2563eb' }}>
                  {previewDoc.status}
                </span>
              </div>

              {previewDoc.rejectReason && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', color: '#991b1b', marginTop: '5px' }}>
                  <strong>{locale === 'ru' ? 'Причина отклонения / замечание:' : locale === 'en' ? 'Rejection Reason / Note:' : 'Qaytarish sababi / kamchilik:'}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{previewDoc.rejectReason}</p>
                </div>
              )}

              {/* Simulated document content box */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', padding: '25px', textAlign: 'center', marginTop: '10px' }}>
                <FileText size={48} color="#0070f3" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                  {locale === 'ru' ? 'Файл проверен и доступен для скачивания' : locale === 'en' ? 'File verified and available for download' : 'Fayl tekshiruvdan o‘tkazilgan va yuklab olish uchun tayyor'}
                </p>
                <button 
                  className="secondary-button" 
                  onClick={() => handleDownload(previewDoc)}
                  style={{ marginTop: '15px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={15} /> {locale === 'ru' ? 'Скачать файл' : locale === 'en' ? 'Download File' : 'Faylni yuklab olish'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="primary-button" onClick={() => setPreviewDoc(null)}>
                  {locale === 'ru' ? 'Закрыть' : locale === 'en' ? 'Close' : 'Yopish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function PostDefenseAdminView({ postDefenseFiles, setPostDefenseFiles, researchers, locale }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectModalFile, setRejectModalFile] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('researchers'); // 'researchers' | 'allFiles'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Active users who uploaded at least one post-defense document
  const activeUsers = useMemo(() => {
    return [...new Set(postDefenseFiles.map(f => f.username))];
  }, [postDefenseFiles]);

  // Handle approving a document
  const handleApprove = (fileId) => {
    setPostDefenseFiles(prev => prev.map(f => f.id === fileId ? {
      ...f,
      status: POST_DEFENSE_STATUSES.APPROVED,
      rejectReason: ''
    } : f));
  };

  // Handle returning/rejecting a document with mandatory reason
  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectReasonText.trim()) {
      setRejectError(locale === 'ru' ? 'Обязательно укажите причину возврата!' : locale === 'en' ? 'Please provide a mandatory reason for return!' : 'Iltimos, qaytarish sababini majburiy tartibda kiriting!');
      return;
    }

    setPostDefenseFiles(prev => prev.map(f => f.id === rejectModalFile.id ? {
      ...f,
      status: POST_DEFENSE_STATUSES.REJECTED,
      rejectReason: rejectReasonText.trim(),
      rejectedAt: new Date().toISOString()
    } : f));

    setRejectModalFile(null);
    setRejectReasonText('');
    setRejectError('');
  };

  // Batch approve all pending for a specific researcher
  const handleAcceptAllForUser = (username) => {
    if (window.confirm(locale === 'ru' ? 'Принять все документы этого соискателя, находящиеся в ожидании?' : locale === 'en' ? 'Approve all pending documents for this applicant?' : 'Ushbu izlanuvchining barcha kutilayotgan hujjatlarini tasdiqlaysizmi?')) {
      setPostDefenseFiles(prev => prev.map(f => (f.username === username && f.status === POST_DEFENSE_STATUSES.PENDING) ? {
        ...f,
        status: POST_DEFENSE_STATUSES.APPROVED,
        rejectReason: ''
      } : f));
    }
  };

  const handleDownload = (file) => {
    const dummyContent = `Hujjat: ${file.name}\nTalabgor: ${file.researcherName}\nYuklangan sana: ${file.date}\nHolat: ${file.status}\nQaytarish sababi: ${file.rejectReason || 'Mavjud emas'}`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Detail view for a specific researcher's dossier
  if (selectedUser) {
    const userFiles = postDefenseFiles.filter(f => f.username === selectedUser);
    const researcher = researchers.find(r => r.username === selectedUser) || { name: selectedUser, initials: selectedUser[0]?.toUpperCase() || 'T' };
    const pendingCount = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.PENDING).length;
    const approvedCount = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.APPROVED).length;

    return (
      <section className="module-view panel" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="module-toolbar">
          <div>
            <span className="section-kicker" style={{ color: '#0070f3' }}>
              {locale === 'ru' ? 'АТТЕСТАЦИОННОЕ ДЕЛО СОИСКАТЕЛЯ' : locale === 'en' ? "APPLICANT'S ATTESTATION DOSSIER" : 'TALABGOR ATTESTATSIYA HUJJATLARI'}
            </span>
            <h2>{researcher.name}</h2>
            <p>
              {locale === 'ru' 
                ? 'Проверка и подтверждение послезащитных документов соискателя для ВАК.' 
                : locale === 'en' 
                ? 'Review and verification of applicant post-defense documents for HAC.' 
                : 'Tadqiqotchi tomonidan himoyadan so‘ng yuklangan hujjatlarni ekspertizadan o‘tkazish va tasdiqlash.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="secondary-button" onClick={() => setSelectedUser(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> {locale === 'ru' ? 'Назад' : locale === 'en' ? 'Back' : 'Ortga qaytish'}
            </button>
            {pendingCount > 0 && (
              <button className="primary-button" onClick={() => handleAcceptAllForUser(selectedUser)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> {locale === 'ru' ? 'Принять все' : locale === 'en' ? 'Accept All' : 'Barchasini qabul qilish'}
              </button>
            )}
          </div>
        </div>

        {/* Progress header bar */}
        <div style={{ marginTop: '15px', padding: '14px 18px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>
              {userFiles.length} / {POST_DEFENSE_DOCUMENTS.length} {locale === 'ru' ? 'документов загружено' : locale === 'en' ? 'documents uploaded' : 'hujjat yuklangan'}
            </strong>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            <span style={{ color: '#15803d', fontWeight: 600 }}>{approvedCount} ta tasdiqlangan</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            <span style={{ color: '#2563eb', fontWeight: 600 }}>{pendingCount} ta kutilmoqda</span>
          </div>
          <div style={{ width: '200px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((approvedCount / 12) * 100)}%`, height: '100%', background: '#16a34a', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* 12 Document Rows */}
        <div className="document-list" style={{ marginTop: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
          {POST_DEFENSE_DOCUMENTS.map((req, index) => {
            const uploadedFile = userFiles.find(f => f.reqId === req.id);
            const isApproved = uploadedFile?.status === POST_DEFENSE_STATUSES.APPROVED;
            const isRejected = uploadedFile?.status === POST_DEFENSE_STATUSES.REJECTED;

            const title = locale === 'ru' ? req.translations?.ru?.name : locale === 'en' ? req.translations?.en?.name : req.name;
            const cat = locale === 'ru' ? req.translations?.ru?.category : locale === 'en' ? req.translations?.en?.category : req.category;

            return (
              <div 
                key={req.id}
                style={{ 
                  padding: '16px 18px', 
                  borderBottom: index < POST_DEFENSE_DOCUMENTS.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: isRejected ? '#fff8f8' : isApproved ? '#fafffc' : '#fff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '13px' }}>{index + 1}.</span>
                      {req.required ? (
                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>*</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>DSc</span>
                      )}
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{title}</strong>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', paddingLeft: '18px' }}>
                      [ {cat} ]
                    </div>

                    {uploadedFile ? (
                      <div style={{ marginTop: '8px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FileArchive size={15} color="#0070f3" />
                            <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>· {uploadedFile.date}</span>

                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            padding: '3px 8px', 
                            borderRadius: '12px',
                            background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#e0f2fe',
                            color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#0369a1'
                          }}>
                            {uploadedFile.status}
                          </span>
                        </div>

                        {isRejected && uploadedFile.rejectReason && (
                          <div style={{ marginTop: '4px', padding: '6px 12px', background: '#fee2e2', borderRadius: '4px', color: '#991b1b', fontSize: '12px' }}>
                            <strong>{locale === 'ru' ? 'Причина возврата:' : locale === 'en' ? 'Return reason:' : 'Qaytarish sababi:'}</strong> {uploadedFile.rejectReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: '6px', paddingLeft: '18px', fontSize: '12px', color: '#dc2626' }}>
                        {locale === 'ru' ? 'Не загружено соискателем' : locale === 'en' ? 'Not uploaded by applicant' : 'Izlanuvchi tomonidan hali yuklanmagan'}
                      </div>
                    )}
                  </div>

                  {/* Admin action buttons */}
                  {uploadedFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button 
                        className="icon-button" 
                        title={locale === 'ru' ? 'Просмотр' : locale === 'en' ? 'Preview' : 'Ko‘rib chiqish'}
                        onClick={() => setPreviewDoc(uploadedFile)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="icon-button" 
                        title={locale === 'ru' ? 'Скачать' : locale === 'en' ? 'Download' : 'Yuklab olish'}
                        onClick={() => handleDownload(uploadedFile)}
                      >
                        <Download size={16} />
                      </button>

                      {/* Qabul qilish (Approve) button */}
                      <button 
                        className="icon-button" 
                        style={{ 
                          color: isApproved ? '#fff' : '#16a34a', 
                          background: isApproved ? '#16a34a' : 'transparent',
                          borderColor: '#16a34a' 
                        }} 
                        onClick={() => handleApprove(uploadedFile.id)} 
                        title={locale === 'ru' ? 'Принять документ' : locale === 'en' ? 'Approve document' : 'Qabul qilish (Tasdiqlash)'}
                      >
                        <Check size={16} />
                      </button>

                      {/* Qaytarish (Return/Reject with mandatory reason) button */}
                      <button 
                        className="icon-button" 
                        style={{ 
                          color: isRejected ? '#fff' : '#dc2626', 
                          background: isRejected ? '#dc2626' : 'transparent',
                          borderColor: '#dc2626' 
                        }} 
                        onClick={() => {
                          setRejectModalFile(uploadedFile);
                          setRejectReasonText(uploadedFile.rejectReason || '');
                          setRejectError('');
                        }} 
                        title={locale === 'ru' ? 'Вернуть на доработку (с причиной)' : locale === 'en' ? 'Return with reason' : 'Qaytarish (Sabab kiritish bilan)'}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal for returning document with mandatory reason */}
        {rejectModalFile && (
          <div className="modal-backdrop" onClick={() => setRejectModalFile(null)}>
            <div className="researcher-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="modal-top">
                <div>
                  <span className="section-kicker" style={{ color: '#dc2626' }}>
                    {locale === 'ru' ? 'ВОЗВРАТ ДОКУМЕНТА' : locale === 'en' ? 'RETURN DOCUMENT' : 'HUJJATNI QAYTARISH'}
                  </span>
                  <h2>{rejectModalFile.name}</h2>
                </div>
                <button className="icon-button" onClick={() => setRejectModalFile(null)}><X size={19} /></button>
              </div>

              <form onSubmit={handleRejectSubmit} style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  {locale === 'ru' 
                    ? 'Укажите обязательную причину возврата документа. Данный комментарий будет отображен соискателю для повторной загрузки.' 
                    : locale === 'en' 
                    ? 'Provide a mandatory reason for returning the document. This feedback will be displayed to the applicant for re-upload.' 
                    : 'Hujjatni qaytarish sababini yoki undagi kamchiliklarni yozing. Bu izoh tadqiqotchiga ko‘rinadi va u hujjatni qayta yuklashi mumkin bo‘ladi.'}
                </p>

                <label className="input-group">
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {locale === 'ru' ? 'Причина возврата (обязательно):' : locale === 'en' ? 'Return Reason (mandatory):' : 'Qaytarish sababi (majburiy):'} <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <textarea 
                    value={rejectReasonText}
                    onChange={(e) => {
                      setRejectReasonText(e.target.value);
                      if (e.target.value.trim()) setRejectError('');
                    }}
                    rows={4}
                    placeholder={locale === 'ru' ? 'Например: Отсутствует печать или подпись на 3-й странице...' : locale === 'en' ? 'E.g.: Seal or signature missing on page 3...' : 'Masalan: Muhr yoki imzo qo‘yilmagan, sana xato ko‘rsatilgan...'}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      borderRadius: '6px', 
                      border: '1px solid #cbd5e1', 
                      fontSize: '13px', 
                      fontFamily: 'inherit',
                      marginTop: '4px'
                    }}
                    autoFocus
                    required
                  />
                </label>

                {rejectError && (
                  <div style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CircleAlert size={14} /> {rejectError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="secondary-button" onClick={() => setRejectModalFile(null)}>
                    {locale === 'ru' ? 'Отмена' : locale === 'en' ? 'Cancel' : 'Bekor qilish'}
                  </button>
                  <button type="submit" className="primary-button" style={{ background: '#dc2626', borderColor: '#b91c1c' }}>
                    <X size={15} /> {locale === 'ru' ? 'Подтвердить возврат' : locale === 'en' ? 'Confirm Return' : 'Qaytarishni tasdiqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewDoc && (
          <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
            <div className="researcher-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className="modal-top">
                <div>
                  <span className="section-kicker">{locale === 'ru' ? 'ПРОСМОТР ДОКУМЕНТА' : locale === 'en' ? 'DOCUMENT PREVIEW' : 'HUJJATNI KO‘RISH'}</span>
                  <h2>{previewDoc.name}</h2>
                </div>
                <button className="icon-button" onClick={() => setPreviewDoc(null)}><X size={19} /></button>
              </div>

              <div style={{ padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Соискатель:' : locale === 'en' ? 'Applicant:' : 'Tadqiqotchi:'}</span>
                  <strong>{previewDoc.researcherName}</strong>

                  <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Тип документа:' : locale === 'en' ? 'Document Type:' : 'Hujjat turi:'}</span>
                  <strong>{POST_DEFENSE_DOCUMENTS.find(d => d.id === previewDoc.reqId)?.name}</strong>

                  <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Размер файла:' : locale === 'en' ? 'File Size:' : 'Fayl hajmi:'}</span>
                  <span>{(previewDoc.size / (1024 * 1024)).toFixed(2)} MB</span>

                  <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Дата загрузки:' : locale === 'en' ? 'Upload Date:' : 'Yuklangan sana:'}</span>
                  <span>{previewDoc.date}</span>

                  <span style={{ color: '#64748b' }}>{locale === 'ru' ? 'Текущий статус:' : locale === 'en' ? 'Current Status:' : 'Hozirgi holat:'}</span>
                  <span style={{ fontWeight: 'bold', color: previewDoc.status === POST_DEFENSE_STATUSES.APPROVED ? '#15803d' : previewDoc.status === POST_DEFENSE_STATUSES.REJECTED ? '#dc2626' : '#2563eb' }}>
                    {previewDoc.status}
                  </span>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', padding: '20px', textAlign: 'center', marginTop: '10px' }}>
                  <FileText size={42} color="#0070f3" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <button 
                    className="secondary-button" 
                    onClick={() => handleDownload(previewDoc)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} /> {locale === 'ru' ? 'Скачать файл' : locale === 'en' ? 'Download File' : 'Faylni yuklab olish'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  {previewDoc.status !== POST_DEFENSE_STATUSES.APPROVED && (
                    <button 
                      className="primary-button" 
                      onClick={() => {
                        handleApprove(previewDoc.id);
                        setPreviewDoc(null);
                      }}
                      style={{ background: '#16a34a', borderColor: '#15803d' }}
                    >
                      <Check size={15} /> {locale === 'ru' ? 'Принять' : locale === 'en' ? 'Approve' : 'Qabul qilish'}
                    </button>
                  )}
                  <button className="secondary-button" onClick={() => setPreviewDoc(null)}>
                    {locale === 'ru' ? 'Закрыть' : locale === 'en' ? 'Close' : 'Yopish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // Main Admin List View
  const totalFilesCount = postDefenseFiles.length;
  const pendingFilesCount = postDefenseFiles.filter(f => f.status === POST_DEFENSE_STATUSES.PENDING).length;
  const approvedFilesCount = postDefenseFiles.filter(f => f.status === POST_DEFENSE_STATUSES.APPROVED).length;
  const rejectedFilesCount = postDefenseFiles.filter(f => f.status === POST_DEFENSE_STATUSES.REJECTED).length;

  return (
    <section className="module-view panel" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="module-toolbar">
        <div>
          <span className="section-kicker" style={{ color: '#0070f3' }}>
            {locale === 'ru' ? 'ОТДЕЛ АТТЕСТАЦИИ И ВАК' : locale === 'en' ? 'ATTESTATION & HAC DEPARTMENT' : 'ATTESTATSIYA VA OAK BO‘LIMI'}
          </span>
          <h2>
            {locale === 'ru' ? 'Himoyadan keyingi hujjatlar' : locale === 'en' ? 'Post-defense documents' : 'Himoyadan keyingi hujjatlar'}
          </h2>
          <p>
            {locale === 'ru' 
              ? 'Контроль и рассмотрение послезащитных документов соискателей для аттестационных дел ВАК.' 
              : locale === 'en' 
              ? 'Monitoring and evaluation of post-defense documents submitted by researchers.' 
              : 'Tadqiqotchilar tomonidan yuklangan attestatsiya hujjatlarini qabul qilish va qaytarish boshqaruvi.'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`secondary-button ${activeTab === 'researchers' ? 'primary-button' : ''}`}
            onClick={() => setActiveTab('researchers')}
          >
            {locale === 'ru' ? 'По соискателям' : locale === 'en' ? 'By Researchers' : 'Izlanuvchilar kesimida'}
          </button>
          <button 
            className={`secondary-button ${activeTab === 'allFiles' ? 'primary-button' : ''}`}
            onClick={() => setActiveTab('allFiles')}
          >
            {locale === 'ru' ? 'Все загруженные файлы' : locale === 'en' ? 'All Uploaded Files' : 'Barcha hujjatlar'}
          </button>
        </div>
      </div>

      {/* Admin stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'Всего документов' : locale === 'en' ? 'Total Documents' : 'Jami hujjatlar'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>{totalFilesCount} ta ({activeUsers.length} nafar)</div>
        </div>
        <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: '11px', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'В ожидании проверки' : locale === 'en' ? 'Pending Review' : 'Ko‘rib chiqish kutilmoqda'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>{pendingFilesCount} ta hujjat</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'Принято' : locale === 'en' ? 'Approved' : 'Qabul qilingan'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d', marginTop: '4px' }}>{approvedFilesCount} ta</div>
        </div>
        <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <span style={{ fontSize: '11px', color: '#991b1b', textTransform: 'uppercase', fontWeight: 600 }}>{locale === 'ru' ? 'Возвращено на доработку' : locale === 'en' ? 'Returned' : 'Qaytarilgan'}</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>{rejectedFilesCount} ta</div>
        </div>
      </div>

      {/* Tab 1: By Researchers */}
      {activeTab === 'researchers' && (
        <div style={{ marginTop: '25px' }}>
          {activeUsers.length === 0 ? (
            <div className="empty-state" style={{ padding: '50px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <FileArchive size={40} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {locale === 'ru' ? 'Никто из соискателей еще не загрузил послезащитные документы.' : locale === 'en' ? 'No researchers have submitted post-defense documents yet.' : 'Hali hech kim himoyadan keyingi hujjatlarni yuklamagan.'}
              </p>
            </div>
          ) : (
            <div className="table-scroll" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{locale === 'ru' ? 'Соискатель' : locale === 'en' ? 'Researcher' : 'Tadqiqotchi'}</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{locale === 'ru' ? 'Загружено документов' : locale === 'en' ? 'Uploaded Docs' : 'Yuklangan hujjatlar'}</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{locale === 'ru' ? 'Статус рассмотрения' : locale === 'en' ? 'Status' : 'Ko‘rib chiqish holati'}</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>{locale === 'ru' ? 'Действие' : locale === 'en' ? 'Action' : 'Amal'}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.map(username => {
                    const userFiles = postDefenseFiles.filter(f => f.username === username);
                    const researcher = researchers.find(r => r.username === username) || { name: username, initials: username[0]?.toUpperCase() || 'T', color: 'blue' };
                    const pendingCount = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.PENDING).length;
                    const approvedCount = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.APPROVED).length;
                    const rejectedCount = userFiles.filter(f => f.status === POST_DEFENSE_STATUSES.REJECTED).length;

                    return (
                      <tr key={username} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div className="researcher-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`avatar avatar-${researcher.color || 'blue'}`} style={{ width: 34, height: 34 }}>{researcher.initials}</span>
                            <div>
                              <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>{researcher.name}</strong>
                              <small style={{ color: '#64748b' }}>{researcher.field || 'Mustaqil izlanuvchi'}</small>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ fontSize: '13px' }}>{userFiles.length} / 12 ta</strong>
                            <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.round((userFiles.length / 12) * 100)}%`, height: '100%', background: '#0070f3' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {pendingCount > 0 && (
                              <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                {pendingCount} kutilmoqda
                              </span>
                            )}
                            {approvedCount > 0 && (
                              <span style={{ fontSize: '12px', background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                {approvedCount} qabul qilindi
                              </span>
                            )}
                            {rejectedCount > 0 && (
                              <span style={{ fontSize: '12px', background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                {rejectedCount} qaytarildi
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button 
                            className="secondary-button" 
                            onClick={() => setSelectedUser(username)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={15} /> {locale === 'ru' ? 'Проверить дело' : locale === 'en' ? 'Review Dossier' : 'Hujjatlarni ko‘rish'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Uploaded Files List */}
      {activeTab === 'allFiles' && (
        <div style={{ marginTop: '25px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'Kutilmoqda', 'Qabul qilindi', 'Rad etildi'].map(st => (
                <button
                  key={st}
                  className={`secondary-button ${filterStatus === st ? 'primary-button' : ''}`}
                  onClick={() => setFilterStatus(st)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  {st === 'all' ? (locale === 'ru' ? 'Все' : locale === 'en' ? 'All' : 'Barchasi') : st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 10px' }}>
              <Search size={15} color="#64748b" />
              <input 
                type="text" 
                value={searchFilter} 
                onChange={e => setSearchFilter(e.target.value)}
                placeholder={locale === 'ru' ? 'Поиск по соискателю или файлу...' : locale === 'en' ? 'Search researcher or file...' : 'Qidirish...'}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '200px' }}
              />
            </div>
          </div>

          <div className="table-scroll" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{locale === 'ru' ? 'Соискатель' : locale === 'en' ? 'Researcher' : 'Tadqiqotchi'}</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{locale === 'ru' ? 'Hujjat nomi' : locale === 'en' ? 'Document Type' : 'Hujjat turi'}</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{locale === 'ru' ? 'Файл' : locale === 'en' ? 'File' : 'Fayl'}</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{locale === 'ru' ? 'Статус' : locale === 'en' ? 'Status' : 'Holat'}</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>{locale === 'ru' ? 'Действия' : locale === 'en' ? 'Actions' : 'Amallar'}</th>
                </tr>
              </thead>
              <tbody>
                {postDefenseFiles
                  .filter(f => filterStatus === 'all' || f.status === filterStatus)
                  .filter(f => !searchFilter || f.name.toLowerCase().includes(searchFilter.toLowerCase()) || f.researcherName.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map(file => {
                    const reqDef = POST_DEFENSE_DOCUMENTS.find(d => d.id === file.reqId);
                    const isApproved = file.status === POST_DEFENSE_STATUSES.APPROVED;
                    const isRejected = file.status === POST_DEFENSE_STATUSES.REJECTED;

                    return (
                      <tr key={file.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ fontSize: '13px', color: '#1e293b' }}>{file.researcherName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{file.username}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '13px', color: '#334155' }}>{reqDef?.name || file.reqId}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileArchive size={15} color="#0070f3" />
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{file.name}</span>
                          </div>
                          <small style={{ color: '#64748b' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB · {file.date}</small>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            padding: '3px 8px', 
                            borderRadius: '12px',
                            background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#e0f2fe',
                            color: isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#0369a1'
                          }}>
                            {file.status}
                          </span>
                          {isRejected && file.rejectReason && (
                            <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {file.rejectReason}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button className="icon-button" onClick={() => setPreviewDoc(file)} title="Ko‘rish">
                              <Eye size={15} />
                            </button>
                            <button className="icon-button" onClick={() => handleDownload(file)} title="Yuklab olish">
                              <Download size={15} />
                            </button>
                            <button 
                              className="icon-button" 
                              style={{ color: '#16a34a' }} 
                              onClick={() => handleApprove(file.id)} 
                              title="Qabul qilish"
                            >
                              <Check size={15} />
                            </button>
                            <button 
                              className="icon-button" 
                              style={{ color: '#dc2626' }} 
                              onClick={() => {
                                setRejectModalFile(file);
                                setRejectReasonText(file.rejectReason || '');
                                setRejectError('');
                              }} 
                              title="Qaytarish (Izoh bilan)"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
