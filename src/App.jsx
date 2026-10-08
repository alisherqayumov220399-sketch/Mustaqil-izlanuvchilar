import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, Bell, BookOpen, Check, ChevronDown, ChevronRight, CircleAlert, ClipboardCheck, Copy, Eye, FileCheck, FileText, KeyRound, LayoutDashboard, LockKeyhole, LogOut, Menu, Pencil, Plus, RotateCcw, Search, Settings2, Sheet, ShieldCheck, Trash2, Upload, UsersRound, X } from 'lucide-react'
import readXlsxFile from 'read-excel-file/browser'
import writeXlsxFile from 'write-excel-file/browser'
import ExpertiseView from './components/ExpertiseView.jsx'
import NizomView from './components/NizomView.jsx'
import { INITIAL_EXPERTISE_CASES, REQUIRED_DOCUMENTS } from './data/expertiseData.js'
import { STUDY_PLANS } from './data/studyPlanData.js'
import { KengashStudentView, KengashAdminView } from './components/KengashView.jsx'
import { PostDefenseStudentView, PostDefenseAdminView } from './components/PostDefenseView.jsx'
import ExecutiveDashboard from './components/ExecutiveDashboard.jsx'
import {
  INITIAL_RESEARCHERS,
  INITIAL_ACCOUNTS,
  INITIAL_MONITORING_REPORTS,
  INITIAL_MONITORING_FILES,
  INITIAL_KENGASH_FILES,
  INITIAL_POST_DEFENSE_FILES,
  INITIAL_ACTIVITY_LOG
} from './data/initialData.js'
import './App.css'

