import { useState } from 'react'
import { AlertCircle, ArrowUpRight, BookOpen, Calendar, Check, CheckCircle2, Clock, Eye, FileCheck, Plus, Printer, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import { REQUIRED_DOCUMENTS } from '../data/expertiseData.js'
import ProtocolModal from './ProtocolModal.jsx'
import { openOrDownloadFile } from '../api/apiService.js'

export default function ExpertiseView({ expertiseCases, setExpertiseCases, onNavigateNizom, researchers = [] }) {
  const [viewMode, setViewMode] = useState('pipeline') // 'pipeline', 'table', 'checklist', 'exempt'
  const [filterDegree, setFilterDegree] = useState('all') // 'all', 'PhD', 'DSc'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCase, setSelectedCase] = useState(null)
  const [protocolCase, setProtocolCase] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  // New application form state
  const [newApplicant, setNewApplicant] = useState({
    researcherName: '',
    degree: 'PhD',
    field: '',
    topic: '',
    supervisor: '',
    isSupervisorDeptHead: false,
    assignedDepartment: '',
    presidingPerson: '',
    applicationDate: new Date().toISOString().slice(0, 10),
    antiplagiarismScore: 90,
    impactFactorArticlesCount: 0,
  })

  // Filtered cases
  const filteredCases = expertiseCases.filter((item) => {
    const matchesSearch = `${item.researcherName} ${item.topic} ${item.field} ${item.supervisor}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesDegree = filterDegree === 'all' || item.degree === filterDegree
    return matchesSearch && matchesDegree
  })

  // Stats calculation
  const totalCount = expertiseCases.length
  const phdCount = expertiseCases.filter((c) => c.degree === 'PhD').length
  const dscCount = expertiseCases.filter((c) => c.degree === 'DSc').length
  const fullDocsCount = expertiseCases.filter((c) => {
    const statuses = Object.values(c.documentsStatus || {})
    return statuses.length === 11 && statuses.every(v => Array.isArray(v) ? v.length > 0 : !!v)
  }).length
  const meetingScheduledCount = expertiseCases.filter((c) => c.status === 'meeting_scheduled').length
  const recommendedCount = expertiseCases.filter((c) => c.status === 'recommended').length
  const exemptCount = expertiseCases.filter((c) => c.hasDirectDefense || c.status === 'exempt_312').length

  const handleCreateCase = (e) => {
    e.preventDefault()
    if (!newApplicant.researcherName.trim()) return

    const initialDocs = {}
    REQUIRED_DOCUMENTS.forEach((doc) => {
      initialDocs[doc.key] = true // initial checked for demo
    })

    const newCase = {
      id: `exp-${Date.now()}`,
      researcherName: newApplicant.researcherName.trim(),
      degree: newApplicant.degree,
      field: newApplicant.field.trim() || 'Ixtisoslik ko‘rsatilmagan',
      topic: newApplicant.topic.trim() || 'Mavzu kiritilmagan',
      supervisor: newApplicant.supervisor.trim() || 'Biriktirilmagan',
      isSupervisorDeptHead: newApplicant.isSupervisorDeptHead,
      assignedDepartment: newApplicant.assignedDepartment.trim() || 'Tegishli kafedra',
      presidingPerson: newApplicant.isSupervisorDeptHead
        ? 'Turdosh kafedra mudiri (13-band talabi)'
        : newApplicant.assignedDepartment + ' boshlig‘i',
      applicationDate: newApplicant.applicationDate,
      meetingDate: null,
      status: 'docs_check',
      documentsStatus: initialDocs,
      lawDraftAttached: /huquq|12\.00/i.test(newApplicant.field),
      reviewers: [
        {
          name: '1-taqrizchi belgilanmoqda',
          organization: 'Kafedra yoki tashqi muassasa',
          isAnonymous: false,
          status: 'pending',
          submittedDate: null,
        },
        {
          name: 'Anonim taqrizchi (9-band talabi)',
          organization: 'Maxfiy / Soha mutaxassisi',
          isAnonymous: true,
          status: 'pending',
          submittedDate: null,
          minFiveYearsExp: true,
        },
      ],
      antiplagiarismScore: Number(newApplicant.antiplagiarismScore) || 90,
      hasDirectDefense:
        newApplicant.degree === 'PhD'
          ? Number(newApplicant.impactFactorArticlesCount) >= 6
          : Number(newApplicant.impactFactorArticlesCount) >= 12,
      impactFactorArticlesCount: Number(newApplicant.impactFactorArticlesCount) || 0,
      notes: 'Yangi ariza qabul qilindi. Hujjatlar tekshiruvda.',
      resolution: null,
    }

    setExpertiseCases([newCase, ...expertiseCases])
    setAddModalOpen(false)
    setNewApplicant({
      researcherName: '',
      degree: 'PhD',
      field: '',
      topic: '',
      supervisor: '',
      isSupervisorDeptHead: false,
      assignedDepartment: '',
      presidingPerson: '',
      applicationDate: new Date().toISOString().slice(0, 10),
      antiplagiarismScore: 90,
      impactFactorArticlesCount: 0,
    })
  }

  const toggleDocument = (caseId, docKey) => {
    setExpertiseCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c
        const currentVal = !!c.documentsStatus?.[docKey]
        const updatedDocs = { ...c.documentsStatus, [docKey]: !currentVal }
        return { ...c, documentsStatus: updatedDocs }
      })
    )
    if (selectedCase && selectedCase.id === caseId) {
      setSelectedCase((prev) => ({
        ...prev,
        documentsStatus: {
          ...prev.documentsStatus,
          [docKey]: !prev.documentsStatus?.[docKey],
        },
      }))
    }
  }

  const updateCaseStatus = (caseId, newStatus, newResolution = null) => {
    setExpertiseCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c
        return {
          ...c,
          status: newStatus,
          resolution: newResolution !== null ? newResolution : c.resolution,
        }
      })
    )
    if (selectedCase && selectedCase.id === caseId) {
      setSelectedCase((prev) => ({
        ...prev,
        status: newStatus,
        resolution: newResolution !== null ? newResolution : prev.resolution,
      }))
    }
  }

  return (
    <div className="expertise-shell">
      {/* Top Header */}
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <i className="live-dot" /> KAFEDRALARARO MUHOKAMA VA EKSPERTIZA MODULI
          </div>
          <h1>Dissertatsiya ishini dastlabki ekspertizadan o‘tkazish</h1>
          <p>
            Universitet Nizomi (II va III boblar, 1-ilova) asosida arizalar, 11 ta hujjat checklisti, taqrizchilar va majlis qarorlari monitoringi
          </p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={onNavigateNizom}>
            <BookOpen size={16} /> Nizom va Me’yorlar
          </button>
          <button className="primary-button" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Yangi ekspertiza arizasi
          </button>
        </div>
      </section>

      {/* Metric Cards */}
      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-top">
            <span>Ekspertizaga taqdim etilganlar</span>
            <span className="metric-icon">
              <FileCheck size={17} />
            </span>
          </div>
          <div className="metric-value">{totalCount}</div>
          <div className="metric-foot">
            {phdCount} PhD (1 oy muddat) <i>·</i> {dscCount} DSc (2 oy muddat)
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>1-ilova bo‘yicha to‘liq hujjatlar</span>
            <span className="metric-icon metric-icon-green">
              <CheckCircle2 size={17} />
            </span>
          </div>
          <div className="metric-value">
            {fullDocsCount}
            <span className="metric-unit">/{totalCount}</span>
          </div>
          <div className="metric-foot">11 ta majburiy hujjat to‘liq qabul qilingan</div>
          <div className="mini-track">
            <i style={{ width: `${totalCount ? (fullDocsCount * 100) / totalCount : 0}%` }} />
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Majlisi belgilangan</span>
            <span className="metric-icon metric-icon-orange">
              <Calendar size={17} />
            </span>
          </div>
          <div className="metric-value">{meetingScheduledCount}</div>
          <div className="metric-foot">Taqrizlar kamida 5 kun oldin berilgan</div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Ilmiy seminarga tavsiya etilgan</span>
            <span className="metric-icon metric-icon-blue">
              <ShieldCheck size={17} />
            </span>
          </div>
          <div className="metric-value">
            {recommendedCount + exemptCount}
            <span className="metric-unit">/{totalCount}</span>
          </div>
          <div className="metric-foot">{exemptCount} ta 312-qaror bo‘yicha himoyasiz</div>
        </article>
      </section>

      {/* Main View Toolbar */}
      <div className="expertise-toolbar panel">
        <div className="toolbar-left">
          <div className="view-mode-tabs">
            <button
              className={`tab-pill ${viewMode === 'pipeline' ? 'active' : ''}`}
              onClick={() => setViewMode('pipeline')}
            >
              Bosqichlar (Pipeline)
            </button>
            <button
              className={`tab-pill ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Jadval ko‘rinishi
            </button>
            <button
              className={`tab-pill ${viewMode === 'checklist' ? 'active' : ''}`}
              onClick={() => setViewMode('checklist')}
            >
              1-ilova 11 ta hujjat nazorati
            </button>
            <button
              className={`tab-pill ${viewMode === 'exempt' ? 'active' : ''}`}
              onClick={() => setViewMode('exempt')}
            >
              <Sparkles size={14} /> 11-band (Himoyasiz daraja)
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="degree-filter">
            <button
              className={filterDegree === 'all' ? 'active' : ''}
              onClick={() => setFilterDegree('all')}
            >
              Barchasi
            </button>
            <button
              className={filterDegree === 'PhD' ? 'active' : ''}
              onClick={() => setFilterDegree('PhD')}
            >
              PhD (1 oy)
            </button>
            <button
              className={filterDegree === 'DSc' ? 'active' : ''}
              onClick={() => setFilterDegree('DSc')}
            >
              DSc (2 oy)
            </button>
          </div>

          <div className="search-field">
            <Search size={15} />
            <input
              placeholder="Izlanuvchi, kafedra yoki mavzu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* View 1: Pipeline / Kanban */}
      {viewMode === 'pipeline' && (
        <div className="pipeline-grid">
          {/* Column 1: Ariza va Hujjat tekshiruvi (5-6-7 bandlar) */}
          <div className="pipeline-col">
            <div className="pipeline-col-header">
              <span className="col-indicator step-1" />
              <h4>1. Hujjatlar tekshiruvi</h4>
              <span className="col-count">
                {filteredCases.filter((c) => c.status === 'docs_check').length}
              </span>
            </div>
            <p className="col-desc">1-ilovadagi 11 ta hujjat to‘liqligi va bildirgi tekshiriladi</p>
            <div className="pipeline-cards">
              {filteredCases
                .filter((c) => c.status === 'docs_check')
                .map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => setSelectedCase(item)}
                    onOpenProtocol={() => setProtocolCase(item)}
                  />
                ))}
              {filteredCases.filter((c) => c.status === 'docs_check').length === 0 && (
                <div className="empty-col">Bu bosqichda ishlar yo‘q</div>
              )}
            </div>
          </div>

          {/* Column 2: Taqrizchilar tayinlash (8-9 bandlar) */}
          <div className="pipeline-col">
            <div className="pipeline-col-header">
              <span className="col-indicator step-2" />
              <h4>2. Taqrizchilar tayinlash</h4>
              <span className="col-count">
                {filteredCases.filter((c) => c.status === 'reviewers_assigned').length}
              </span>
            </div>
            <p className="col-desc">PhD uchun 2, DSc uchun 3 taqrizchi (1 nafari anonim)</p>
            <div className="pipeline-cards">
              {filteredCases
                .filter((c) => c.status === 'reviewers_assigned')
                .map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => setSelectedCase(item)}
                    onOpenProtocol={() => setProtocolCase(item)}
                  />
                ))}
              {filteredCases.filter((c) => c.status === 'reviewers_assigned').length === 0 && (
                <div className="empty-col">Bu bosqichda ishlar yo‘q</div>
              )}
            </div>
          </div>

          {/* Column 3: Kafedralararo majlis (12-21 bandlar) */}
          <div className="pipeline-col">
            <div className="pipeline-col-header">
              <span className="col-indicator step-3" />
              <h4>3. Kafedralararo majlis</h4>
              <span className="col-count">
                {filteredCases.filter((c) => c.status === 'meeting_scheduled').length}
              </span>
            </div>
            <p className="col-desc">Kun tartibi 5 kun oldin tarqatilgan va e’lon qilingan</p>
            <div className="pipeline-cards">
              {filteredCases
                .filter((c) => c.status === 'meeting_scheduled')
                .map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => setSelectedCase(item)}
                    onOpenProtocol={() => setProtocolCase(item)}
                  />
                ))}
              {filteredCases.filter((c) => c.status === 'meeting_scheduled').length === 0 && (
                <div className="empty-col">Bu bosqichda ishlar yo‘q</div>
              )}
            </div>
          </div>

          {/* Column 4: Xulosa va Tavsiya (22-24 bandlar) */}
          <div className="pipeline-col">
            <div className="pipeline-col-header">
              <span className="col-indicator step-4" />
              <h4>4. Ilmiy seminarga tavsiya</h4>
              <span className="col-count">
                {filteredCases.filter((c) => c.status === 'recommended' || c.status === 'exempt_312').length}
              </span>
            </div>
            <p className="col-desc">Ochiq ovoz berilgan, bayonnoma rahbariyat tasdig‘ida</p>
            <div className="pipeline-cards">
              {filteredCases
                .filter((c) => c.status === 'recommended' || c.status === 'exempt_312')
                .map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => setSelectedCase(item)}
                    onOpenProtocol={() => setProtocolCase(item)}
                  />
                ))}
              {filteredCases.filter((c) => c.status === 'recommended' || c.status === 'exempt_312').length === 0 && (
                <div className="empty-col">Bu bosqichda ishlar yo‘q</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View 2: Detailed Table View */}
      {viewMode === 'table' && (
        <div className="panel expertise-table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Talabgor va mavzu</th>
                  <th>Daraja</th>
                  <th>Kafedra va Rais</th>
                  <th>1-ilova hujjatlari</th>
                  <th>Taqrizchilar (Anonim)</th>
                  <th>Holati</th>
                  <th>Harakatlar</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((item) => {
                  const docsCheckedCount = Object.values(item.documentsStatus || {}).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length
                  const hasAnonReviewer = item.reviewers?.some((r) => r.isAnonymous)
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="researcher-cell">
                          <span className={`avatar ${item.degree === 'PhD' ? 'avatar-blue' : 'avatar-dilnoza'}`}>
                            {item.degree}
                          </span>
                          <div>
                            <strong>{item.researcherName}</strong>
                            <small>{item.field}</small>
                            <span className="table-topic-preview">{item.topic}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`degree-tag ${item.degree.toLowerCase()}`}>
                          {item.degree} ({item.degree === 'PhD' ? '1 oy' : '2 oy'})
                        </span>
                      </td>
                      <td>
                        <div className="dept-cell">
                          <strong>{item.assignedDepartment}</strong>
                          <small>
                            Rais: {item.presidingPerson}
                            {item.isSupervisorDeptHead && (
                              <span className="law-warn" title="13-band: Turdosh kafedra mudiri"> (13-band)</span>
                            )}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="docs-badge-cell">
                          <span className={`docs-badge ${docsCheckedCount === 11 ? 'complete' : 'incomplete'}`}>
                            {docsCheckedCount}/11 hujjat
                          </span>
                          {docsCheckedCount === 11 && <Check size={14} className="green-check" />}
                        </div>
                      </td>
                      <td>
                        <div className="reviewers-cell">
                          <span>{item.reviewers?.length || 0} nafar</span>
                          {hasAnonReviewer && <span className="anon-badge">Anonim mavjud</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill status-${item.status}`}>
                          {item.status === 'docs_check' && 'Hujjat tekshiruvida'}
                          {item.status === 'reviewers_assigned' && 'Taqrizda'}
                          {item.status === 'meeting_scheduled' && 'Majlis belgilangan'}
                          {item.status === 'recommended' && 'Tavsiya etilgan'}
                          {item.status === 'exempt_312' && '312-qaror: Ozod etilgan'}
                          {item.status === 'needs_revision' && 'Qayta ishlashga'}
                        </span>
                      </td>
                      <td>
                        <div className="table-row-actions">
                          <button
                            className="icon-button"
                            title="Batafsil va tahrirlash"
                            onClick={() => setSelectedCase(item)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="secondary-button table-protocol-btn"
                            title="Bayonnoma chiqarish"
                            onClick={() => setProtocolCase(item)}
                          >
                            <Printer size={13} /> Bayonnoma
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Checklist Matrix View (1-ilova 11 ta hujjat) */}
      {viewMode === 'checklist' && (
        <div className="panel checklist-matrix-panel">
          <div className="matrix-header">
            <div>
              <span className="section-kicker">1-ILOVA AUDITORI</span>
              <h3>11 ta majburiy hujjatlar qabuli va nazorat matritsasi</h3>
              <p>Har bir talabgor bo‘yicha qaysi hujjatlar topshirilgan va qaysi biri yetishmayotganligini bir qarashda ko‘ring</p>
            </div>
          </div>

          <div className="table-scroll matrix-scroll">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="sticky-col">Talabgor F.I.Sh.</th>
                  <th>Pasport</th>
                  <th>Obyektivka</th>
                  <th>Diplom</th>
                  <th>Dissertatsiya (3 tilda)</th>
                  <th>Rahbar xulosasi</th>
                  <th>3,4-shakl</th>
                  <th>Imtihonlar</th>
                  <th>Amaliyot (2 ta)</th>
                  <th>Antiplagiat</th>
                  <th>Monografiya</th>
                  <th>So‘rovnoma</th>
                  <th>Jami</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const docs = c.documentsStatus || {}
                  const total = Object.values(docs).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length
                  return (
                    <tr key={c.id}>
                      <td className="sticky-col">
                        <strong>{c.researcherName}</strong>
                        <small>{c.degree} · {c.assignedDepartment}</small>
                      </td>
                      {REQUIRED_DOCUMENTS.map((doc) => {
                        const isChecked = !!docs[doc.key]
                        return (
                          <td key={doc.key} className="matrix-cell">
                            <button
                              className={`matrix-chk-btn ${isChecked ? 'checked' : 'missing'}`}
                              onClick={() => toggleDocument(c.id, doc.key)}
                              title={`${doc.title}: ${isChecked ? 'Mavjud (o‘zgartirish uchun bosing)' : 'Yetishmayapti (belgilash uchun bosing)'}`}
                            >
                              {isChecked ? <Check size={14} /> : <X size={13} />}
                            </button>
                          </td>
                        )
                      })}
                      <td className="matrix-total">
                        <span className={`matrix-total-badge ${total === 11 ? 'all-done' : ''}`}>
                          {total}/11
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 4: 11-band OAK 312/6-son qarori bo'yicha himoyasiz ozod etilganlar */}
      {viewMode === 'exempt' && (
        <div className="panel exempt-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">OAK RAYOSATINING 312/6-SON QARORI (11-BAND)</span>
              <h2>Dissertatsiya himoyasisiz ilmiy daraja berish va dastlabki ekspertizadan ozod etish</h2>
              <p>
                Salmoqli ilmiy yangiliklar olgan, yuqori impakt-faktorli xalqaro jurnallarda maqola chop ettirgan mutaxassislar uchun eksperiment
              </p>
            </div>
          </div>

          <div className="exempt-rules-banner">
            <div className="exempt-badge-col">
              <Sparkles size={28} />
              <strong>OAK 312/6</strong>
            </div>
            <div className="exempt-text-col">
              <h4>Me’yoriy talablar:</h4>
              <ul>
                <li><b>Fan doktori (DSc):</b> Kamida <b>12 ta</b> (ijtimoiy-gumanitar sohalarda <b>8 ta</b>) nufuzli xalqaro impakt-faktorli jurnalda maqola + amaliyotga joriy etish talabi.</li>
                <li><b>Falsafa doktori (PhD):</b> Kamida <b>6 ta</b> (ijtimoiy-gumanitar sohalarda <b>4 ta</b>) nufuzli xalqaro impakt-faktorli jurnalda maqola.</li>
                <li><b>Natija:</b> Mazkur talablarni bajargan talabgorlar <u>dissertatsiyani dastlabki ekspertizadan o‘tkazishdan to‘liq ozod etiladi</u>.</li>
              </ul>
            </div>
          </div>

          <div className="exempt-list">
            <h3>Tizimdagi nomzodlar ko‘rsatkichlari:</h3>
            <div className="exempt-cards-grid">
              {filteredCases.map((c) => {
                const reqCount = c.degree === 'PhD' ? 6 : 12
                const articles = c.impactFactorArticlesCount || 0
                const isExempt = articles >= reqCount || c.hasDirectDefense

                return (
                  <div key={c.id} className={`exempt-candidate-card ${isExempt ? 'qualifies' : ''}`}>
                    <div className="candidate-top">
                      <div>
                        <strong>{c.researcherName}</strong>
                        <small>{c.degree} · {c.field}</small>
                      </div>
                      <span className={`exempt-status-badge ${isExempt ? 'active' : ''}`}>
                        {isExempt ? 'OZOD ETILGAN' : 'Oddiy tartibda'}
                      </span>
                    </div>

                    <div className="candidate-articles-meter">
                      <div className="meter-label">
                        <span>Xalqaro impakt-faktorli maqolalar soni:</span>
                        <strong>{articles} / {reqCount} ta talab</strong>
                      </div>
                      <div className="meter-bar">
                        <i style={{ width: `${Math.min(100, (articles * 100) / reqCount)}%` }} />
                      </div>
                    </div>

                    {isExempt ? (
                      <p className="exempt-note success">
                        <CheckCircle2 size={15} /> 11-bandga asosan dastlabki ekspertizadan ozod etiladi va to‘g‘ridan-to‘g‘ri Ilmiy kengashga tavsiya etiladi.
                      </p>
                    ) : (
                      <p className="exempt-note pending">
                        <Clock size={15} /> To‘liq ekspertiza tartibi (II va III boblar bo‘yicha) talab etiladi.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected Case Drawer / Modal */}
      {selectedCase && (
        <CaseDetailsModal
          item={selectedCase}
          onClose={() => setSelectedCase(null)}
          onToggleDoc={(docKey) => toggleDocument(selectedCase.id, docKey)}
          onUpdateStatus={(status, res) => updateCaseStatus(selectedCase.id, status, res)}
          onOpenProtocol={() => {
            setProtocolCase(selectedCase)
            setSelectedCase(null)
          }}
        />
      )}

      {/* Protocol Printing Modal */}
      {protocolCase && (
        <ProtocolModal
          expertiseCase={protocolCase}
          onClose={() => setProtocolCase(null)}
        />
      )}

      {/* Add New Application Modal */}
      {addModalOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAddModalOpen(false) }}>
          <div className="add-modal expertise-add-modal" role="dialog">
            <div className="modal-top">
              <div>
                <span className="section-kicker">YANGI EKSPERTIZA ISHI</span>
                <h2>Dastlabki ekspertizaga ariza qabul qilish</h2>
              </div>
              <button className="icon-button" onClick={() => setAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCase}>
              <div className="add-form-grid">
                <label>
                  Talabgor F.I.Sh.*
                  <select
                    required
                    value={newApplicant.researcherName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const person = researchers.find(p => p.name === selectedName);
                      setNewApplicant({
                        ...newApplicant,
                        researcherName: selectedName,
                        topic: person?.field || '',
                        supervisor: person?.supervisor || ''
                      });
                    }}
                  >
                    <option value="">Izlanuvchini tanlang...</option>
                    {researchers.map(person => (
                      <option key={person.username || person.name} value={person.name}>{person.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Talab qilinayotgan ilmiy daraja*
                  <select
                    value={newApplicant.degree}
                    onChange={(e) => setNewApplicant({ ...newApplicant, degree: e.target.value })}
                  >
                    <option value="PhD">Falsafa doktori (PhD) — 1 oyda ekspertiza</option>
                    <option value="DSc">Fan doktori (DSc) — 2 oyda ekspertiza</option>
                  </select>
                </label>

                <label className="full-width">
                  Dissertatsiya mavzusi*
                  <input
                    required
                    value={newApplicant.topic}
                    onChange={(e) => setNewApplicant({ ...newApplicant, topic: e.target.value })}
                    placeholder="Dissertatsiya to‘liq mavzusi..."
                  />
                </label>

                <label>
                  Ixtisoslik shifri va nomi*
                  <input
                    required
                    value={newApplicant.field}
                    onChange={(e) => setNewApplicant({ ...newApplicant, field: e.target.value })}
                    placeholder="Masalan, 12.00.01 — Davlat va huquq nazariyasi"
                  />
                </label>

                <label>
                  Ilmiy rahbar (maslahatchi)*
                  <input
                    required
                    value={newApplicant.supervisor}
                    onChange={(e) => setNewApplicant({ ...newApplicant, supervisor: e.target.value })}
                    placeholder="prof. Familiyasi I.O."
                  />
                </label>

                <label>
                  Biriktirilgan kafedra*
                  <input
                    required
                    value={newApplicant.assignedDepartment}
                    onChange={(e) => setNewApplicant({ ...newApplicant, assignedDepartment: e.target.value })}
                    placeholder="Kafedra nomi..."
                  />
                </label>

                <label>
                  Bildirgi / Ariza sanasi (6-band)*
                  <input
                    type="date"
                    required
                    value={newApplicant.applicationDate}
                    onChange={(e) => setNewApplicant({ ...newApplicant, applicationDate: e.target.value })}
                  />
                </label>

                <div className="checkbox-row full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newApplicant.isSupervisorDeptHead}
                      onChange={(e) => setNewApplicant({ ...newApplicant, isSupervisorDeptHead: e.target.checked })}
                    />
                    <span>
                      <strong>13-band: Ilmiy rahbar kafedra boshlig‘i hisoblanadi</strong>
                      <small>Bunday holatda majlisga turdosh kafedra mudiri yoki professori raislik qilishi shart</small>
                    </span>
                  </label>
                </div>

                <label>
                  Antiplagiat originallik ko‘rsatkichi (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newApplicant.antiplagiarismScore}
                    onChange={(e) => setNewApplicant({ ...newApplicant, antiplagiarismScore: e.target.value })}
                  />
                </label>

                <label>
                  Xalqaro impakt-faktorli maqolalar soni (11-band tekshiruvi)
                  <input
                    type="number"
                    min="0"
                    value={newApplicant.impactFactorArticlesCount}
                    onChange={(e) => setNewApplicant({ ...newApplicant, impactFactorArticlesCount: e.target.value })}
                  />
                </label>
              </div>

              <div className="modal-hint">
                <AlertCircle size={16} />
                <span>
                  Nizomning 5-bandiga muvofiq, 1-ilovada ko‘rsatilgan 11 ta hujjat to‘liq topshirilgandan so‘ng ish kafedralararo muhokamaga qabul qilinadi.
                </span>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setAddModalOpen(false)}>{locale === 'ru' ? 'Отмена' : locale === 'en' ? 'Cancel' : 'Bekor qilish'}</button>
                <button type="submit" className="primary-button">
                  <Plus size={16} /> Ekspertiza ishini ochish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PipelineCard({ item, onSelect, onOpenProtocol }) {
  const docsCount = Object.values(item.documentsStatus || {}).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length

  return (
    <div className="pipeline-card" onClick={onSelect}>
      <div className="pipeline-card-top">
        <span className={`degree-tag ${item.degree.toLowerCase()}`}>
          {item.degree} · {item.degree === 'PhD' ? '1 oy' : '2 oy'}
        </span>
        <span className="card-docs-pill">
          {docsCount}/11 hujjat
        </span>
      </div>

      <h5 className="card-title">{item.researcherName}</h5>
      <p className="card-topic">{item.topic}</p>

      <div className="card-meta">
        <div>
          <span>Kafedra:</span>
          <strong>{item.assignedDepartment}</strong>
        </div>
        <div>
          <span>Rahbar:</span>
          <strong>{item.supervisor}</strong>
        </div>
        {item.isSupervisorDeptHead && (
          <div className="law-warn-banner">
            13-band: Turdosh kafedra mudiri raislik qiladi
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="card-antispam">
          Asillik: <b>{item.antiplagiarismScore}%</b>
        </span>
        <button
          className="text-link card-link"
          onClick={(e) => {
            e.stopPropagation()
            onOpenProtocol()
          }}
        >
          Bayonnoma <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  )
}

function CaseDetailsModal({ item, onClose, onToggleDoc, onUpdateStatus, onOpenProtocol }) {
  const isLaw = /huquq|12\.00/i.test(item.field)
  const docsCount = Object.values(item.documentsStatus || {}).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="case-detail-modal" role="dialog">
        <div className="modal-top">
          <div>
            <div className="eyebrow">{item.degree} EKSPERTIZA ISHI № {item.id}</div>
            <h2>{item.researcherName}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="case-detail-scroll">
          {/* Main Info */}
          <div className="case-info-box">
            <div><strong>{locale === 'ru' ? 'Тема:' : locale === 'en' ? 'Theme:' : 'Mavzu:'}</strong> <span>{item.topic}</span></div>
            <div><strong>Ixtisoslik:</strong> <span>{item.field}</span></div>
            <div><strong>{locale === 'ru' ? 'Научный руководитель:' : locale === 'en' ? 'Supervisor:' : 'Ilmiy rahbar:'}</strong> <span>{item.supervisor}</span></div>
            <div><strong>Kafedra:</strong> <span>{item.assignedDepartment}</span></div>
            <div><strong>Majlis raisi (13-band):</strong> <span>{item.presidingPerson}</span></div>
            <div><strong>Antiplagiat asilligi:</strong> <span>{item.antiplagiarismScore}%</span></div>
            <div><strong>Arizasi sanasi (6-band):</strong> <span>{item.applicationDate}</span></div>
            <div><strong>Majlis o‘tkazish sanasi:</strong> <span>{item.meetingDate || 'Hali belgilanmagan'}</span></div>
          </div>

          {/* 13-band specific warning */}
          {item.isSupervisorDeptHead && (
            <div className="case-notice-alert">
              <AlertCircle size={18} />
              <div>
                <strong>Nizomning 13-bandi qat’iy talabi:</strong>
                <p>
                  Kafedra boshlig‘i ilmiy rahbarligida himoya qilinayotgan dissertatsiya muhokamasida turdosh kafedra boshlig‘i (o‘rinbosari) yoki turdosh kafedra professori majlisga raislik qilishi lozim.
                </p>
              </div>
            </div>
          )}

          {/* 1-ilova 11 ta hujjat checklist */}
          <div className="case-section">
            <div className="case-section-head">
              <h4>1-ilova: Taqdim etilgan hujjatlar ro‘yxati ({docsCount}/11)</h4>
              <small>Hujjat qabul qilinganini belgilash uchun ustiga bosing</small>
            </div>

            <div className="case-docs-grid">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const statusVal = item.documentsStatus?.[doc.key]
                const isChecked = Array.isArray(statusVal) ? statusVal.length > 0 : !!statusVal
                
                return (
                  <div key={doc.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      type="button"
                      className={`case-doc-btn ${isChecked ? 'active' : ''}`}
                      onClick={() => {
                        if (Array.isArray(statusVal)) return
                        onToggleDoc(doc.key)
                      }}
                      style={{ width: '100%', cursor: Array.isArray(statusVal) ? 'default' : 'pointer' }}
                    >
                      <span className="chk-box">{isChecked ? <Check size={14} /> : null}</span>
                      <div className="doc-desc">
                        <strong>{doc.id}. {doc.title}</strong>
                        <small>{doc.note}</small>
                      </div>
                    </button>
                    {Array.isArray(statusVal) && statusVal.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                        {statusVal.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => openOrDownloadFile(file.fileUrl || file.url, file.name)}
                            style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11.5, padding: '4px 8px', background: '#e3ebe5', border: 'none', borderRadius: 4, color: '#21483a', cursor: 'pointer' }}
                            title="Yuklab olish / ko'rish"
                          >
                            <Eye size={13} style={{ marginRight: 4 }} /> {file.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {isLaw && (
              <div className="law-special-note">
                <strong>* Yuridik fanlar talabi:</strong> Talabgor tomonidan ishlab chiqilgan qonun loyihasi va alohida uslubiy-metodika ilova qilinishi lozim.
              </div>
            )}
          </div>

          {/* Taqrizchilar bo'limi (8, 9, 10 bandlar) */}
          <div className="case-section">
            <div className="case-section-head">
              <h4>Taqrizchilar tayinlash (9-band talabi)</h4>
              <small>PhD uchun 2 ta (1 anonim), DSc uchun 3 ta (1 anonim)</small>
            </div>

            <div className="reviewers-list-box">
              {item.reviewers?.map((rev, idx) => (
                <div key={idx} className="case-reviewer-row">
                  <div className="reviewer-info">
                    <div className="reviewer-title">
                      {rev.isAnonymous ? <span className="anon-tag">ANONIM TAQRIZCHI</span> : <strong>{rev.name}</strong>}
                    </div>
                    <small>{rev.organization} · {rev.minFiveYearsExp ? '5+ yillik amaliy tajribaga ega' : 'Ilmiy darajali olim'}</small>
                  </div>
                  <div className="reviewer-status">
                    <span className={`rev-status-tag ${rev.status}`}>
                      {rev.status === 'approved' ? 'Taqriz ijobiy topshirildi' : 'Taqriz kutilmoqda'}
                    </span>
                    <small>Kamida 5 kun oldin beriladi (9-band)</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kafedralararo majlis qarori (22, 23, 24 bandlar) */}
          <div className="case-section">
            <div className="case-section-head">
              <h4>Kafedralararo majlis qarori va xulosasi (23-band)</h4>
            </div>

            <div className="status-change-buttons">
              <button
                className={`decision-btn recommend ${item.resolution === 'dissertatsiya keyingi bosqichga tavsiya etilsin' ? 'selected' : ''}`}
                onClick={() => onUpdateStatus('recommended', 'dissertatsiya keyingi bosqichga tavsiya etilsin')}
              >
                <CheckCircle2 size={16} />
                <span>Dissertatsiya keyingi bosqichga (Ilmiy seminarga) tavsiya etilsin</span>
              </button>

              <button
                className={`decision-btn revise ${item.resolution === 'dissertatsiya qayta ishlash uchun tavsiya etilsin' ? 'selected' : ''}`}
                onClick={() => onUpdateStatus('needs_revision', 'dissertatsiya qayta ishlash uchun tavsiya etilsin')}
              >
                <Clock size={16} />
                <span>Dissertatsiya qayta ishlash uchun tavsiya etilsin (kamida 1 oy)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions case-modal-actions">
          <button className="secondary-button" onClick={onOpenProtocol}>
            <Printer size={15} /> Bayonnomani ko‘rish va chop etish (14-band)
          </button>
          <button className="primary-button" onClick={onClose}>
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}