function readRoute() {
  const hash = (window.location.hash || '').toLowerCase().replace(/^#/, '')
  if (!hash) return { page: 'overview', stage: 1 }

  // Check stage pattern like #plans-stage-2 or #monitoring-stage-3
  const stageMatch = hash.match(/(?:plans|monitoring|rejalar)-stage-([123])/)
  const stage = stageMatch ? Number(stageMatch[1]) : 1

  const cleanHash = hash.replace(/-stage-[123]/, '')

  // Full Route Aliasing to eliminate 404 / blank screens
  const aliasMap = {
    overview: 'overview',
    bosh: 'overview',
    asosiy: 'overview',
    dashboard: 'overview',

    people: 'people',
    researchers: 'people',
    izlanuvchilar: 'people',
    talabgorlar: 'people',

    plans: 'plans',
    monitoring: 'plans',
    rejalar: 'plans',
    reja: 'plans',

    expertise: 'expertise',
    'dastlabki-ekspertiza': 'expertise',
    muhokama: 'expertise',

    seminar: 'seminar',
    seminarga: 'seminar',
    'ilmiy-seminar': 'seminar',

    kengash: 'kengash',
    kengashga: 'kengash',
    'bir-martalik-kengash': 'kengash',

    post_defense: 'post_defense',
    'post-defense': 'post_defense',
    postdefense: 'post_defense',
    himoya: 'post_defense',
    oak: 'post_defense',

    nizom: 'nizom',
    regulations: 'nizom',
    meyorlar: 'nizom',

    analytics: 'analytics',
    reports: 'analytics',
    tahlil: 'analytics',
    statistika: 'analytics',

    settings: 'settings',
    sozlamalar: 'settings',

    login: 'login',
    kirish: 'login',
  }

  const page = aliasMap[cleanHash] || 'overview'
  return { page, stage }
}

function normalizeHeader(value) {
  return String(value ?? '').trim().toLocaleLowerCase().replace(/[‘’ʻʼ`]/g, '').replace(/[^a-zа-яёўғқҳ0-9]+/g, '')
}

function stageFromAdmissionYear(value, currentYear = new Date().getFullYear()) {
  const year = value instanceof Date
    ? value.getFullYear()
    : Number(String(value ?? '').match(/\b(?:19|20)\d{2}\b/)?.[0])
  if (!year) return null
  return Math.min(3, Math.max(1, currentYear - year + 1))
}

function currentAcademicYear(date = new Date()) {
  const year = date.getFullYear()
  const startYear = date.getMonth() >= 8 ? year : year - 1
  return `${startYear}–${startYear + 1}`
}

function excelValue(researcher, aliases) {
  const entry = Object.entries(researcher?.excelData || {}).find(([header]) => aliases.includes(normalizeHeader(header)))
  return entry?.[1] ?? ''
}

function valueProgress(value) {
  const text = String(value ?? '').trim().toLocaleLowerCase()
  if (!text) return null
  const percent = text.match(/(\d+(?:[.,]\d+)?)\s*%/)
  if (percent) return Math.min(100, Number(percent[1].replace(',', '.')))
  const numeric = Number(text.replace(',', '.'))
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 100) return numeric
  if (/(yo'q|yo‘q|mavjud emas|bajarilmadi|topshirilmagan|rad etildi|no|false)/.test(text)) return 0
  if (/(jarayon|ko'rib chiqilmoqda|ko‘rib chiqilmoqda|kutilmoqda|tayyorlan|qisman)/.test(text)) return 50
  if (/(bajarildi|bajarilgan|topshirildi|tasdiqlandi|e'lon qilindi|chop etildi|muvaffaqiyatli|o'tdi|o‘tdi)/.test(text) || /^(ha|yes|true)$/.test(text)) return 100
  return null
}

function researcherProgress(researcher) {
  if (!researcher) return null
  if (!researcher.excelData) return Number.isFinite(researcher.progress) ? researcher.progress : null
  const monitored = [
    excelValue(researcher, ['monitoring2025']),
    excelValue(researcher, ['monitoring2026']),
    excelValue(researcher, ['yakkatartibdagireja']),
    excelValue(researcher, ['bajarganligi']),
    excelValue(researcher, ['oakkbyulletene`lonqilinganligi', 'oakbyulletene`lonqilinganligi']),
    excelValue(researcher, ['ixtisoslikimtihoni']),
    excelValue(researcher, ['chettilibo`yicha', 'chettiliboyicha']),
    excelValue(researcher, ['qoshimchaimtihon']),
    excelValue(researcher, ['amaliyotgajoriyqilingan']),
  ].map(valueProgress).filter((score) => score !== null)
  return monitored.length ? Math.round(monitored.reduce((sum, score) => sum + score, 0) / monitored.length) : null
}

function researcherStatus(researcher) {
  const progress = researcherProgress(researcher)
  if (progress === null) return null
  if (progress < 40) return 'atRisk'
  if (progress < 70) return 'needsReview'
  return 'inProgress'
}

function getResearcherStatusText(researcher, locale = 'uz') {
  const status = researcherStatus(researcher)
  const map = {
    uz: { inProgress: 'Reja bo‘yicha', needsReview: 'Ko‘rib chiqish kerak', atRisk: 'E’tibor kerak', unknown: 'Ma’lumot yo‘q' },
    ru: { inProgress: 'По плану', needsReview: 'Требует проверки', atRisk: 'Требует внимания', unknown: 'Нет данных' },
    en: { inProgress: 'On track', needsReview: 'Needs review', atRisk: 'Needs attention', unknown: 'No data' }
  }
  return map[locale]?.[status || 'unknown'] || map.uz[status || 'unknown']
}

function makeCredentials(name, existingAccounts) {
  const base = name.normalize('NFKD').toLocaleLowerCase().replace(/[‘’ʻʼ`]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'izlanuvchi'
  const usernames = new Set(existingAccounts.map((account) => account.username))
  let username = base
  let suffix = 2
  while (usernames.has(username)) username = `${base}${suffix++}`
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const random = new Uint8Array(14)
  window.crypto.getRandomValues(random)
  const password = Array.from(random, (value) => alphabet[value % alphabet.length]).join('')
  return { username, password }
}

function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    try { localStorage.setItem('theme', theme) } catch { }
    document.body.className = theme + '-mode'
  }, [theme])

  const [locale, setLocale] = useState(() => {
    try { return localStorage.getItem('ilm_locale') || 'uz' } catch { return 'uz' }
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_locale', locale) } catch { }
  }, [locale])

  const [route, setRoute] = useState(readRoute)
  const { page, stage } = route
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [seminarMenuOpen, setSeminarMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newField, setNewField] = useState('')
  const [newStage, setNewStage] = useState('1')

  // Accounts state - Single Source of Truth
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_accounts')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_ACCOUNTS
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_accounts', JSON.stringify(accounts)) } catch { }
  }, [accounts])

  // Researchers state - Single Source of Truth
  const [researchers, setResearchers] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_researchers')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_RESEARCHERS
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_researchers', JSON.stringify(researchers)) } catch { }
  }, [researchers])

  // Expertise Cases state - Single Source of Truth
  const [expertiseCases, setExpertiseCases] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_expertise_cases')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_EXPERTISE_CASES
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_expertise_cases', JSON.stringify(expertiseCases)) } catch { }
  }, [expertiseCases])

  // Monitoring files state
  const [monitoringFiles, setMonitoringFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_monitoring_files')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_MONITORING_FILES
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_monitoring_files', JSON.stringify(monitoringFiles)) } catch { }
  }, [monitoringFiles])

  // Monitoring reports state
  const [monitoringReports, setMonitoringReports] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_monitoring_reports')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_MONITORING_REPORTS
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_monitoring_reports', JSON.stringify(monitoringReports)) } catch { }
  }, [monitoringReports])

  // Kengash files state
  const [kengashFiles, setKengashFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_kengash_files')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_KENGASH_FILES
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_kengash_files', JSON.stringify(kengashFiles)) } catch { }
  }, [kengashFiles])

  // Post defense files state
  const [postDefenseFiles, setPostDefenseFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_post_defense_files')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_POST_DEFENSE_FILES
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_post_defense_files', JSON.stringify(postDefenseFiles)) } catch { }
  }, [postDefenseFiles])

  // Activity log state
  const [activityLog, setActivityLog] = useState(() => {
    try {
      const saved = localStorage.getItem('ilm_activity_log')
      if (saved) return JSON.parse(saved)
    } catch { }
    return INITIAL_ACTIVITY_LOG
  })
  useEffect(() => {
    try { localStorage.setItem('ilm_activity_log', JSON.stringify(activityLog)) } catch { }
  }, [activityLog])

  const [credentialResult, setCredentialResult] = useState([])
  const [credentialModalOpen, setCredentialModalOpen] = useState(false)
  const [selectedResearcher, setSelectedResearcher] = useState(null)
  const [editingResearcher, setEditingResearcher] = useState(null)
  const [normativeDocuments, setNormativeDocuments] = useState([])
  const [normativeError, setNormativeError] = useState('')
  const normativeInputRef = useRef(null)
  const [importError, setImportError] = useState('')
  const [loginError, setLoginError] = useState('')
  const importInputRef = useRef(null)

  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ilm_auth')) } catch { return null }
  })
  const updateAuthUser = (user) => {
    setAuthUser(user)
    if (user) {
      try { localStorage.setItem('ilm_auth', JSON.stringify(user)) } catch { }
    } else {
      try { localStorage.removeItem('ilm_auth') } catch { }
    }
  }

  function logActivity(name, action) {
    setActivityLog((items) => [{ id: crypto.randomUUID(), name, action, time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) }, ...items].slice(0, 10))
  }

  const labels = {
    uz: ['Umumiy ko‘rinish', 'Izlanuvchilar', 'Monitoring', 'Hisobotlar', 'Tahlil va statistika', 'Sozlamalar', 'Ilmiy faoliyat monitoringi', 'Xayrli kun', 'Izlanuvchi qo‘shish', 'Jami izlanuvchilar', 'Reja bo‘yicha', 'Ko‘rib chiqish kerak', 'Bu chorakda topshirildi', 'Umumiy bajarilish', 'So‘nggi faollik', 'Izlanuvchilar ro‘yxati', 'Ilmiy yo‘nalish', 'Ilmiy rahbar', 'Bajarilish', 'Holati', 'Jarayonda', 'Tasdiq kutilmoqda', 'E’tibor kerak', 'Yaqin muddatlar', 'Filtr', 'Eksport', 'Barchasi'],
    ru: ['Обзор', 'Соискатели', 'Мониторинг', 'Отчёты', 'Аналитика', 'Настройки', 'Мониторинг научной деятельности', 'Добрый день', 'Добавить соискателя', 'Всего соискателей', 'По плану', 'Требуют проверки', 'Сдано в этом квартале', 'Общий прогресс', 'Последняя активность', 'Список соискателей', 'Научное направление', 'Руководитель', 'Выполнение', 'Статус', 'В процессе', 'Ожидает подтверждения', 'Требует внимания', 'Ближайшие сроки', 'Фильтр', 'Экспорт', 'Все'],
    en: ['Overview', 'Researchers', 'Monitoring', 'Reports', 'Analytics', 'Settings', 'Research activity monitoring', 'Good day', 'Add researcher', 'Total researchers', 'On track', 'Needs review', 'Submitted this quarter', 'Overall completion', 'Recent activity', 'Researchers', 'Research area', 'Supervisor', 'Progress', 'Status', 'In progress', 'Awaiting approval', 'Needs attention', 'Upcoming deadlines', 'Filter', 'Export', 'All'],
  }
  const [overview, people, plans, reports, analytics, settings, intro, , add, , , , , , , peopleList, fieldLabel, supervisorLabel, progressLabel, statusLabel, , , , , filterLabel, exportLabel] = labels[locale] || labels.uz

  const currentTitle = {
    overview,
    people,
    plans,
    expertise: locale === 'ru' ? 'Предварительная экспертиза' : locale === 'en' ? 'Preliminary Expertise' : 'Dastlabki ekspertiza (Kafedralararo muhokama)',
    nizom: locale === 'ru' ? 'Нормы и требования' : locale === 'en' ? 'Norms and Requirements' : 'Nizom va Me’yoriy talablar',
    seminar: locale === 'ru' ? 'Научный семинар' : locale === 'en' ? 'Scientific Seminar' : 'Ilmiy seminarga',
    kengash: locale === 'ru' ? 'Разовый совет' : locale === 'en' ? 'One-time Council' : 'Bir martalik kengashga',
    post_defense: locale === 'ru' ? 'Послезащитные документы' : locale === 'en' ? 'Post-defense Documents' : 'Himoyadan keyingi hujjatlar',
    reports,
    analytics,
  }[page] || settings

  const academicYear = currentAcademicYear()

  const filtered = useMemo(() => {
    return researchers.filter((person) => {
      const textMatch = `${person.name} ${person.field} ${person.supervisor}`.toLowerCase().includes(query.toLowerCase())
      const statusMatch = filter === 'all' || filter === researcherStatus(person)
      return textMatch && statusMatch
    })
  }, [filter, query, researchers])

  const stageDetails = useMemo(() => {
    return [
      { id: 1, focus: 'Tadqiqot mavzusini aniqlash va ilmiy adabiyotlar tahlili', target: 'Tadqiqot metodologiyasi va adabiyotlar sharhini yakunlash' },
      { id: 2, focus: 'Tajriba va ma’lumotlarni yig‘ish, maqolalar tayyorlash', target: 'Ilmiy natijalarni tahlil qilish va maqolalarni chop etish' },
      { id: 3, focus: 'Natijalarni umumlashtirish va dissertatsiya himoyasi', target: 'Dissertatsiya matnini yakunlab, himoyaga tayyorlash' },
    ].map((item) => {
      const members = researchers.filter((person) => person.stage === item.id)
      const progressValues = members.map(researcherProgress).filter((value) => value !== null)
      return {
        ...item,
        count: members.length,
        progress: progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0
      }
    })
  }, [researchers])

  const scoredResearchers = useMemo(() => {
    return researchers.map((person) => ({
      person,
      progress: researcherProgress(person),
      status: researcherStatus(person)
    }))
  }, [researchers])

  const attentionResearchers = useMemo(() => {
    return scoredResearchers.filter(({ progress }) => progress !== null && progress < 70).slice(0, 3)
  }, [scoredResearchers])

  const navItemsBefore = [
    { key: 'overview', title: overview, icon: LayoutDashboard },
    { key: 'people', title: people, icon: UsersRound, badge: researchers.length },
    { key: 'plans', title: plans, icon: ClipboardCheck },
    { key: 'expertise', title: 'Dastlabki ekspertiza', icon: ShieldCheck, badge: expertiseCases.length },
  ]

  const navItemsAfter = [
    { key: 'nizom', title: 'Nizom va Me’yorlar', icon: BookOpen },
    { key: 'analytics', title: analytics, icon: Settings2 },
  ]

  useEffect(() => {
    const syncRoute = () => setRoute(readRoute())
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  function navigateTo(nextPage, nextStage = stage) {
    const nextHash = nextPage === 'plans' ? `#plans-stage-${nextStage}` : `#${nextPage}`
    if (window.location.hash === nextHash) {
      setRoute(readRoute())
      return
    }
    window.location.hash = nextHash
  }

  function setPage(nextPage) {
    navigateTo(nextPage)
  }

  function createResearcher(event) {
    event.preventDefault()
    if (!newName.trim()) return
    const credentials = makeCredentials(newName.trim(), accounts)
    const newId = `res-${Date.now()}`
    const researcher = {
      id: newId,
      name: newName.trim(),
      initials: newName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
      color: 'blue',
      field: newField.trim() || 'Yo‘nalish belgilanmagan',
      supervisor: 'Biriktirilmagan',
      progress: 0,
      status: 'inProgress',
      due: 'Yangi profil',
      stage: Number(newStage),
      username: credentials.username
    }
    setResearchers((items) => [researcher, ...items])
    logActivity(researcher.name, 'tizimga qo‘shildi')
    setAccounts((items) => [...items, { ...credentials, researcherName: researcher.name, stage: researcher.stage, role: 'researcher' }])
    setCredentialResult([{ ...credentials, researcherName: researcher.name, stage: researcher.stage }])
    setCredentialModalOpen(true)
    setNewName('')
    setNewField('')
    setNewStage('1')
    setModalOpen(false)
  }

  function saveResearcher(event) {
    event.preventDefault()
    if (!editingResearcher) return
    const formData = new FormData(event.currentTarget)
    const excelData = Object.fromEntries(Array.from(formData.entries()).filter(([key]) => key !== '__stage'))
    const readColumn = (aliases) => {
      const entry = Object.entries(excelData).find(([key]) => aliases.includes(normalizeHeader(key)))
      return String(entry?.[1] ?? '').trim()
    }
    const name = readColumn(['fio', 'fish', 'fullname', 'name', 'izlanuvchi', 'familiyasiismivaotasiningismi', 'familiyasiismiotasiningismi']) || editingResearcher.name
    const field = readColumn(['ilmiyyonalish', 'ilmiyyunalish', 'mavzularinomlanishi', 'mavzunomlanishi', 'mavzu', 'tadqiqotmavzusi']) || editingResearcher.field
    const supervisor = readColumn(['ilmiyrahbar', 'ilmiyrahbarifish', 'rahbarifish', 'rahbar']) || editingResearcher.supervisor
    const admissionOrder = readColumn(['qabulqilingansanavabuyruq', 'qabulbuyrugi']) || editingResearcher.admissionOrder
    const stageVal = stageFromAdmissionYear(admissionOrder) || Number(formData.get('__stage') || editingResearcher.stage)
    const updated = { ...editingResearcher, name, field, supervisor, admissionOrder, stage: stageVal, excelData }

    // Cascade updates across all related stores
    setResearchers((items) => items.map((person) => (person.id === editingResearcher.id || person.username === editingResearcher.username) ? updated : person))
    setAccounts((items) => items.map((acc) => (acc.username === editingResearcher.username || acc.researcherName === editingResearcher.name) ? { ...acc, researcherName: name, stage: stageVal } : acc))
    setExpertiseCases((items) => items.map((c) => c.researcherName === editingResearcher.name ? { ...c, researcherName: name, field, supervisor } : c))
    setMonitoringReports((items) => items.map((r) => r.username === editingResearcher.username ? { ...r, fio: name, stage: String(stageVal) } : r))
    setPostDefenseFiles((items) => items.map((f) => f.username === editingResearcher.username ? { ...f, researcherName: name } : f))

    logActivity(name, 'profil ma’lumotlari yangilandi')
    setSelectedResearcher(updated)
    setEditingResearcher(null)
  }

  function deleteResearcher(researcher) {
    if (!window.confirm(`${researcher.name} ma’lumotlarini o‘chirishni tasdiqlaysizmi? Unga tegishli barcha modullardagi yozuvlar ham tozalanadi.`)) return
    const uname = researcher.username
    const rname = researcher.name

    // Cascade deletion across all stores to eliminate orphaned records
    setResearchers((items) => items.filter((person) => person.id !== researcher.id && person.username !== uname))
    setAccounts((items) => items.filter((acc) => acc.username !== uname && acc.researcherName !== rname))
    setExpertiseCases((items) => items.filter((c) => c.researcherName !== rname))
    setMonitoringFiles((items) => items.filter((f) => f.username !== uname))
    setMonitoringReports((items) => items.filter((r) => r.username !== uname && r.fio !== rname))
    setKengashFiles((items) => items.filter((f) => f.username !== uname))
    setPostDefenseFiles((items) => items.filter((f) => f.username !== uname))

    logActivity(rname, 'tizimdan o‘chirildi')
    setSelectedResearcher(null)
    setEditingResearcher(null)
  }

  function restoreDemoData() {
    if (!window.confirm("Barcha namunaviy ma'lumotlarni qayta tiklashni xohlaysizmi? Mavjud kiritilgan test ma'lumotlar asl holiga qaytadi.")) return
    setResearchers(INITIAL_RESEARCHERS)
    setAccounts(INITIAL_ACCOUNTS)
    setExpertiseCases(INITIAL_EXPERTISE_CASES)
    setMonitoringFiles(INITIAL_MONITORING_FILES)
    setMonitoringReports(INITIAL_MONITORING_REPORTS)
    setKengashFiles(INITIAL_KENGASH_FILES)
    setPostDefenseFiles(INITIAL_POST_DEFENSE_FILES)
    setActivityLog(INITIAL_ACTIVITY_LOG)
    localStorage.setItem('ilm_researchers', JSON.stringify(INITIAL_RESEARCHERS))
    localStorage.setItem('ilm_accounts', JSON.stringify(INITIAL_ACCOUNTS))
    localStorage.setItem('ilm_expertise_cases', JSON.stringify(INITIAL_EXPERTISE_CASES))
    localStorage.setItem('ilm_monitoring_files', JSON.stringify(INITIAL_MONITORING_FILES))
    localStorage.setItem('ilm_monitoring_reports', JSON.stringify(INITIAL_MONITORING_REPORTS))
    localStorage.setItem('ilm_kengash_files', JSON.stringify(INITIAL_KENGASH_FILES))
    localStorage.setItem('ilm_post_defense_files', JSON.stringify(INITIAL_POST_DEFENSE_FILES))
    localStorage.setItem('ilm_activity_log', JSON.stringify(INITIAL_ACTIVITY_LOG))
    alert("Namunaviy ma'lumotlar muvaffaqiyatli tiklandi!")
  }

  function uploadNormativeDocuments(event) {
    const selected = Array.from(event.target.files || [])
    const accepted = selected.filter((file) => /\.(pdf|doc|docx)$/i.test(file.name) && file.size <= 10 * 1024 * 1024)
    const rejected = selected.filter((file) => !accepted.includes(file))
    setNormativeError(rejected.map((file) => `${file.name}: PDF, DOC, DOCX va 10 MB gacha bo‘lgan fayllar qabul qilinadi.`).join(' '))
    setNormativeDocuments((items) => [...accepted.map((file) => ({ id: crypto.randomUUID(), file })), ...items])
    event.target.value = ''
  }

  async function importResearchers(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImportError('')
    try {
      if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Faqat .xlsx formatidagi Excel faylni tanlang.')
      const workbook = await readXlsxFile(file)
      const rows = workbook[0]?.data || []
      const headerRowIndex = rows.findIndex((row) => row.some((value) => String(value ?? '').trim()))
      if (headerRowIndex < 0) throw new Error('Excel faylda sarlavha qatori topilmadi.')
      const headers = rows[headerRowIndex].map(normalizeHeader)
      const columns = {
        name: ['fio', 'fish', 'fullname', 'name', 'izlanuvchi', 'izlanuvchifish', 'familiyasiismivaotasiningismi', 'familiyasiismiotasiningismi', 'тўлиқисм', 'фиш'],
        field: ['ilmiyyonalish', 'ilmiyyunalish', 'ilmiyyonalishi', 'yunalish', 'yonalish', 'tadqiqotmavzusi', 'ilmiyishmavzusi', 'mavzu', 'mavzularinomlanishi', 'mavzularnomlanishi', 'mavzunomlanishi', 'researcharea', 'topic', 'йуналиш', 'мавзу'],
        supervisor: ['ilmiyrahbar', 'ilmiyrahbarifish', 'rahbarifish', 'rahbar', 'supervisor', 'advisor', 'раҳбар'],
        stage: ['bosqich', 'bosqichraqami', 'talimbosqichi', 'oqishbosqichi', 'kurs', 'stage', 'studyyear', 'босқич'],
        educationType: ['talimturi', 'educationtype'],
        specialtyCode: ['ixtisoslikshifri', 'ixtisoslikkodi', 'specialtycode'],
        councilDecision: ['universitetkengashqarori', 'kengashqarori'],
        admissionOrder: ['qabulqilingansanavabuyruq', 'qabulbuyrugi'],
        workplace: ['ishjoyi', 'workplace'],
        position: ['lavozimi', 'lavozim', 'position'],
        department: ['biriktirilgankafedrasi', 'kafedra', 'department'],
        monitoring2025: ['monitoring2025'],
        monitoring2026: ['monitoring2026'],
        phone: ['telraqami', 'telefonraqami', 'telefon', 'phone'],
      }
      const indexes = Object.fromEntries(Object.entries(columns).map(([key, aliases]) => [key, headers.findIndex((header) => aliases.includes(header))]))
      if (indexes.name < 0) throw new Error('F.I.Sh, To‘liq ism yoki Name ustuni topilmadi.')
      const newResearchers = []
      const newAccounts = []
      const knownResearchers = new Set(researchers.map((person) => normalizeHeader(person.name)))
      let skippedDuplicates = 0
      for (const row of rows.slice(headerRowIndex + 1)) {
        const name = String(row[indexes.name] ?? '').trim()
        const normalizedName = normalizeHeader(name)
        if (!name) continue
        if (knownResearchers.has(normalizedName)) {
          skippedDuplicates += 1
          continue
        }
        knownResearchers.add(normalizedName)
        const stageText = indexes.stage >= 0 ? String(row[indexes.stage] ?? '') : ''
        const parsedStage = Number(stageText.match(/(?:^|\D)([123])(?:\s*[-.]?\s*(?:bosqich|kurs|yil)|\s*$)/i)?.[1] || 0)
        const admissionOrder = indexes.admissionOrder >= 0 ? row[indexes.admissionOrder] : ''
        const stageValue = parsedStage ? Math.min(3, Math.max(1, parsedStage)) : stageFromAdmissionYear(admissionOrder) || 1
        const credentials = makeCredentials(name, [...accounts, ...newAccounts])
        const excelData = Object.fromEntries(rows[headerRowIndex].map((header, columnIndex) => [String(header ?? '').trim(), row[columnIndex] ?? '']))
        const importedProgress = researcherProgress({ excelData })
        const researcher = {
          id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name,
          initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
          color: 'blue',
          field: indexes.field >= 0 ? String(row[indexes.field] ?? '').trim() || 'Yo‘nalish belgilanmagan' : 'Yo‘nalish belgilanmagan',
          supervisor: indexes.supervisor >= 0 ? String(row[indexes.supervisor] ?? '').trim() || 'Biriktirilmagan' : 'Biriktirilmagan',
          educationType: indexes.educationType >= 0 ? String(row[indexes.educationType] ?? '').trim() : '',
          specialtyCode: indexes.specialtyCode >= 0 ? String(row[indexes.specialtyCode] ?? '').trim() : '',
          workplace: indexes.workplace >= 0 ? String(row[indexes.workplace] ?? '').trim() : '',
          position: indexes.position >= 0 ? String(row[indexes.position] ?? '').trim() : '',
          department: indexes.department >= 0 ? String(row[indexes.department] ?? '').trim() : '',
          admissionOrder: String(admissionOrder ?? '').trim(),
          monitoring2025: indexes.monitoring2025 >= 0 ? String(row[indexes.monitoring2025] ?? '').trim() : '',
          monitoring2026: indexes.monitoring2026 >= 0 ? String(row[indexes.monitoring2026] ?? '').trim() : '',
          phone: indexes.phone >= 0 ? String(row[indexes.phone] ?? '').trim() : '',
          excelData,
          progress: importedProgress,
          status: 'inProgress',
          due: 'Yangi profil',
          stage: stageValue,
          username: credentials.username,
        }
        newResearchers.push(researcher)
        newAccounts.push({ ...credentials, researcherName: name, stage: stageValue, role: 'researcher' })
      }
      if (!newResearchers.length) throw new Error(skippedDuplicates ? 'Ushbu fayldagi barcha izlanuvchilar avval import qilingan.' : 'Import qilish uchun ism ko‘rsatilgan qator topilmadi.')
      setResearchers((items) => [...newResearchers, ...items])
      newResearchers.forEach((person) => logActivity(person.name, 'Excel orqali import qilindi'))
      setAccounts((items) => [...items, ...newAccounts])
      setCredentialResult(newAccounts)
      setCredentialModalOpen(true)
    } catch (error) {
      setImportError(error.message || 'Faylni o‘qishda xatolik yuz berdi.')
    } finally {
      event.target.value = ''
    }
  }

  async function exportCredentialsToExcel(customList = null) {
    const listToExport = (Array.isArray(customList) && customList.length > 0)
      ? customList
      : (credentialResult && credentialResult.length > 0)
        ? credentialResult
        : accounts.filter(a => a.role === 'researcher' || a.researcherName);

    if (!listToExport || listToExport.length === 0) {
      alert(locale === 'ru' ? 'Нет доступных аккаунтов соискателей для экспорта.' : locale === 'en' ? 'No researcher accounts available to export.' : 'Yuklab olish uchun izlanuvchilar akkauntlari mavjud emas.');
      return;
    }

    const headerRow = [
      { value: '№', fontWeight: 'bold', align: 'center', backgroundColor: '#e2e8f0' },
      { value: 'F.I.Sh (Izlanuvchi)', fontWeight: 'bold', backgroundColor: '#e2e8f0' },
      { value: 'Bosqich', fontWeight: 'bold', align: 'center', backgroundColor: '#e2e8f0' },
      { value: 'Tizim Logini', fontWeight: 'bold', backgroundColor: '#e2e8f0' },
      { value: 'Parol', fontWeight: 'bold', backgroundColor: '#e2e8f0' },
      { value: 'Kafedra', fontWeight: 'bold', backgroundColor: '#e2e8f0' },
      { value: 'Ilmiy rahbar', fontWeight: 'bold', backgroundColor: '#e2e8f0' }
    ];

    const dataRows = listToExport.map((item, idx) => {
      const res = researchers.find(r => r.username === item.username || r.name === item.researcherName);
      return [
        { value: idx + 1, align: 'center' },
        { value: String(item.researcherName || item.name || res?.name || '').trim() },
        { value: `${item.stage || res?.stage || 1}-bosqich`, align: 'center' },
        { value: String(item.username || '').trim() },
        { value: String(item.password || 'otktf2026').trim() },
        { value: String(res?.department || item.department || 'Biriktirilmagan').trim() },
        { value: String(res?.supervisor || item.supervisor || 'Biriktirilmagan').trim() }
      ];
    });

    const sheetData = [headerRow, ...dataRows];
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `izlanuvchilar-login-parollari-${timestamp}.xlsx`;

    try {
      await writeXlsxFile(sheetData, {
        fileName,
        columns: [
          { width: 6 },
          { width: 36 },
          { width: 14 },
          { width: 22 },
          { width: 22 },
          { width: 32 },
          { width: 30 }
        ]
      }).toFile(fileName);
      addActivityLog(`Izlanuvchilar login va parollari Excel fayl shaklida yuklab olindi (${listToExport.length} ta)`);
    } catch (err) {
      console.error('Excel yozishda xatolik:', err);
      try {
        const fallbackRows = [
          ['№', 'F.I.Sh', 'Bosqich', 'Login', 'Parol', 'Kafedra', 'Ilmiy rahbar'],
          ...listToExport.map((item, idx) => {
            const res = researchers.find(r => r.username === item.username || r.name === item.researcherName);
            return [
              idx + 1,
              String(item.researcherName || item.name || res?.name || ''),
              `${item.stage || res?.stage || 1}-bosqich`,
              String(item.username || ''),
              String(item.password || 'otktf2026'),
              String(res?.department || item.department || ''),
              String(res?.supervisor || item.supervisor || '')
            ];
          })
        ];
        const blob = await writeXlsxFile(fallbackRows).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (fallbackErr) {
        alert('Excel faylni saqlashda xatolik yuz berdi: ' + (err.message || fallbackErr.message));
      }
    }
  }

  // Backward compatibility alias
  const saveCredentials = exportCredentialsToExcel;

  if (!authUser) {
    return <UnifiedLogin onLogin={(role, username, password) => {
      if (role === 'admin') {
        if (username === 'JXUOTKTF' && password === 'otktf202') {
          setLoginError('')
          updateAuthUser({ role: 'admin' })
        } else {
          setLoginError('Admin logini yoki parol noto‘g‘ri.')
        }
      } else {
        const account = accounts.find((item) => item.username === username.trim() && item.password === password)
        if (account) {
          setLoginError('')
          updateAuthUser({ role: 'researcher', ...account })
        } else setLoginError('Tadqiqotchi logini yoki parol noto‘g‘ri.')
      }
    }} error={loginError} locale={locale} />
  }

  if (authUser.role === 'researcher') {
    return <ResearcherWorkspace user={authUser} normativeDocuments={normativeDocuments} expertiseCases={expertiseCases} setExpertiseCases={setExpertiseCases} onLogout={() => updateAuthUser(null)} monitoringFiles={monitoringFiles} setMonitoringFiles={setMonitoringFiles} monitoringReports={monitoringReports} setMonitoringReports={setMonitoringReports} kengashFiles={kengashFiles} setKengashFiles={setKengashFiles} postDefenseFiles={postDefenseFiles} setPostDefenseFiles={setPostDefenseFiles} theme={theme} setTheme={setTheme} accounts={accounts} setAccounts={setAccounts} updateAuthUser={updateAuthUser} locale={locale} setLocale={setLocale} />
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#overview" onClick={() => setPage('overview')}><img src="./logo.jpg" alt="Logo" className="brand-logo" /><span className="brand-name">{locale === 'ru' ? 'Республика Узбекистан' : locale === 'en' ? 'Republic of Uzbekistan' : 'O‘zbekiston Respublikasi'}<br />{locale === 'ru' ? 'Университет общественной безопасности' : locale === 'en' ? 'University of Public Safety' : 'Jamoat xavfsizligi universiteti'}<br />{locale === 'ru' ? 'Факультет послевузовского образования' : locale === 'en' ? 'Faculty of Postgraduate Education' : 'Oliy ta\'limdan keyingi ta\'lim fakulteti'}</span></a>
      <div className="workspace-label" style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{locale === 'ru' ? 'НАУЧНАЯ ДЕЯТЕЛЬНОСТЬ' : locale === 'en' ? 'RESEARCH ACTIVITY' : 'ILMIY FAOLIYAT'}</div>

      <nav className="side-nav" aria-label="Asosiy navigatsiya">
        {navItemsBefore.map(({ key, title, icon: Icon, badge }) => <button key={key} type="button" className={`nav-item ${page === key ? 'nav-active' : ''}`} onClick={() => { setPage(key); setMobileNavOpen(false) }}><Icon size={18} /><span>{title}</span>{badge ? <i className="nav-count">{badge}</i> : null}</button>)}
        <div className="nav-dropdown">
          <button type="button" className={`nav-item ${(page === 'seminar' || page === 'kengash') ? 'nav-active' : ''}`} onClick={() => setSeminarMenuOpen(!seminarMenuOpen)}>
            <UsersRound size={18} />
            <span style={{flex: 1, textAlign: 'left', whiteSpace: 'normal', lineHeight: '1.2'}}>{locale === 'ru' ? 'Научный семинар / совет' : locale === 'en' ? 'Scientific Seminar / Council' : 'Ilmiy seminarga / kengashga'}</span>
            <ChevronDown size={16} style={{ transform: seminarMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }} />
          </button>
          {seminarMenuOpen && (
            <div className="nav-submenu" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 8px 4px 36px' }}>
              <button type="button" className={`nav-item ${page === 'seminar' ? 'nav-active' : ''}`} onClick={() => { setPage('seminar'); setMobileNavOpen(false) }} style={{ padding: '8px 12px', fontSize: '13px', minHeight: 'auto' }}>
                <span style={{ width: '5px', height: '5px', background: 'currentColor', borderRadius: '50%', marginRight: '8px', opacity: 0.6 }}></span> {locale === 'ru' ? 'Научный семинар' : locale === 'en' ? 'Scientific Seminar' : 'Ilmiy seminarga'}
              </button>
              <button type="button" className={`nav-item ${page === 'kengash' ? 'nav-active' : ''}`} onClick={() => { setPage('kengash'); setMobileNavOpen(false) }} style={{ padding: '8px 12px', fontSize: '13px', minHeight: 'auto' }}>
                <span style={{ width: '5px', height: '5px', background: 'currentColor', borderRadius: '50%', marginRight: '8px', opacity: 0.6 }}></span> {locale === 'ru' ? 'Разовый совет' : locale === 'en' ? 'One-time Council' : 'Bir martalik kengashga'}
              </button>
            </div>
          )}
        </div>
        <button type="button" className={`nav-item ${page === 'post_defense' ? 'nav-active' : ''}`} onClick={() => { setPage('post_defense'); setMobileNavOpen(false) }}>
          <FileCheck size={18} />
          <span>{locale === 'ru' ? 'Послезащитные документы' : locale === 'en' ? 'Post-defense documents' : 'Himoyadan keyingi hujjatlar'}</span>
          {postDefenseFiles.filter(f => f.status === 'Kutilmoqda').length > 0 && (
            <i className="nav-count">{postDefenseFiles.filter(f => f.status === 'Kutilmoqda').length}</i>
          )}
        </button>
        {navItemsAfter.map(({ key, title, icon: Icon, badge }) => <button key={key} type="button" className={`nav-item ${page === key ? 'nav-active' : ''}`} onClick={() => { setPage(key); setMobileNavOpen(false) }}><Icon size={18} /><span>{title}</span>{badge ? <i className="nav-count">{badge}</i> : null}</button>)}
      </nav>
      <div className="sidebar-bottom"><button className="nav-item settings-item" onClick={() => setPage('settings')}><Settings2 size={18} /><span>{settings}</span></button><button className="profile-button" onClick={() => updateAuthUser(null)}><span className="avatar avatar-admin">A</span><span className="profile-info"><strong>{locale === 'ru' ? 'Администратор' : locale === 'en' ? 'Administrator' : 'Administrator'}</strong><small>{locale === 'ru' ? 'Выход' : locale === 'en' ? 'Logout' : 'Tizimdan chiqish'}</small></span><LogOut size={15} /></button></div>
    </aside>
    {mobileNavOpen && <button className="nav-scrim" aria-label="Menyuni yopish" onClick={() => setMobileNavOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" aria-label="Menyuni ochish" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>{locale === 'ru' ? 'Научная деятельность' : locale === 'en' ? 'Research Activity' : 'Ilmiy faoliyat'}</span><ChevronRight size={14} /><strong>{currentTitle}</strong></div><div className="topbar-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === 'en' ? 'Search researchers or topics' : locale === 'ru' ? 'Поиск по соискателю или теме' : 'Izlanuvchi yoki mavzu bo‘yicha qidirish'} /><kbd>⌘ K</kbd></label><div className="locale-picker" aria-label="Interfeys tili">{['uz', 'ru', 'en'].map((language) => <button key={language} className={locale === language ? 'locale-active' : ''} onClick={() => setLocale(language)}>{language.toUpperCase()}</button>)}</div><div className="notification-wrap"><button className="icon-button notification-button" aria-label="Bildirishnomalar" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={19} />{attentionResearchers.length > 0 && <i />}</button>{notificationsOpen && <div className="notification-popover"><strong>Monitoring ogohlantirishlari</strong>{attentionResearchers.length ? attentionResearchers.map(({ person, progress }) => <p key={person.username || person.name}><CircleAlert size={16} /> {person.name} · {progress}% bajarilgan</p>) : <p>Excel ma’lumotlarida e’tibor talab qiladigan holat topilmadi.</p>}</div>}</div><button className="avatar avatar-dilnoza top-avatar" aria-label="Profil">D</button></div></header>
      <div className={`page-content ${page === 'overview' ? 'dashboard-page' : 'module-page-content'}`}>
        {credentialModalOpen && <CredentialDialog entries={credentialResult} onClose={() => setCredentialModalOpen(false)} onExport={saveCredentials} onLogin={() => { setCredentialModalOpen(false); navigateTo('login') }} locale={locale} />}
        {page !== 'overview' && (
          <section className="page-heading">
            <div>
              <div className="eyebrow"><i className="live-dot" /> {academicYear} o‘quv yili · Tizim integratsiyasi to‘liq faol</div>
              <h1>{currentTitle}</h1>
              <p>{intro}</p>
            </div>
            <div className="heading-actions">
              <button className="secondary-button" onClick={() => window.print()}><ArrowDownToLine size={16} />{exportLabel}</button>
              {page === 'people' && <button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={17} />{add}</button>}
            </div>
          </section>
        )}
        {page === 'people' && (
          <section className="import-toolbar">
            <div>
              <span className="import-icon"><Sheet size={17} /></span>
              <span>
                <strong>{locale === 'ru' ? 'Импорт из Excel' : locale === 'en' ? 'Import from Excel' : 'Excel fayldan import'}</strong>
                <small>
                  {locale === 'ru'
                    ? 'При импорте соискателей автоматически генерируются логины и пароли. Вы можете скачать их файлом Excel.'
                    : locale === 'en'
                    ? 'When importing researchers, logins and passwords are automatically generated. You can download them as an Excel file.'
                    : 'Monitoring va hisobotlar import qilingan Excel qiymatlaridan jonli hisoblanadi. Hosil bo‘lgan login va parollarni Excel fayl shaklida yuklab olishingiz mumkin.'}
                </small>
              </span>
            </div>
            <input ref={importInputRef} className="visually-hidden" type="file" accept=".xlsx" onChange={importResearchers} />
            <div className="import-actions">
              <button className="secondary-button" onClick={() => importInputRef.current?.click()}>
                <Upload size={15} />{locale === 'ru' ? 'Импорт Excel' : locale === 'en' ? 'Excel Import' : 'Excel import'}
              </button>
              <button
                className="secondary-button"
                onClick={() => exportCredentialsToExcel()}
                title="Barcha yoki yangi import qilingan izlanuvchilar login va parollarini Excel (.xlsx) shaklida yuklab olish"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowDownToLine size={15} />
                {locale === 'ru' ? 'Скачать логины и пароли (.xlsx)' : locale === 'en' ? 'Export Logins & Passwords (.xlsx)' : 'Login va parollarni yuklab olish (.xlsx)'}
              </button>
              <button className="text-link" onClick={() => navigateTo('login')}>
                <LockKeyhole size={14} />{locale === 'ru' ? 'Вход для соискателей' : locale === 'en' ? 'Researcher Login' : 'Izlanuvchi kirishi'}
              </button>
            </div>
            {importError && <p className="import-error"><CircleAlert size={14} />{importError}</p>}
          </section>
        )}

        {page === 'overview' && (
          <ExecutiveDashboard
            researchers={researchers}
            stageDetails={stageDetails}
            monitoringFiles={monitoringFiles}
            monitoringReports={monitoringReports}
            expertiseCases={expertiseCases}
            kengashFiles={kengashFiles}
            postDefenseFiles={postDefenseFiles}
            activityLog={activityLog}
            academicYear={academicYear}
            locale={locale}
            navigateTo={navigateTo}
            setSelectedResearcher={setSelectedResearcher}
            setModalOpen={setModalOpen}
            importInputRef={importInputRef}
            onExportCredentials={() => exportCredentialsToExcel()}
          />
        )}
        {page === 'people' && <section className="module-view panel"><div className="module-toolbar"><div><span className="section-kicker">{locale === 'ru' ? 'БАЗА СОИСКАТЕЛЕЙ' : locale === 'en' ? 'RESEARCHER DATABASE' : 'TADQIQOTCHILAR BAZASI'}</span><h2>{peopleList}</h2><p>{filtered.length} ta izlanuvchi ko‘rsatilmoqda</p></div><div style={{ position: 'relative' }}><button className="filter-button" onClick={() => setFilterOpen((open) => !open)}><Settings2 size={15} />{filterLabel}</button>{filterOpen && <div className="filter-popover" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', minWidth: 160, display: 'flex', flexDirection: 'column', gap: 2 }}><button type="button" style={{ padding: '6px 10px', textAlign: 'left', background: filter === 'all' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => { setFilter('all'); setFilterOpen(false); }}>{allLabel} ({researchers.length})</button><button type="button" style={{ padding: '6px 10px', textAlign: 'left', background: filter === 'inProgress' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => { setFilter('inProgress'); setFilterOpen(false); }}>Reja bo‘yicha</button><button type="button" style={{ padding: '6px 10px', textAlign: 'left', background: filter === 'needsReview' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => { setFilter('needsReview'); setFilterOpen(false); }}>Ko‘rib chiqish kerak</button><button type="button" style={{ padding: '6px 10px', textAlign: 'left', background: filter === 'atRisk' ? '#eff6ff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }} onClick={() => { setFilter('atRisk'); setFilterOpen(false); }}>E’tibor kerak</button></div>}</div></div><div className="table-scroll"><table><thead><tr><th>{people}</th><th>{fieldLabel}</th><th>{supervisorLabel}</th><th>{locale === 'ru' ? 'Этап' : locale === 'en' ? 'Stage' : 'Bosqich'}</th><th>{progressLabel}</th><th>{statusLabel}</th><th>{locale === 'ru' ? 'Данные Excel' : locale === 'en' ? 'Excel data' : 'Excel ma’lumotlari'}</th></tr></thead><tbody>{filtered.map((person) => <tr key={person.username || person.name}><td><div className="researcher-cell"><span className={`avatar avatar-${person.color}`}>{person.initials}</span><span><strong>{person.name}</strong><small>{person.educationType || 'Izlanuvchi'}</small></span></div></td><td>{person.field}</td><td>{person.supervisor}</td><td>{person.stage}-bosqich</td><td><ResearcherProgress researcher={person} /></td><td><ResearcherStatus researcher={person} locale={locale} /></td><td><button className="icon-button details-button" aria-label={`${person.name} ma’lumotlarini ko‘rish`} onClick={() => setSelectedResearcher(person)}><Eye size={15} /></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state">Izlanuvchilar ro‘yxati bo‘sh. Excel fayl import qiling yoki "Izlanuvchi qo‘shish" tugmasini bosing.</div>}</div></section>}

        {selectedResearcher && <ResearcherDetails researcher={selectedResearcher} accounts={accounts} onClose={() => setSelectedResearcher(null)} onEdit={() => { setEditingResearcher(selectedResearcher); setSelectedResearcher(null) }} onDelete={() => deleteResearcher(selectedResearcher)} locale={locale} navigateTo={navigateTo} />}
        {editingResearcher && <ResearcherEditDialog researcher={editingResearcher} onClose={() => setEditingResearcher(null)} onSave={saveResearcher} locale={locale} />}

        {page === 'plans' && <AdminMonitoringView files={monitoringFiles} reports={monitoringReports} setReports={setMonitoringReports} researchers={researchers} selectedStage={stage} locale={locale} />}
        {page === 'seminar' && <div className="portal-content" style={{padding: '20px'}}><KengashAdminView kengashFiles={kengashFiles} setKengashFiles={setKengashFiles} researchers={researchers} isSeminar={true} locale={locale} /></div>}
        {page === 'kengash' && <div className="portal-content" style={{padding: '20px'}}><KengashAdminView kengashFiles={kengashFiles} setKengashFiles={setKengashFiles} researchers={researchers} locale={locale} /></div>}
        {page === 'post_defense' && <div className="portal-content" style={{padding: '20px'}}><PostDefenseAdminView postDefenseFiles={postDefenseFiles} setPostDefenseFiles={setPostDefenseFiles} researchers={researchers} locale={locale} /></div>}

        {page === 'analytics' && <section className="module-view analytics-view"><div className="analytics-heading"><span className="section-kicker">{locale === 'ru' ? 'ЗА 3 ГОДА' : locale === 'en' ? 'OVER 3 YEARS' : '3 YILLIK KESIMDA'}</span><h2>{locale === 'ru' ? 'Показатели по этапам' : locale === 'en' ? 'Metrics by stages' : 'Bosqichlar bo‘yicha ko‘rsatkichlar'}</h2><p>{locale === 'ru' ? 'Выполнение индивидуальных планов соискателями' : locale === 'en' ? 'Fulfillment of individual plans by researchers' : 'Izlanuvchilarning individual rejalar bajarilishi'}</p></div><div className="analytics-stage-grid">{stageDetails.map((item) => <button key={item.id} className="panel analytics-stage" onClick={() => navigateTo('plans', item.id)}><span className="analytics-stage-top"><span>{item.id}-{locale === 'ru' ? 'этап' : locale === 'en' ? 'stage' : 'bosqich'}</span><ArrowUpRight size={16} /></span><strong>{item.progress}%</strong><span className="analytics-stage-bar"><i style={{ width: `${item.progress}%` }} /></span><small>{item.count} {locale === 'ru' ? 'соискателей · среднее выполнение' : locale === 'en' ? 'researchers · average completion' : 'nafar izlanuvchi · rejalar o‘rtacha bajarilishi'}</small><span className="analytics-stage-focus">{item.focus}</span></button>)}</div></section>}

        {page === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section className="module-view panel settings-view">
              <span className="section-kicker">{locale === 'ru' ? 'УПРАВЛЕНИЕ СИСТЕМОЙ' : locale === 'en' ? 'SYSTEM MANAGEMENT' : 'TIZIM BOSHQARUVI'}</span>
              <h2>{settings}</h2>
              <p>{locale === 'ru' ? 'Настройки факультета и отдела' : locale === 'en' ? 'Faculty and Department Settings' : 'Fakultet va bo‘lim sozlamalari'}</p>
              
              <div className="settings-row">
                <span><strong>{locale === 'ru' ? 'Университет' : locale === 'en' ? 'University' : 'Universitet'}</strong><small>{locale === 'ru' ? 'Название организации в системе' : locale === 'en' ? 'Organization name displayed in the system' : 'Tizimda ko‘rsatiladigan tashkilot nomi'}</small></span>
                <input defaultValue="Jamoat Xavfsizligi Universiteti" />
              </div>

              <div className="settings-row">
                <span><strong>{locale === 'ru' ? 'Напоминание о сдаче отчета' : locale === 'en' ? 'Report submission reminder' : 'Hisobot topshirish eslatmasi'}</strong><small>{locale === 'ru' ? 'За сколько дней до срока отправить предупреждение' : locale === 'en' ? 'Days before deadline to send warning' : 'Muddat tugashidan necha kun oldin ogohlantirish yuborilsin'}</small></span>
                <select defaultValue="10"><option value="5">5 kun oldin</option><option value="10">10 kun oldin</option><option value="14">14 kun oldin</option></select>
              </div>

              <div className="settings-row">
                <span><strong>Mavzu (Theme)</strong><small>Tizim ko'rinishi (Kunduzgi yoki Kechki)</small></span>
                <select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="light">Kunduzgi (Light)</option><option value="dark">Kechki (Dark Neon)</option></select>
              </div>

              <div className="settings-row" style={{borderTop: '1px solid #e2e8f0', marginTop: 15, paddingTop: 15}}>
                <span>
                  <strong style={{ color: '#0070f3' }}>Namunaviy ma'lumotlarni qayta tiklash</strong>
                  <small>Barcha 8 ta izlanuvchi, hisobotlar, ekspertiza va kengash hujjatlarini asl holiga qaytaradi</small>
                </span>
                <button className="secondary-button" type="button" onClick={restoreDemoData}>
                  <RotateCcw size={15} /> Tiklash
                </button>
              </div>

              <div className="settings-row" style={{borderTop: '1px solid #ffebe9', marginTop: 15, paddingTop: 15}}>
                <span><strong style={{color: '#da1e28'}}>{locale === 'ru' ? 'Удалить все данные' : locale === 'en' ? 'Delete all data' : 'Barcha ma\'lumotlarni o\'chirish'}</strong><small>Tizimdagi barcha izlanuvchilar, hisobotlar, qaydlar va boshqa ma'lumotlar o'chiriladi</small></span>
                <button className="secondary-button danger-button" type="button" onClick={() => {
                  if (window.confirm("Haqiqatan ham barcha ma'lumotlarni o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!")) {
                    setResearchers([]);
                    setAccounts([]);
                    setActivityLog([]);
                    setNormativeDocuments([]);
                    setExpertiseCases([]);
                    setMonitoringFiles([]);
                    setMonitoringReports([]);
                    setKengashFiles([]);
                    setPostDefenseFiles([]);
                    localStorage.clear();
                    setPage('overview');
                  }
                }}><Trash2 size={15} />{locale === 'ru' ? 'Удалить все' : locale === 'en' ? 'Delete All' : 'Barchasini o‘chirish'}</button>
              </div>
            </section>

            <section className="module-view panel normative-admin-view">
              <div className="module-toolbar">
                <div>
                  <span className="section-kicker">TADQIQOTCHILAR UCHUN</span>
                  <h2>Ichki normativ hujjatlar</h2>
                  <p>Yuklangan fayllar izlanuvchi kabinetida ko‘rinadi · PDF, DOC, DOCX · 10 MB gacha</p>
                </div>
                <input ref={normativeInputRef} className="visually-hidden" type="file" accept=".pdf,.doc,.docx" multiple onChange={uploadNormativeDocuments} />
                <button className="primary-button" onClick={() => normativeInputRef.current?.click()}><Upload size={15} />Hujjat yuklash</button>
              </div>
              {normativeError && <div className="upload-error"><CircleAlert size={15} />{normativeError}</div>}
              {normativeDocuments.length ? (
                <div className="document-list">
                  {normativeDocuments.map((item) => (
                    <div className="document-row" key={item.id}>
                      <span className="document-icon"><FileText size={17} /></span>
                      <span><strong>{item.file.name}</strong><small>{(item.file.size / (1024 * 1024)).toFixed(2)} MB · barcha izlanuvchilarga ko‘rinadi</small></span>
                      <button className="icon-button" aria-label={`${item.file.name} hujjatini o‘chirish`} onClick={() => setNormativeDocuments((items) => items.filter((document) => document.id !== item.id))}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              ) : <div className="normative-empty">Hali normativ hujjatlar yuklanmagan.</div>}
            </section>
          </div>
        )}

        {page === 'expertise' && <ExpertiseView expertiseCases={expertiseCases} setExpertiseCases={setExpertiseCases} onNavigateNizom={() => navigateTo('nizom')} researchers={researchers} />}
        {page === 'nizom' && <NizomView onNavigateExpertise={() => navigateTo('expertise')} />}

        <footer className="page-footer">
          <span>© 2026 Ilm+ · Jamoat xavfsizligi universiteti Oliy ta’limdan keyingi ta’lim monitoringi</span>
          <span><i className="live-dot" /> Tizim faol · Single Source of Truth sinxron</span>
        </footer>
      </div>
    </main>
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}><section className="add-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><div><span className="section-kicker">{locale === 'ru' ? 'НОВЫЙ ПРОФИЛЬ' : locale === 'en' ? 'NEW PROFILE' : 'YANGI PROFIL'}</span><h2 id="modal-title">{locale === 'ru' ? 'Добавить соискателя' : locale === 'en' ? 'Add researcher' : 'Izlanuvchi qo‘shish'}</h2></div><button className="icon-button" aria-label="Yopish" onClick={() => setModalOpen(false)}><X size={19} /></button></div><form onSubmit={createResearcher}><label>{locale === 'ru' ? 'Ф.И.О.' : locale === 'en' ? 'Full Name' : 'F.I.Sh'}<input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={locale === 'ru' ? 'Например, Нодира Каримова' : locale === 'en' ? 'For example, Nodira Karimova' : 'Masalan, Nodira Karimova'} required /></label><label>{locale === 'ru' ? 'Научное направление' : locale === 'en' ? 'Research Area' : 'Ilmiy yo‘nalish'}<input value={newField} onChange={(event) => setNewField(event.target.value)} placeholder={locale === 'ru' ? 'Например, Прикладная математика' : locale === 'en' ? 'For example, Applied mathematics' : 'Masalan, Amaliy matematika'} /></label><label>{locale === 'ru' ? 'Этап' : locale === 'en' ? 'Stage' : 'Bosqich'}<select value={newStage} onChange={(event) => setNewStage(event.target.value)}><option value="1">1-bosqich</option><option value="2">2-bosqich</option><option value="3">3-bosqich</option></select></label><div className="modal-hint"><CircleAlert size={15} /> Ilmiy rahbarni keyinroq biriktirish mumkin.</div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModalOpen(false)}>{locale === 'ru' ? 'Отмена' : locale === 'en' ? 'Cancel' : 'Bekor qilish'}</button><button className="primary-button" type="submit"><Plus size={16} />{locale === 'ru' ? 'Создать профиль' : locale === 'en' ? 'Create profile' : 'Profil yaratish'}</button></div></form></section></div>}
  </div>
}

function ResearcherEditDialog({ researcher, onClose, onSave, locale }) {
  const sourceData = researcher.excelData || {
    'Familiyasi, ismi va otasining ismi': researcher.name,
    'Mavzulari nomlanishi': researcher.field,
    'Ilmiy rahbari F.I.Sh.': researcher.supervisor,
    'Qabul qilingan sana va buyruq': researcher.admissionOrder || '',
  }

  return <div className="modal-backdrop"><section className="researcher-edit-modal" role="dialog" aria-modal="true" aria-labelledby="researcher-edit-title"><div className="modal-top"><div><span className="section-kicker">{locale === 'ru' ? 'РЕДАКТИРОВАНИЕ ПРОФИЛЯ' : locale === 'en' ? 'EDIT PROFILE' : 'PROFIL TAHRIRI'}</span><h2 id="researcher-edit-title">{researcher.name}</h2></div><button className="icon-button" aria-label="Yopish" onClick={onClose}><X size={19} /></button></div><form onSubmit={onSave}><div className="researcher-edit-grid">{Object.entries(sourceData).map(([label, value]) => <label key={label}>{label}<input name={label} defaultValue={String(value ?? '')} /></label>)}</div><label className="edit-stage-field">Bosqich (qabul yili bo‘yicha avtomatik)<select name="__stage" defaultValue={researcher.stage}><option value="1">1-bosqich</option><option value="2">2-bosqich</option><option value="3">3-bosqich</option></select></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>{locale === 'ru' ? 'Отмена' : locale === 'en' ? 'Cancel' : 'Bekor qilish'}</button><button className="primary-button" type="submit"><Check size={15} />{locale === 'ru' ? 'Сохранить' : locale === 'en' ? 'Save' : 'Saqlash'}</button></div></form></section></div>
}

function ResearcherDetails({ researcher, accounts = [], onClose, onEdit, onDelete, locale, navigateTo }) {
  const sourceData = researcher.excelData || {
    'Familiyasi, ismi va otasining ismi': researcher.name,
    'Mavzulari nomlanishi': researcher.field,
    'Ilmiy rahbari F.I.Sh.': researcher.supervisor,
    Bosqich: `${researcher.stage}-bosqich`,
  }
  const hasStageColumn = Object.keys(sourceData).some((key) => ['bosqich', 'stage', 'kurs'].includes(normalizeHeader(key)))
  const entries = [
    ...Object.entries(sourceData),
    ...(!hasStageColumn ? [['Hisoblangan bosqich', `${researcher.stage}-bosqich`]] : []),
  ].filter(([, value]) => String(value ?? '').trim())

  const status = researcherStatus(researcher)
  const statusLbl = getResearcherStatusText(researcher, locale)
  const userAccount = accounts.find((a) => a.username === researcher.username || a.researcherName === researcher.name)
  const [copiedCreds, setCopiedCreds] = useState(false)

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="researcher-detail-modal" role="dialog" aria-modal="true" aria-labelledby="researcher-detail-title" style={{ width: 'min(90vw, 650px)' }}>
    <div className="modal-top">
      <div>
        <span className="section-kicker">{locale === 'ru' ? 'ДАННЫЕ СОИСКАТЕЛЯ' : locale === 'en' ? 'RESEARCHER DATA' : 'IZLANUVCHI MA’LUMOTLARI'}</span>
        <h2 id="researcher-detail-title">{researcher.name}</h2>
      </div>
      <button className="icon-button" aria-label="Yopish" onClick={onClose}><X size={19} /></button>
    </div>

    <div className="researcher-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
      <div>
        <h3 style={{ fontSize: 13, color: '#21483a', marginBottom: 10 }}>{locale === 'ru' ? 'Основные данные' : locale === 'en' ? 'Basic Info' : 'Asosiy ma\'lumotlar'}</h3>
        <dl className="researcher-detail-list">
          {entries.slice(0, 6).map(([label, value], index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd>{String(value)}</dd></div>)}
        </dl>

        {userAccount && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, color: '#1e40af', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Tizimga kirish ma’lumotlari</span>
              <div style={{ fontSize: 12, color: '#1e293b', marginTop: 3 }}>
                Login: <code style={{ color: '#0070f3', fontWeight: 600 }}>{userAccount.username}</code> · Parol: <code style={{ color: '#16a34a', fontWeight: 600 }}>{userAccount.password || 'otktf2026'}</code>
              </div>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                navigator.clipboard?.writeText(`Login: ${userAccount.username}\nParol: ${userAccount.password || 'otktf2026'}`)
                setCopiedCreds(true)
                setTimeout(() => setCopiedCreds(false), 2000)
              }}
              title="Login va parolni nusxalash"
            >
              {copiedCreds ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>
      
      <div>
        <h3 style={{ fontSize: 14.5, color: '#21483a', marginBottom: 10 }}>{locale === 'ru' ? 'Отчеты и Мониторинг' : locale === 'en' ? 'Reports and Monitoring' : 'Hisobot va Monitoring'}</h3>
        <div style={{ display: 'grid', gap: 8, padding: 12, background: '#f6f7f5', borderRadius: 6, border: '1px solid #e7ebe7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e7ebe7', paddingBottom: 5 }}>
            <span style={{ fontSize: 12, color: '#647168' }}>{locale === 'ru' ? 'Общий статус' : locale === 'en' ? 'Overall status' : 'Umumiy holati'}</span>
            <span className={`status-pill status-${status || 'unknown'}`}>{statusLbl}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#647168' }}>Monitoring 2025</span>
            <strong style={{ fontSize: 12, color: '#21483a', textAlign: 'right' }}>{excelValue(researcher, ['monitoring2025']) || 'Kiritilmagan'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#647168' }}>Monitoring 2026</span>
            <strong style={{ fontSize: 12, color: '#21483a', textAlign: 'right' }}>{excelValue(researcher, ['monitoring2026']) || 'Kiritilmagan'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#647168' }}>{locale === 'ru' ? 'Индивидуальный план' : locale === 'en' ? 'Individual plan' : 'Yakka tartibdagi reja'}</span>
            <strong style={{ fontSize: 12, color: '#21483a', textAlign: 'right' }}>{excelValue(researcher, ['yakkatartibdagireja']) || 'Kiritilmagan'}</strong>
          </div>
          
          <button className="text-link" style={{ marginTop: 5, alignSelf: 'flex-start', padding: 0, fontSize: 12 }} onClick={() => { onClose(); if (navigateTo) navigateTo('plans', researcher.stage); }}>{locale === 'ru' ? 'Посмотреть план' : locale === 'en' ? 'View plan' : 'Rejasini ko\'rish'}<ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>

    <div className="modal-actions detail-actions">
      <button className="secondary-button danger-button" onClick={onDelete}><Trash2 size={15} />{locale === 'ru' ? 'Удалить' : locale === 'en' ? 'Delete' : 'O‘chirish'}</button>
      <button className="primary-button" onClick={onEdit}><Pencil size={15} />{locale === 'ru' ? 'Редактировать' : locale === 'en' ? 'Edit' : 'Tahrirlash'}</button>
    </div>
  </section></div>
}

function ResearcherProgress({ researcher }) {
  const progress = researcherProgress(researcher)
  return <div className="table-progress"><span><i className={researcherStatus(researcher) === 'atRisk' ? 'bar-orange' : ''} style={{ width: `${progress ?? 0}%` }} /></span>{progress === null ? '—' : `${progress}%`}</div>
}

function ResearcherStatus({ researcher, locale = 'uz' }) {
  const status = researcherStatus(researcher)
  const label = getResearcherStatusText(researcher, locale)
  return <span className={`status-pill status-${status || 'unknown'}`}><i />{label}</span>
}

function CredentialDialog({ entries = [], onClose, onExport, onLogin, locale }) {
  const [copiedIdx, setCopiedIdx] = useState(null)

  const copyRow = (username, password, idx) => {
    navigator.clipboard?.writeText(`Login: ${username}\nParol: ${password}`)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="modal-backdrop credential-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className="credential-modal" role="dialog" aria-modal="true" aria-labelledby="credentials-title" style={{ maxWidth: 680, width: '92vw' }}>
        <div className="modal-top">
          <div>
            <span className="section-kicker" style={{ color: '#00c875' }}>
              {locale === 'ru' ? 'ИМПОРТ ЗАВЕРШЕН' : locale === 'en' ? 'IMPORT COMPLETED' : 'IMPORT YAKUNLANDI'}
            </span>
            <h2 id="credentials-title">
              {locale === 'ru' ? 'Сгенерированные логины и пароли' : locale === 'en' ? 'Generated Logins & Passwords' : 'Hosil bo‘lgan login va parollar'} ({entries.length})
            </h2>
          </div>
          <button className="icon-button" aria-label="Yopish" onClick={onClose}><X size={19} /></button>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', margin: '14px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <KeyRound size={20} color="#16a34a" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.4 }}>
            {locale === 'ru'
              ? 'Соискатели успешно добавлены! Вы можете скачать сгенерированные логины и пароли отдельным файлом Excel (.xlsx) для передачи соискателям.'
              : locale === 'en'
              ? 'Researchers added successfully! You can download generated credentials as an Excel (.xlsx) file to distribute to researchers.'
              : 'Izlanuvchilar muvaffaqiyatli qo‘shildi! Hosil bo‘lgan login va parollarni izlanuvchilarga tarqatish uchun Excel (.xlsx) fayl shaklida yuklab oling.'}
          </p>
        </div>

        <div className="credentials-list" style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
          {entries.map((item, idx) => (
            <div className="credential-row" key={item.username || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: idx < entries.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.researcherName || item.name}</strong>
                <div style={{ display: 'flex', gap: '12px', marginTop: '3px', fontSize: '12px', color: '#475569' }}>
                  <span>{item.stage || 1}-bosqich</span>
                  <span>Login: <code style={{ background: '#eff6ff', padding: '1px 5px', borderRadius: '3px', color: '#0070f3' }}>{item.username}</code></span>
                  <span>Parol: <code style={{ background: '#f0fdf4', padding: '1px 5px', borderRadius: '3px', color: '#16a34a', fontWeight: 'bold' }}>{item.password}</code></span>
                </div>
              </div>
              <button
                className="icon-button"
                aria-label="Nusxalash"
                onClick={() => copyRow(item.username, item.password, idx)}
                title="Login va parolni nusxalash"
              >
                {copiedIdx === idx ? <Check size={16} color="#16a34a" /> : <Copy size={15} />}
              </button>
            </div>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <button className="primary-button" onClick={() => onExport(entries)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0070f3' }}>
            <ArrowDownToLine size={16} />
            {locale === 'ru' ? 'Скачать Excel (.xlsx)' : locale === 'en' ? 'Download Excel (.xlsx)' : 'Excel (.xlsx) yuklab olish'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary-button" onClick={onClose}>
              {locale === 'ru' ? 'Закрыть' : locale === 'en' ? 'Close' : 'Yopish'}
            </button>
            <button className="secondary-button" onClick={onLogin}>
              {locale === 'ru' ? 'Вход в систему' : locale === 'en' ? 'Go to Login' : 'Login sahifasi'}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function UnifiedLogin({ onLogin, error, locale }) {
  const [role, setRole] = useState('researcher')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function submit(event) {
    event.preventDefault()
    onLogin(role, username, password)
  }

  return <main className="login-screen">
    <video autoPlay loop muted playsInline preload="metadata" poster="./logo.jpg" className="login-bg-video"><source src="./video.mp4" type="video/mp4" /></video>
    <div className="login-overlay"></div>
    <section className="login-panel">
      <a className="login-brand" href="#overview"><img src="./logo.jpg" alt="Logo" className="brand-logo" /><span className="brand-name">{locale === 'ru' ? 'Республика Узбекистан' : locale === 'en' ? 'Republic of Uzbekistan' : 'O‘zbekiston Respublikasi'}<br />{locale === 'ru' ? 'Университет общественной безопасности' : locale === 'en' ? 'University of Public Safety' : 'Jamoat xavfsizligi universiteti'}<br />{locale === 'ru' ? 'Факультет послевузовского образования' : locale === 'en' ? 'Faculty of Postgraduate Education' : 'Oliy ta\'limdan keyingi ta\'lim fakulteti'}</span></a>
      <span className="section-kicker">{locale === 'ru' ? 'ВХОД В СИСТЕМУ' : locale === 'en' ? 'SYSTEM LOGIN' : 'TIZIMGA KIRISH'}</span>
      <h1>{locale === 'ru' ? 'Добро пожаловать' : locale === 'en' ? 'Welcome' : 'Xush kelibsiz'}</h1>
      
      <div className="login-role-tabs">
        <button type="button" className={`role-tab ${role === 'researcher' ? 'active' : ''}`} onClick={() => { setRole('researcher'); setUsername(''); setPassword(''); }}>{locale === 'ru' ? 'Соискатель' : locale === 'en' ? 'Researcher' : 'Tadqiqotchi'}</button>
        <button type="button" className={`role-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => { setRole('admin'); setUsername(''); setPassword(''); }}>{locale === 'ru' ? 'Администратор' : locale === 'en' ? 'Administrator' : 'Administrator'}</button>
      </div>
      
      <p>{role === 'admin' ? "Boshqaruv paneliga kirish uchun admin parolini kiriting." : "Tizimga kirish uchun admin taqdim etgan login va parolni kiriting (Masalan: jasur.karimov / Karimov2026!)."}</p>
      
      <form onSubmit={submit}>
        <label>{locale === 'ru' ? 'Логин' : locale === 'en' ? 'Login' : 'Login'}<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required placeholder={role === 'admin' ? "Masalan: JXUOTKTF" : "Tadqiqotchi logini"} /></label>
        <label>{locale === 'ru' ? 'Пароль' : locale === 'en' ? 'Password' : 'Parol'}<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder={role === 'admin' ? "Admin paroli" : "Parol"} /></label>
        {error && <div className="login-error"><CircleAlert size={15} />{error}</div>}
        <button className="primary-button" type="submit"><LockKeyhole size={16} />{locale === 'ru' ? 'Войти' : locale === 'en' ? 'Login' : 'Tizimga kirish'}</button>
      </form>
    </section>
  </main>
}

function ResearcherWorkspace({ user, normativeDocuments, expertiseCases, setExpertiseCases, onLogout, monitoringFiles, setMonitoringFiles, monitoringReports, setMonitoringReports, kengashFiles, setKengashFiles, postDefenseFiles, setPostDefenseFiles, theme, setTheme, accounts, setAccounts, updateAuthUser, locale, setLocale }) {
  const [tab, setTab] = useState('dashboard')
  const [seminarMenuOpen, setSeminarMenuOpen] = useState(false)

  const rejectedCount = (postDefenseFiles || []).filter(f => f.username === user.username && f.status === 'Rad etildi').length

  return <main className="portal-shell">
    <header className="portal-topbar">
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <a className="login-brand" href="#overview" onClick={(e) => { e.preventDefault(); setTab('dashboard'); }} style={{ margin: 0, textDecoration: 'none' }}>
          <img src="./logo.jpg" alt="Logo" className="brand-logo" style={{ width: 34, height: 34 }} />
          <span className="brand-name" style={{ fontSize: 11.5 }}>{locale === 'ru' ? 'Республика Узбекистан' : locale === 'en' ? 'Republic of Uzbekistan' : 'O‘zbekiston Respublikasi'}<br />{locale === 'ru' ? 'Университет общественной безопасности' : locale === 'en' ? 'University of Public Safety' : 'Jamoat xavfsizligi universiteti'}<br />{locale === 'ru' ? 'Факультет высшего образования' : locale === 'en' ? 'Faculty of Higher Education' : 'Oliy ta\'lim fakulteti'}</span>
        </a>
        <nav className="portal-nav" style={{ display: 'flex', gap: '15px', alignItems: 'center', overflowX: 'auto' }}>
          <button className={`text-link ${tab === 'dashboard' ? 'active-tab' : ''}`} onClick={() => setTab('dashboard')}>{locale === 'ru' ? 'Мой кабинет' : locale === 'en' ? 'My Cabinet' : 'Mening kabinetim'}</button>
          <button className={`text-link ${tab === 'documents' ? 'active-tab' : ''}`} onClick={() => setTab('documents')}>{locale === 'ru' ? 'Личные документы' : locale === 'en' ? 'Personal Documents' : 'Shaxsiy hujjatlar'}</button>
          <button className={`text-link ${tab === 'expertise' ? 'active-tab' : ''}`} onClick={() => setTab('expertise')}>{locale === 'ru' ? 'Экспертиза' : locale === 'en' ? 'Expertise' : 'Ekspertiza arizasi'}</button>
          
          <div style={{ position: 'relative' }} onMouseLeave={() => setSeminarMenuOpen(false)}>
            <button className={`text-link ${(tab === 'seminar' || tab === 'kengash') ? 'active-tab' : ''}`} onClick={() => setSeminarMenuOpen(!seminarMenuOpen)}>
              {locale === 'ru' ? 'Научный семинар / совет' : locale === 'en' ? 'Scientific Seminar / Council' : 'Ilmiy seminarga / bir martalik kengashga'}
            </button>
            {seminarMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#1c211f', border: '1px solid #333', borderRadius: '4px', padding: '5px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 100, minWidth: '180px', marginTop: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <button className={`text-link ${tab === 'seminar' ? 'active-tab' : ''}`} onClick={() => { setTab('seminar'); setSeminarMenuOpen(false); }} style={{ textAlign: 'left', padding: '6px 10px', fontSize: '13px' }}>{locale === 'ru' ? 'Научный семинар' : locale === 'en' ? 'Scientific Seminar' : 'Ilmiy seminarga'}</button>
                <button className={`text-link ${tab === 'kengash' ? 'active-tab' : ''}`} onClick={() => { setTab('kengash'); setSeminarMenuOpen(false); }} style={{ textAlign: 'left', padding: '6px 10px', fontSize: '13px' }}>{locale === 'ru' ? 'Разовый совет' : locale === 'en' ? 'One-time Council' : 'Bir martalik kengashga'}</button>
              </div>
            )}
          </div>
          
          <button className={`text-link ${tab === 'post_defense' ? 'active-tab' : ''}`} onClick={() => setTab('post_defense')}>
            {locale === 'ru' ? 'После защиты' : locale === 'en' ? 'Post-defense' : 'Himoyadan keyingi hujjatlar'}
            {rejectedCount > 0 && (
              <span style={{ marginLeft: '5px', background: '#dc2626', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold' }}>!</span>
            )}
          </button>

          <button className={`text-link ${tab === 'nizom' ? 'active-tab' : ''}`} onClick={() => setTab('nizom')}>{locale === 'ru' ? 'Нормы' : locale === 'en' ? 'Norms' : 'Nizom va Me’yorlar'}</button>
          <button className={`text-link ${tab === 'settings' ? 'active-tab' : ''}`} onClick={() => setTab('settings')}>{locale === 'ru' ? 'Настройки' : locale === 'en' ? 'Settings' : 'Sozlamalar'}</button>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div className="locale-picker" aria-label="Interfeys tili">{['uz', 'ru', 'en'].map((language) => <button key={language} className={locale === language ? 'locale-active' : ''} onClick={() => setLocale(language)}>{language.toUpperCase()}</button>)}</div>
        <button className="secondary-button" onClick={onLogout}>{locale === 'ru' ? 'Выйти' : locale === 'en' ? 'Logout' : 'Chiqish'}</button>
      </div>
    </header>
    
    {tab === 'dashboard' && <ResearcherDashboard user={user} normativeDocuments={normativeDocuments} locale={locale} />}
    {tab === 'documents' && <ResearcherDocumentsApp user={user} files={monitoringFiles} setFiles={setMonitoringFiles} reports={monitoringReports} setReports={setMonitoringReports} locale={locale} />}
    {tab === 'expertise' && <ResearcherExpertiseApp user={user} expertiseCases={expertiseCases} setExpertiseCases={setExpertiseCases} locale={locale} />}
    {tab === 'seminar' && <div className="portal-content"><KengashStudentView user={user} kengashFiles={kengashFiles} setKengashFiles={setKengashFiles} isSeminar={true} locale={locale} /></div>}
    {tab === 'kengash' && <div className="portal-content"><KengashStudentView user={user} kengashFiles={kengashFiles} setKengashFiles={setKengashFiles} locale={locale} /></div>}
    {tab === 'post_defense' && <div className="portal-content"><PostDefenseStudentView user={user} postDefenseFiles={postDefenseFiles} setPostDefenseFiles={setPostDefenseFiles} locale={locale} /></div>}
    {tab === 'nizom' && <div className="portal-content"><NizomView onNavigateExpertise={() => setTab('expertise')} locale={locale} /></div>}
    {tab === 'settings' && <ResearcherSettings user={user} theme={theme} setTheme={setTheme} accounts={accounts} setAccounts={setAccounts} updateAuthUser={updateAuthUser} locale={locale} />}
  </main>
}

function ResearcherSettings({ user, theme, setTheme, accounts, setAccounts, updateAuthUser, locale }) {
  const [newPassword, setNewPassword] = useState(user.password || '')
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = (e) => {
    e.preventDefault()
    const updatedAccounts = accounts.map(acc => acc.username === user.username ? { ...acc, password: newPassword } : acc)
    setAccounts(updatedAccounts)
    updateAuthUser({ ...user, password: newPassword })
    setSaveMessage('Parol muvaffaqiyatli saqlandi!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  return (
    <div className="portal-content">
      <section className="portal-documents panel">
        <div className="module-toolbar">
          <div>
            <span className="section-kicker">{locale === 'ru' ? 'НАСТРОЙКИ' : locale === 'en' ? 'SETTINGS' : 'SOZLAMALAR'}</span>
            <h2>{locale === 'ru' ? 'Настройки соискателя' : locale === 'en' ? 'Researcher settings' : 'Tadqiqotchi sozlamalari'}</h2>
          </div>
        </div>
        
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="setting-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dce5e0', paddingBottom: 15 }}>
            <div>
              <strong style={{ display: 'block', marginBottom: 5 }}>{locale === 'ru' ? 'Тема системы' : locale === 'en' ? 'System Theme' : 'Tizim ko\'rinishi'}</strong>
              <small style={{ color: '#8b978e' }}>{locale === 'ru' ? 'Выберите светлый или темный режим' : locale === 'en' ? 'Select light or dark mode' : 'Kunduzgi yoki kechki rejimni tanlang'}</small>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={`secondary-button ${theme === 'light' ? 'primary-button' : ''}`} style={theme === 'light' ? {} : {background: 'transparent', borderColor: '#dce5e0'}} onClick={() => setTheme('light')}>{locale === 'ru' ? 'Светлый' : locale === 'en' ? 'Light' : 'Kunduzgi'}</button>
              <button className={`secondary-button ${theme === 'dark' ? 'primary-button' : ''}`} style={theme === 'dark' ? {} : {background: 'transparent', borderColor: '#dce5e0'}} onClick={() => setTheme('dark')}>{locale === 'ru' ? 'Темный' : locale === 'en' ? 'Dark' : 'Kechki'}</button>
            </div>
          </div>

          <form className="setting-group" onSubmit={handleSave}>
            <div>
              <strong style={{ display: 'block', marginBottom: 5 }}>{locale === 'ru' ? 'Пароль для входа' : locale === 'en' ? 'Login Password' : 'Kirish paroli'}</strong>
              <small style={{ color: '#8b978e' }}>{locale === 'ru' ? 'Обновите пароль для входа в систему' : locale === 'en' ? 'Update your password to log in' : 'Tizimga kirish uchun parolingizni yangilang'}</small>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ height: 36, padding: '0 10px', borderRadius: 4, border: '1px solid #dce5e0', flex: 1, maxWidth: 300 }} required />
              <button type="submit" className="primary-button">{locale === 'ru' ? 'Сохранить' : locale === 'en' ? 'Save' : 'Saqlash'}</button>
            </div>
            {saveMessage && <p style={{ color: '#58a071', fontSize: 12, marginTop: 10 }}><Check size={14} style={{ verticalAlign: 'middle' }} /> {saveMessage}</p>}
          </form>
        </div>
      </section>
    </div>
  )
}

function ResearcherDocumentsApp({ user, files, setFiles, reports, setReports, locale }) {
  const [subTab, setSubTab] = useState('ish_reja')
  const [modalOpen, setModalOpen] = useState(false)
  
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('Maqola')
  const [docYear, setDocYear] = useState('2026')
  const [docQuarter, setDocQuarter] = useState('1')
  const [selectedFiles, setSelectedFiles] = useState([])
  
  const [reportStage, setReportStage] = useState(String(user.stage || 1))
  const [reportYear, setReportYear] = useState('2026')

  const userFiles = files.filter(f => f.username === user.username)
  const userReports = reports.filter(r => r.username === user.username)
  
  function handleFileSelect(e) {
    if (!e.target.files.length) return
    const uploaded = Array.from(e.target.files)
    if (uploaded.length > 40) return alert("Bitta punktga ko'pi bilan 40 ta fayl yuklash mumkin.")
    
    const validFiles = []
    for (const file of uploaded) {
      if (file.size > 20 * 1024 * 1024) {
        return alert(`${file.name} hajmi 20 MB dan oshmasligi kerak.`)
      }
      validFiles.push({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        url: URL.createObjectURL(file)
      })
    }
    setSelectedFiles(validFiles)
  }
  
  function createDoc(e) {
    e.preventDefault()
    if (!selectedFiles.length && !docName) return alert('Iltimos, fayl yuklang yoki nom kiriting.')
    const fileName = selectedFiles.length === 1 ? selectedFiles[0].name : (selectedFiles.length > 1 ? `${selectedFiles.length} ta fayl` : 'Hujjat_fayli')
    const totalSize = selectedFiles.length > 0 ? selectedFiles.reduce((acc, f) => acc + parseFloat(f.size), 0).toFixed(2) + ' MB' : '0 MB'
    const newFile = {
      id: `doc-${Date.now()}`,
      username: user.username,
      name: docName || fileName,
      fileName: fileName,
      type: docType,
      period: `${docYear}/${docQuarter}`,
      size: totalSize,
      files: selectedFiles
    }
    setFiles([newFile, ...files])
    setModalOpen(false)
    setDocName('')
    setSelectedFiles([])
  }
  
  function createReport(e) {
    e.preventDefault()
    const newReport = {
      id: `rep-${Date.now()}`,
      username: user.username,
      fio: user.researcherName || user.name,
      org: 'Jamoat xavfsizligi universiteti',
      stage: reportStage,
      quarter: `${reportYear}/1`,
      status: 'Kutilmoqda'
    }
    setReports([newReport, ...reports])
    setModalOpen(false)
  }
  
  function deleteFile(id) {
    setFiles(files.filter(f => f.id !== id))
  }
  function deleteReport(id) {
    setReports(reports.filter(r => r.id !== id))
  }

  return (
    <div className="portal-content" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div className="panel" style={{ width: '250px', padding: '15px 0' }}>
        <h3 style={{ fontSize: 11, color: '#8b978e', padding: '0 15px', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{locale === 'ru' ? 'Личные документы' : locale === 'en' ? 'Personal Documents' : 'Shaxsiy hujjatlar'}</h3>
        <button className={`nav-item ${subTab === 'ish_reja' ? 'nav-active' : ''}`} onClick={() => setSubTab('ish_reja')} style={{ margin: '0 10px', width: 'calc(100% - 20px)' }}><FileText size={16} />{locale === 'ru' ? 'План работы' : locale === 'en' ? 'Work plan' : 'Ish reja'}</button>
        <button className={`nav-item ${subTab === 'monitoring' ? 'nav-active' : ''}`} onClick={() => setSubTab('monitoring')} style={{ margin: '0 10px', width: 'calc(100% - 20px)' }}><ClipboardCheck size={16} />{locale === 'ru' ? 'Отчет мониторинга' : locale === 'en' ? 'Monitoring report' : 'Monitoring hisoboti'}</button>
      </div>
      
      <div className="panel" style={{ flex: 1, minHeight: '400px' }}>
        <div className="module-toolbar">
          <div>
            <span className="section-kicker">{subTab === 'ish_reja' ? 'ISH REJA' : 'MONITORING HISOBOTI'}</span>
            <h2>{subTab === 'ish_reja' ? 'Monitoring' : 'Monitoring holati'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="primary-button" onClick={() => { setModalOpen(true); setSelectedFiles([]); }}>{locale === 'ru' ? 'Создать' : locale === 'en' ? 'Create' : 'Yaratish'}</button>
            {subTab === 'ish_reja' && <button className="secondary-button" style={{ background: '#5e4ec8', color: '#fff', borderColor: '#5e4ec8' }} onClick={() => setSubTab('monitoring')}>{locale === 'ru' ? 'Отчет мониторинга' : locale === 'en' ? 'Monitoring report' : 'Monitoring hisoboti'}</button>}
          </div>
        </div>
        
        <div className="table-scroll">
          {subTab === 'ish_reja' ? (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>{locale === 'ru' ? 'НАЗВАНИЕ' : locale === 'en' ? 'NAME' : 'NOMI'}</th><th>{locale === 'ru' ? 'ПЕРИОД' : locale === 'en' ? 'PERIOD' : 'DAVR'}</th><th>{locale === 'ru' ? 'ТИП РАБОТЫ' : locale === 'en' ? 'WORK TYPE' : 'ISH TURI'}</th><th>{locale === 'ru' ? 'ФАЙЛ' : locale === 'en' ? 'FILE' : 'FAYL'}</th><th>{locale === 'ru' ? 'ДЕЙСТВИЯ' : locale === 'en' ? 'ACTIONS' : 'HARAKATLAR'}</th>
                </tr>
              </thead>
              <tbody>
                {userFiles.map((f, i) => (
                  <tr key={f.id}>
                    <td>{i + 1}</td>
                    <td>{f.name}</td>
                    <td>{f.period}</td>
                    <td>{f.type}</td>
                    <td>
                      {f.files && f.files.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {f.files.map((file, idx) => (
                            <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="text-link" style={{fontSize: 12}}>
                              {file.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-link" style={{fontSize: 12}}>{f.fileName || (locale === 'ru' ? 'Файл' : locale === 'en' ? 'File' : 'Fayl')}</span>
                      )}
                    </td>
                    <td><button className="icon-button" onClick={() => deleteFile(f.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {userFiles.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#8b978e' }}>Hech qanday mos yozuv topilmadi</td></tr>}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>F.I.O.</th><th>{locale === 'ru' ? 'ОРГАНИЗАЦИЯ' : locale === 'en' ? 'ORGANIZATION' : 'TASHKILOT'}</th><th>{locale === 'ru' ? 'ЭТАП ОБУЧЕНИЯ' : locale === 'en' ? 'EDUCATION STAGE' : 'TA\'LIM BOSQICHI'}</th><th>{locale === 'ru' ? 'КВАРТАЛ' : locale === 'en' ? 'QUARTER' : 'CHORAK'}</th><th>HOLAT</th><th>{locale === 'ru' ? 'ДЕЙСТВИЯ' : locale === 'en' ? 'ACTIONS' : 'HARAKATLAR'}</th>
                </tr>
              </thead>
              <tbody>
                {userReports.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.fio}</td>
                    <td>{r.org}</td>
                    <td>{r.stage}</td>
                    <td>{r.quarter}</td>
                    <td><span className="status-pill status-needsReview" style={{ backgroundColor: '#ff9800', color: '#fff' }}>{r.status}</span></td>
                    <td><button className="icon-button" onClick={() => deleteReport(r.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {userReports.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#8b978e' }}>Hech qanday mos yozuv topilmadi</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {modalOpen && (
        <div className="modal-backdrop">
          <section className="researcher-detail-modal" style={{ width: 450 }}>
            <div className="modal-top">
              <div><span className="section-kicker">YARATISH</span><h2>{subTab === 'ish_reja' ? 'Yangi hujjat' : 'Monitoring hisoboti'}</h2></div>
              <button className="icon-button" onClick={() => setModalOpen(false)}><X size={19}/></button>
            </div>
            {subTab === 'ish_reja' ? (
              <form onSubmit={createDoc} style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ padding: 10, background: '#f5f8ff', color: '#0043ce', fontSize: 11, borderRadius: 4, lineHeight: 1.4 }}>
                  <strong>Eslatma:</strong> Stajor-tadqiqotchi va doktorantlar qabuli har yili 1-chorakda amalga oshirilgani bois, monitoring hujjatlarini faqat 4-chorakni belgilab kiritishi lozim.
                </div>
                <label className="input-group">
                  <span>Hujjat nomi</span>
                  <input value={docName} onChange={e => setDocName(e.target.value)} required />
                </label>
                <label className="input-group">
                  <span>Ish turi</span>
                  <select value={docType} onChange={e => setDocType(e.target.value)}>
                    <option>Maqola</option><option>Tezis</option><option>Monografiya</option><option>{locale === 'ru' ? 'Другое' : locale === 'en' ? 'Other' : 'Boshqa'}</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 15 }}>
                  <label className="input-group" style={{ flex: 1 }}>
                    <span>Hisobot davri</span>
                    <select value={docYear} onChange={e => setDocYear(e.target.value)}>
                      <option>2024</option><option>2025</option><option>2026</option>
                    </select>
                  </label>
                  <label className="input-group" style={{ flex: 1 }}>
                    <span>Chorak</span>
                    <select value={docQuarter} onChange={e => setDocQuarter(e.target.value)}>
                      <option>1</option><option>2</option><option>3</option><option>4</option>
                    </select>
                  </label>
                </div>
                <label className="input-group">
                  <span>{locale === 'ru' ? 'Файл' : locale === 'en' ? 'File' : 'Fayl'}</span>
                  <div className="file-drop-area" style={{ height: 60, minHeight: 60, marginTop: 5 }}>
                    <input type="file" multiple onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg" className="visually-hidden" id="ish-reja-upload" />
                    <label htmlFor="ish-reja-upload" style={{ cursor: 'pointer', fontSize: 12, color: '#58a071', textDecoration: 'underline' }}>
                      {selectedFiles.length > 0 ? `${selectedFiles.length} ta fayl tanlandi` : 'Fayllarni tanlang yoki bu yerga tashlang...'}
                    </label>
                  </div>
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="submit" className="primary-button">{locale === 'ru' ? 'Создать' : locale === 'en' ? 'Create' : 'Yaratish'}</button>
                  <button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>{locale === 'ru' ? 'Отмена' : locale === 'en' ? 'Cancel' : 'Bekor qilish'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={createReport} style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ padding: 10, background: '#fff5f5', color: '#c41c1c', fontSize: 11, borderRadius: 4, lineHeight: 1.4 }}>
                  <strong>Eslatma:</strong> Izlanuvchi monitoring topshirish yili va ta'lim bosqichini tanlaganda ish rejada ushbu yil uchun Nizom talablarida ko'rsatilgan hujjatlar to'liq va xatosiz kiritilgan bo'lishi lozim.
                </div>
                <label className="input-group">
                  <span>Ta'lim bosqichi</span>
                  <select value={reportStage} onChange={e => setReportStage(e.target.value)}>
                    <option value="1">1-bosqich</option><option value="2">2-bosqich</option><option value="3">3-bosqich</option>
                  </select>
                </label>
                <label className="input-group">
                  <span>Yil</span>
                  <select value={reportYear} onChange={e => setReportYear(e.target.value)}>
                    <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="submit" className="primary-button">{locale === 'ru' ? 'Создать' : locale === 'en' ? 'Create' : 'Yaratish'}</button>
                  <button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>{locale === 'ru' ? 'Отмена' : locale === 'en' ? 'Cancel' : 'Bekor qilish'}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function ResearcherDashboard({ user, normativeDocuments }) {
  const currentPlan = STUDY_PLANS[user.stage] || []

  return <div className="portal-content">
    <div className="portal-heading">
      <div>
        <span className="section-kicker">{user.stage}-BOSQICH · IZLANUVCHI KABINETI</span>
        <h1>Xush kelibsiz, {user.researcherName || user.name}</h1>
        <p>Hisobotlaringiz va ilmiy hujjatlaringiz</p>
      </div>
      <span className="stage-badge">{user.username}</span>
    </div>
    <section className="portal-summary">
      <div><span>Ta’lim bosqichi</span><strong>{user.stage}-bosqich</strong></div>
      <div><span>Hisobot davri</span><strong>{currentAcademicYear()} · 1-chorak</strong></div>
      <div><span>Hisob holati</span><strong className="account-active"><i />Faol</strong></div>
    </section>
    
    <section className="portal-documents panel">
      <div className="module-toolbar">
        <div><span className="section-kicker">REJA BIZNES-JARAYONI</span><h2>Yakka tartibdagi reja ({user.stage}-yil)</h2><p>Mazkur bosqich uchun bajarilishi lozim bo‘lgan vazifalar ro‘yxati</p></div>
      </div>
      <div className="study-plan-list">
        {currentPlan.map((task, idx) => (
          <div className="study-plan-item" key={task.id}>
            <span className="plan-number">{idx + 1}</span>
            <div className="plan-detail">
              <strong>{task.title}</strong>
              <small>Muddat: {task.deadline}</small>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="portal-documents panel">
      <div className="module-toolbar">
        <div><span className="section-kicker">UNIVERSITET HUJJATLARI</span><h2>Ichki normativ hujjatlar</h2><p>Ilmiy faoliyat va oliy ta’limdan keyingi ta’lim bo‘yicha hujjatlar</p></div>
      </div>
      {normativeDocuments.length ? (
        <div className="document-list">
          {normativeDocuments.map((item) => (
            <div className="document-row" key={item.id}>
              <span className="document-icon"><FileText size={17} /></span>
              <span><strong>{item.file.name}</strong><small>{(item.file.size / (1024 * 1024)).toFixed(2)} MB · universitet hujjati</small></span>
              <button className="icon-button" aria-label={`${item.file.name} hujjatini yuklab olish`} onClick={() => {
                const url = URL.createObjectURL(item.file);
                const link = document.createElement('a');
                link.href = url;
                link.download = item.file.name;
                link.click();
                URL.revokeObjectURL(url);
              }}><ArrowDownToLine size={15} /></button>
            </div>
          ))}
        </div>
      ) : <div className="normative-empty" style={{padding: 20, textAlign: 'center', color: '#8b978e', fontSize: 11}}>Hozircha normativ hujjatlar joylanmagan.</div>}
    </section>
  </div>
}

function ResearcherExpertiseApp({ user, expertiseCases, setExpertiseCases }) {
  const existingCase = expertiseCases.find(c => c.researcherName === (user.researcherName || user.name))
  const [topic, setTopic] = useState('')
  
  function submitApp(e) {
    e.preventDefault()
    const newCase = {
      id: `exp-${Date.now()}`,
      researcherName: user.researcherName || user.name,
      degree: 'PhD',
      field: user.field || 'Noma\'lum',
      topic: topic || user.topic || 'Noma\'lum mavzu',
      supervisor: user.supervisor || 'Noma\'lum rahbar',
      isSupervisorDeptHead: false,
      assignedDepartment: '',
      presidingPerson: '',
      applicationDate: new Date().toISOString().slice(0, 10),
      antiplagiarismScore: 90,
      impactFactorArticlesCount: 0,
      status: 'docs_check',
      documentsStatus: {},
      isKengashAppointed: false,
      hasDirectDefense: false,
    }
    setExpertiseCases([newCase, ...expertiseCases])
  }

  const fileInputRef = useRef(null)
  const [activeUploadKey, setActiveUploadKey] = useState(null)
  const [uploadError, setUploadError] = useState('')
  
  function handleFileSelect(event) {
    if (!event.target.files.length || !activeUploadKey || !existingCase) return
    const selectedFiles = Array.from(event.target.files)
    const currentFiles = Array.isArray(existingCase.documentsStatus?.[activeUploadKey]) ? existingCase.documentsStatus[activeUploadKey] : []
    
    if (currentFiles.length + selectedFiles.length > 40) {
      setUploadError(`Bitta hujjat bo'limiga ko'pi bilan 40 ta fayl yuklash mumkin.`)
      event.target.value = ''
      return
    }

    const validFiles = []
    for (const file of selectedFiles) {
      if (file.size > 20 * 1024 * 1024) {
        setUploadError(`${file.name}: fayl hajmi 20 MB dan oshmasligi kerak.`)
        event.target.value = ''
        return
      }
      validFiles.push({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      })
    }

    const newCases = expertiseCases.map(c => {
      if (c.id === existingCase.id) {
        return {
          ...c,
          documentsStatus: {
            ...c.documentsStatus,
            [activeUploadKey]: [...currentFiles, ...validFiles]
          }
        }
      }
      return c
    })
    setExpertiseCases(newCases)
    setUploadError('')
    setActiveUploadKey(null)
    event.target.value = ''
  }

  function triggerUpload(key) {
    setActiveUploadKey(key)
    fileInputRef.current?.click()
  }

  if (existingCase) {
    return <div className="portal-content">
      <section className="portal-documents panel">
        <div className="module-toolbar">
          <div><span className="section-kicker">DASTLABKI EKSPERTIZA</span><h2>Sizning arizangiz</h2><p>Hozirgi holat: <strong>{existingCase.status === 'docs_check' ? 'Hujjatlar tekshiruvda' : existingCase.status === 'meeting_scheduled' ? 'Kengash belgilangan' : existingCase.status === 'recommended' ? 'Tavsiya etilgan' : 'Jarayonda'}</strong></p></div>
        </div>
        <div style={{ padding: '0 20px 20px', fontSize: 11, color: '#425248' }}>
          <p><strong>Mavzu:</strong> {existingCase.topic}</p>
          <p><strong>Ilmiy rahbar:</strong> {existingCase.supervisor}</p>
          <p><strong>Ariza sanasi:</strong> {existingCase.applicationDate}</p>
          <br/>
          <p style={{ color: '#8b978e' }}>Admin orqali arizangiz holatini nazorat qiling. Barcha hujjatlar taqdim etilgandan so'ng, Kengash sanasi belgilanadi.</p>
        </div>
      </section>

      <section className="portal-documents panel" style={{ marginTop: 15 }}>
        <div className="module-toolbar">
          <div><span className="section-kicker">TALAB QILINADIGAN HUJJATLAR</span><h2>Nizom hujjatlarini yuklash</h2><p>Quyidagi barcha 11 ta hujjatni .pdf, .docx, .jpg shaklida yuklashingiz kerak</p></div>
        </div>
        <input ref={fileInputRef} type="file" multiple className="visually-hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg" onChange={handleFileSelect} />
        {uploadError && <div className="upload-error" style={{ marginBottom: 15 }}><CircleAlert size={15} />{uploadError}</div>}
        <div className="document-list">
          {REQUIRED_DOCUMENTS.map(doc => {
            const statusVal = existingCase.documentsStatus?.[doc.key]
            const isUploaded = Array.isArray(statusVal) ? statusVal.length > 0 : !!statusVal
            return (
              <div className="document-row" key={doc.key}>
                <span className="document-icon" style={{ color: isUploaded ? '#58a071' : '#9aa49c' }}>
                  {isUploaded ? <Check size={17} /> : <FileText size={17} />}
                </span>
                <span>
                  <strong>{doc.title}</strong>
                  <small>{doc.note}</small>
                </span>
                {isUploaded ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#58a071', fontSize: 10, fontWeight: 600 }}>{Array.isArray(statusVal) ? `${statusVal.length} ta fayl` : 'Yuklangan'}</span>
                    <button className="secondary-button" onClick={() => triggerUpload(doc.key)} title="Yana fayl qo'shish"><Plus size={14} /></button>
                  </div>
                ) : (
                  <button className="secondary-button" onClick={() => triggerUpload(doc.key)}><Upload size={14} />Yuklash</button>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  }

  return <div className="portal-content">
    <section className="portal-documents panel">
      <div className="module-toolbar">
        <div><span className="section-kicker">DASTLABKI EKSPERTIZA</span><h2>Ariza yaratish</h2><p>Kafedralararo muhokama uchun dastlabki ekspertizaga ariza yuborish</p></div>
      </div>
      <form onSubmit={submitApp} style={{ padding: '0 20px 20px', display: 'grid', gap: '15px' }}>
        <p style={{ fontSize: 11, color: '#647168' }}><strong>{user.researcherName || user.name}</strong> nomidan ekspertiza arizasini ochasiz. Tasdiqlaganingizdan so'ng administrator panelida arizangiz ro'yxatdan o'tadi.</p>
        <label style={{ display: 'grid', gap: 6, fontSize: 10, fontWeight: 600 }}>Dissertatsiya mavzusi
          <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="Mavzuni to'liq kiriting" style={{ height: 36, padding: '0 10px', borderRadius: 4, border: '1px solid #dce5e0' }} />
        </label>
        <button className="primary-button" style={{ justifySelf: 'flex-start' }} type="submit"><Plus size={16} />Arizani yuborish</button>
      </form>
    </section>
  </div>
}

function AdminMonitoringView({ files, reports, setReports, researchers = [], selectedStage = null, locale = 'uz' }) {
  const [subTab, setSubTab] = useState('ish_reja')
  const [viewedUser, setViewedUser] = useState(null)
  const [stageFilter, setStageFilter] = useState(selectedStage ? String(selectedStage) : 'all')
  const [search, setSearch] = useState('')

  function changeReportStatus(id, newStatus) {
    setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r))
  }

  const groupedFiles = Object.values(files.reduce((acc, f) => {
    if (!acc[f.username]) {
      acc[f.username] = { username: f.username, documents: [] }
    }
    acc[f.username].documents.push(f)
    return acc
  }, {}))

  const filteredGrouped = useMemo(() => {
    return groupedFiles.filter(g => {
      const researcher = researchers.find(r => r.username === g.username)
      const name = researcher?.name || g.username
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || g.username.toLowerCase().includes(search.toLowerCase())
      const matchesStage = stageFilter === 'all' || String(researcher?.stage) === stageFilter
      return matchesSearch && matchesStage
    })
  }, [groupedFiles, researchers, search, stageFilter])

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = (r.fio || r.username).toLowerCase().includes(search.toLowerCase())
      const matchesStage = stageFilter === 'all' || String(r.stage) === stageFilter
      return matchesSearch && matchesStage
    })
  }, [reports, search, stageFilter])

  const userDocuments = viewedUser ? files.filter(f => f.username === viewedUser) : []
  const viewedResearcher = viewedUser ? researchers.find(r => r.username === viewedUser) : null

  return (
    <section className="module-view panel" style={{ minHeight: '500px' }}>
      <div className="module-toolbar" style={{ flexWrap: 'wrap', gap: 15 }}>
        <div>
          <span className="section-kicker">MONITORING</span>
          <h2>Izlanuvchilar monitoringi</h2>
          <p>Barcha yuklangan ish reja hujjatlari va choraklik hisobotlar</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 5, background: '#f0f4f2', padding: 3, borderRadius: 6 }}>
            {['all', '1', '2', '3'].map(st => (
              <button
                key={st}
                className={`secondary-button ${stageFilter === st ? 'primary-button' : ''}`}
                style={{ height: 28, minHeight: 28, fontSize: 11, padding: '0 8px' }}
                onClick={() => setStageFilter(st)}
              >
                {st === 'all' ? 'Barcha bosqichlar' : `${st}-bosqich`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`secondary-button ${subTab === 'ish_reja' ? 'primary-button' : ''}`} style={subTab === 'ish_reja' ? {} : {background: 'transparent', borderColor: '#dce5e0'}} onClick={() => setSubTab('ish_reja')}><FileText size={15} /> Ish reja hujjatlari ({files.length})</button>
            <button className={`secondary-button ${subTab === 'monitoring' ? 'primary-button' : ''}`} style={subTab === 'monitoring' ? {} : {background: 'transparent', borderColor: '#dce5e0'}} onClick={() => setSubTab('monitoring')}><ClipboardCheck size={15} /> Monitoring hisobotlari ({reports.length})</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 15px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="search-box" style={{ width: 280 }}>
          <Search size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Izlanuvchi bo‘yicha qidirish..." />
        </div>
      </div>
      
      <div className="table-scroll">
        {subTab === 'ish_reja' ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{locale === 'ru' ? 'Соискатель' : locale === 'en' ? 'Researcher' : 'Izlanuvchi'}</th>
                <th>Bosqich</th>
                <th>HUJJATLAR SONI</th>
                <th>{locale === 'ru' ? 'ДЕЙСТВИЯ' : locale === 'en' ? 'ACTIONS' : 'HARAKATLAR'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrouped.map((g, i) => {
                const researcher = researchers.find(r => r.username === g.username) || {
                  name: g.username,
                  initials: (g.username || 'IZ').slice(0, 2).toUpperCase(),
                  color: 'blue',
                  stage: 1
                }
                return (
                  <tr key={g.username}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="researcher-cell">
                        <span className={`avatar avatar-${researcher.color || 'blue'}`}>{researcher.initials}</span>
                        <div>
                          <strong>{researcher.name}</strong>
                          <small>login: <code>{g.username}</code></small>
                        </div>
                      </div>
                    </td>
                    <td><span className="status-pill status-inProgress">{researcher.stage}-bosqich</span></td>
                    <td><strong>{g.documents.length} ta</strong> hujjat (punkt)</td>
                    <td>
                      <button className="icon-button" style={{ color: '#0043ce' }} title="Hujjatlarni ko'rish" onClick={() => setViewedUser(g.username)}><Eye size={16} /></button>
                    </td>
                  </tr>
                )
              })}
              {filteredGrouped.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 30, color: '#8b978e' }}>
                    Mos keluvchi ish reja hujjatlari topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>F.I.O.</th>
                <th>{locale === 'ru' ? 'ОРГАНИЗАЦИЯ' : locale === 'en' ? 'ORGANIZATION' : 'TASHKILOT'}</th>
                <th>BOSQICH</th>
                <th>{locale === 'ru' ? 'КВАРТАЛ' : locale === 'en' ? 'QUARTER' : 'CHORAK'}</th>
                <th>HOLAT</th>
                <th>{locale === 'ru' ? 'ДЕЙСТВИЯ' : locale === 'en' ? 'ACTIONS' : 'HARAKATLAR'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td><strong>{r.fio || r.username}</strong></td>
                  <td>{r.org}</td>
                  <td>{r.stage}-bosqich</td>
                  <td>{r.quarter}</td>
                  <td>
                    <span className={`status-pill ${r.status === 'Kutilmoqda' ? 'status-needsReview' : r.status === 'Qabul qilindi' ? 'status-inProgress' : 'status-atRisk'}`} 
                          style={r.status === 'Kutilmoqda' ? { backgroundColor: '#ff9800', color: '#fff' } : r.status === 'Rad etildi' ? { backgroundColor: '#da1e28', color: '#fff' } : {}}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'Kutilmoqda' ? (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="icon-button" style={{ color: '#58a071' }} title="Qabul qilish" onClick={() => changeReportStatus(r.id, 'Qabul qilindi')}><Check size={16} /></button>
                        <button className="icon-button" style={{ color: '#da1e28' }} title="Rad etish" onClick={() => changeReportStatus(r.id, 'Rad etildi')}><X size={16} /></button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#66746b' }}>Ko‘rib chiqilgan</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: '#8b978e' }}>
                    Mos keluvchi hisobotlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {viewedUser && (
        <div className="modal-backdrop">
          <section className="researcher-detail-modal" style={{ width: 800 }}>
            <div className="modal-top">
              <div><span className="section-kicker">HUJJATLAR</span><h2>{viewedResearcher?.name || viewedUser} hujjatlari</h2></div>
              <button className="icon-button" onClick={() => setViewedUser(null)}><X size={19}/></button>
            </div>
            <div className="table-scroll" style={{ padding: '0 20px 20px' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>HUJJAT NOMI</th><th>{locale === 'ru' ? 'ПЕРИОД' : locale === 'en' ? 'PERIOD' : 'DAVR'}</th><th>{locale === 'ru' ? 'ТИП РАБОТЫ' : locale === 'en' ? 'WORK TYPE' : 'ISH TURI'}</th><th>{locale === 'ru' ? 'ФАЙЛ' : locale === 'en' ? 'FILE' : 'FAYL'}</th>
                  </tr>
                </thead>
                <tbody>
                  {userDocuments.map((f, i) => (
                    <tr key={f.id}>
                      <td>{i + 1}</td>
                      <td>{f.name}</td>
                      <td>{f.period}</td>
                      <td>{f.type}</td>
                      <td>
                        {f.files && f.files.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {f.files.map((file, idx) => (
                              <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="text-link" style={{fontSize: 12}}>
                                {file.name} ({file.size})
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-link" style={{fontSize: 12}}>{f.fileName} ({f.size})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {userDocuments.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#8b978e' }}>Hujjatlar mavjud emas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default App
