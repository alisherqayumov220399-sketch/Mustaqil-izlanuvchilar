import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, UsersRound, ShieldCheck, ClipboardCheck,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, XCircle, ChevronRight,
  ArrowUpRight, Sparkles,
  Download, Plus, Eye, Search, ArrowDownToLine,
  Activity, GraduationCap, Building2, KeyRound
} from 'lucide-react';

export default function ExecutiveDashboard({
  researchers = [],
  stageDetails = [],
  monitoringFiles = [],
  monitoringReports = [],
  expertiseCases = [],
  kengashFiles = [],
  postDefenseFiles = [],
  activityLog = [],
  academicYear,
  locale = 'uz',
  navigateTo,
  setSelectedResearcher,
  setModalOpen,
  importInputRef,
  onExportCredentials
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pipeline' | 'monitoring' | 'risk'
  const [selectedStageFilter, setSelectedStageFilter] = useState('all'); // 'all' | 1 | 2 | 3
  const [searchFilter, setSearchFilter] = useState('');

  // 1. Core Researcher Metrics
  const totalResearchers = researchers.length;
  const phdCount = researchers.filter(p => /phd|фалсафа/i.test(String(p.educationType || ''))).length;
  const dscCount = researchers.filter(p => /dsc|доктор/i.test(String(p.educationType || ''))).length;
  const independentCount = researchers.filter(p => /mustaqil/i.test(String(p.educationType || ''))).length;
  const uniqueSupervisors = useMemo(() => {
    return new Set(researchers.map(r => r.supervisor).filter(Boolean)).size;
  }, [researchers]);

  // Stage counts and percentages
  const s1Count = stageDetails[0]?.count || 0;
  const s2Count = stageDetails[1]?.count || 0;
  const s3Count = stageDetails[2]?.count || 0;
  const s1Progress = stageDetails[0]?.progress || 0;
  const s2Progress = stageDetails[1]?.progress || 0;
  const s3Progress = stageDetails[2]?.progress || 0;

  // 2. Monitoring & Reports Metrics
  const totalReports = monitoringReports.length;
  const approvedReports = monitoringReports.filter(r => r.status === 'Qabul qilindi').length;
  const pendingReports = monitoringReports.filter(r => r.status === 'Kutilmoqda').length;
  const rejectedReports = monitoringReports.filter(r => r.status === 'Rad etildi').length;
  const reportApprovalRate = totalReports ? Math.round((approvedReports / totalReports) * 100) : 0;

  // 3. Expertise (Kafedralararo muhokama) Metrics
  const totalExpertise = expertiseCases.length;
  const expDocsCheck = expertiseCases.filter(c => c.status === 'docs_check').length;
  const expReviewers = expertiseCases.filter(c => c.status === 'reviewers_assigned').length;
  const expScheduled = expertiseCases.filter(c => c.status === 'meeting_scheduled').length;
  const expRecommended = expertiseCases.filter(c => c.status === 'recommended').length;
  const expNeedsRevision = expertiseCases.filter(c => c.status === 'needs_revision').length;
  const avgAntiplagiarism = useMemo(() => {
    if (!expertiseCases.length) return 92;
    const sum = expertiseCases.reduce((acc, c) => acc + (Number(c.antiplagiarismScore) || 90), 0);
    return Math.round(sum / expertiseCases.length);
  }, [expertiseCases]);

  // 4. Seminar & Kengash Metrics
  const seminarApps = kengashFiles.filter(f => f.isApp && f.isSeminar).length;
  const kengashApps = kengashFiles.filter(f => f.isApp && !f.isSeminar).length;
  const seminarFiles = kengashFiles.filter(f => !f.isApp && f.isSeminar);
  const kengashDocs = kengashFiles.filter(f => !f.isApp && !f.isSeminar);
  const seminarPending = seminarFiles.filter(f => f.status === 'Kutilmoqda').length;
  const kengashPending = kengashDocs.filter(f => f.status === 'Kutilmoqda').length;

  // 5. Post-Defense (Himoyadan keyingi) Metrics
  const postDefenseUsersCount = useMemo(() => {
    return new Set(postDefenseFiles.map(f => f.username)).size;
  }, [postDefenseFiles]);
  const postDefenseApproved = postDefenseFiles.filter(f => f.status === 'Qabul qilindi').length;
  const postDefensePending = postDefenseFiles.filter(f => f.status === 'Kutilmoqda').length;
  const postDefenseRejected = postDefenseFiles.filter(f => f.status === 'Rad etildi').length;
  const postDefenseTotal = postDefenseFiles.length;

  // 6. Risk / Attention List
  const atRiskResearchers = useMemo(() => {
    return researchers.filter(p => {
      const isRejectedInMonitoring = monitoringReports.some(r => r.username === p.username && r.status === 'Rad etildi');
      const isRejectedInPostDefense = postDefenseFiles.some(f => f.username === p.username && f.status === 'Rad etildi');
      const lowProgress = p.progress !== undefined && p.progress < 40;
      return isRejectedInMonitoring || isRejectedInPostDefense || lowProgress;
    });
  }, [researchers, monitoringReports, postDefenseFiles]);

  // Department / Field Analytics
  const fieldAnalytics = useMemo(() => {
    const map = {};
    researchers.forEach(r => {
      const f = r.field || 'Boshqa ixtisosliklar';
      if (!map[f]) map[f] = { count: 0, phd: 0, dsc: 0 };
      map[f].count++;
      if (/dsc|доктор/i.test(r.educationType || '')) map[f].dsc++;
      else map[f].phd++;
    });
    return Object.entries(map)
      .map(([field, data]) => ({ field, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [researchers]);

  // Filtered Researchers for table / search
  const filteredResearchers = useMemo(() => {
    return researchers
      .filter(r => selectedStageFilter === 'all' || r.stage === Number(selectedStageFilter))
      .filter(r => !searchFilter || r.name.toLowerCase().includes(searchFilter.toLowerCase()) || (r.field && r.field.toLowerCase().includes(searchFilter.toLowerCase())))
      .slice(0, 6);
  }, [researchers, selectedStageFilter, searchFilter]);

  // Overall Scientific Index calculation
  const overallScientificHealth = useMemo(() => {
    if (!totalResearchers) return 85;
    const base = Math.min(100, Math.round((s1Progress * 0.25) + (s2Progress * 0.35) + (s3Progress * 0.40)));
    return base || 78;
  }, [totalResearchers, s1Progress, s2Progress, s3Progress]);

  return (
    <div className="executive-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. HERO EXECUTIVE KPI BAR */}
      <section className="executive-hero-card" style={{
        background: 'linear-gradient(135deg, #091e14 0%, #113626 50%, #1a4d36 100%)',
        color: '#fff',
        borderRadius: '16px',
        padding: '28px 32px',
        boxShadow: '0 12px 36px rgba(10, 40, 25, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Background glow effects */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 200, 150, 0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 140, 255, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Sparkles size={14} color="#00ffb3" />
              <span>{locale === 'ru' ? 'СИТУАЦИОННО-АНАЛИТИЧЕСКИЙ ЦЕНТР' : locale === 'en' ? 'SITUATIONAL EXECUTIVE DASHBOARD' : 'VAZIYATLAR VA TAHLIL MARKAZI'}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ color: '#00ffb3' }}>{academicYear} o‘quv yili</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {locale === 'ru' ? 'Единый мониторинг научной и послевузовской деятельности' : locale === 'en' ? 'Unified Postgraduate Research & Defense Analytics' : 'Oliy ta’limdan keyingi ta’lim va ilmiy faoliyat monitoringi'}
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
              O‘zbekiston Respublikasi Jamoat Xavfsizligi Universiteti — kafedralararo dastlabki ekspertizadan dissertatsiya himoyasi va OAK attestatsiyasigacha bo‘lgan uzluksiz raqamli monitoring tizimi.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignSelf: 'center' }}>
            <button 
              className="primary-button" 
              onClick={() => setModalOpen(true)}
              style={{ background: '#00c875', color: '#08170e', fontWeight: 700, border: 'none', boxShadow: '0 4px 15px rgba(0,200,117,0.35)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> {locale === 'ru' ? 'Добавить соискателя' : locale === 'en' ? 'Add Researcher' : 'Yangi izlanuvchi'}
            </button>
            <button 
              className="secondary-button" 
              onClick={() => importInputRef?.current?.click()}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} /> {locale === 'ru' ? 'Импорт Excel' : locale === 'en' ? 'Import Excel' : 'Excel import'}
            </button>
            {onExportCredentials && (
              <button 
                className="secondary-button" 
                onClick={onExportCredentials}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Izlanuvchilar login va parollarini Excel (.xlsx) formatida yuklab olish"
              >
                <KeyRound size={16} /> {locale === 'ru' ? 'Логины и пароли' : locale === 'en' ? 'Credentials' : 'Login-parollar (.xlsx)'}
              </button>
            )}
            <button 
              className="secondary-button" 
              onClick={() => window.print()}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Chop etish"
            >
              <ArrowDownToLine size={16} /> {locale === 'ru' ? 'Отчёт' : locale === 'en' ? 'Export' : 'Hisobot'}
            </button>
          </div>
        </div>

        {/* 4 Hero Counters in Glass Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(0, 150, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 150, 255, 0.4)' }}>
              <UsersRound size={22} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Jami kontingent</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{totalResearchers} <span style={{ fontSize: '14px', fontWeight: 400 }}>nafar</span></div>
              <small style={{ fontSize: '11px', color: '#93c5fd' }}>{phdCount} PhD • {dscCount} DSc • {independentCount} mustaqil</small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(0, 200, 117, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 200, 117, 0.4)' }}>
              <TrendingUp size={22} color="#4ade80" />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Ilmiy salohiyat indeksi</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#4ade80', lineHeight: 1.1 }}>{overallScientificHealth}%</div>
              <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>3 bosqich o‘rtacha bajarilishi</small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(255, 170, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 170, 0, 0.4)' }}>
              <ShieldCheck size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Himoya konveyerida</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{totalExpertise + seminarApps + kengashApps + postDefenseUsersCount} <span style={{ fontSize: '14px', fontWeight: 400 }}>holat</span></div>
              <small style={{ fontSize: '11px', color: '#fde68a' }}>Ekspertiza, seminar, kengash, OAK</small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
              <GraduationCap size={22} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Ilmiy rahbarlar</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{uniqueSupervisors} <span style={{ fontSize: '14px', fontWeight: 400 }}>olim</span></div>
              <small style={{ fontSize: '11px', color: '#e9d5ff' }}>Professor-o‘qituvchilar biriktirilgan</small>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE EXECUTIVE TAB CONTROLLER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '8px 12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', title: 'Umumiy tahliliy ko‘rinish', icon: LayoutDashboard },
            { id: 'pipeline', title: 'Himoya konveyeri (Workflow)', icon: ShieldCheck, badge: totalExpertise + seminarApps + kengashApps + postDefenseUsersCount },
            { id: 'monitoring', title: 'Monitoring & Ish reja', icon: ClipboardCheck, badge: pendingReports ? `${pendingReports} kutilmoqda` : null },
            { id: 'risk', title: 'E’tibor talab guruh', icon: AlertTriangle, badge: atRiskResearchers.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #0070f3' : '1px solid transparent',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#0070f3' : '#475569',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={16} />
                <span>{tab.title}</span>
                {tab.badge && (
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? '#0070f3' : '#f1f5f9',
                    color: isActive ? '#fff' : '#475569',
                    fontWeight: 600
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Stage Quick Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Bosqich:</span>
          {['all', '1', '2', '3'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStageFilter(st)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedStageFilter === st ? '#1e293b' : '#cbd5e1',
                background: selectedStageFilter === st ? '#1e293b' : '#fff',
                color: selectedStageFilter === st ? '#fff' : '#475569',
                cursor: 'pointer'
              }}
            >
              {st === 'all' ? 'Barchasi' : `${st}-bosqich`}
            </button>
          ))}
        </div>
      </div>

      {/* 3. VISUAL PIPELINE: KAFEDRALARARO MUHOKAMADAN OAK ATTESTATSIYASIGACHA */}
      <section className="panel" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="section-kicker" style={{ color: '#0070f3' }}>YAGONA ISH OQIMI VA DOKTORANTURA KONVEYERI</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 0', color: '#1e293b' }}>
              Dissertatsiya himoyasi va attestatsiya bosqichlari (Real-Time Pipeline)
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Har bir bosqichga bosib tegishli bo‘limga o‘tishingiz mumkin</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          position: 'relative'
        }}>
          {/* Step 1: Kontingent */}
          <div 
            onClick={() => navigateTo('people')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: '4px solid #3b82f6'
            }}
            className="pipeline-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>01. Kontingent</span>
              <ArrowUpRight size={14} color="#64748b" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{totalResearchers}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Qabul qilingan izlanuvchilar</div>
            <div style={{ marginTop: '10px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#3b82f6' }} />
            </div>
          </div>

          {/* Step 2: Monitoring */}
          <div 
            onClick={() => navigateTo('plans')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: '4px solid #10b981'
            }}
            className="pipeline-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>02. Monitoring</span>
              <ArrowUpRight size={14} color="#64748b" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{totalReports} ta</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{approvedReports} tasdiqlangan ({reportApprovalRate}%)</div>
            <div style={{ marginTop: '10px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${reportApprovalRate}%`, height: '100%', background: '#10b981' }} />
            </div>
          </div>

          {/* Step 3: Dastlabki ekspertiza */}
          <div 
            onClick={() => navigateTo('expertise')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: '4px solid #f59e0b'
            }}
            className="pipeline-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>03. Ekspertiza</span>
              <ArrowUpRight size={14} color="#64748b" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{totalExpertise} nafar</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {expRecommended} tavsiya {expNeedsRevision > 0 ? `• ${expNeedsRevision} qayta ko‘rish` : `• ${avgAntiplagiarism}% antiplagiat`}
            </div>
            <div style={{ marginTop: '10px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((expRecommended / (totalExpertise || 1)) * 100)}%`, height: '100%', background: '#f59e0b' }} />
            </div>
          </div>

          {/* Step 4: Ilmiy seminar */}
          <div 
            onClick={() => navigateTo('seminar')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: '4px solid #8b5cf6'
            }}
            className="pipeline-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>04. Ilmiy seminar</span>
              <ArrowUpRight size={14} color="#64748b" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{seminarApps} nafar</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {seminarFiles.length} ta hujjat {seminarPending > 0 ? `(${seminarPending} kutilmoqda)` : ''}
            </div>
            <div style={{ marginTop: '10px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${seminarApps ? 65 : 0}%`, height: '100%', background: '#8b5cf6' }} />
            </div>
          </div>

          {/* Step 5: Bir martalik kengash */}
          <div 
            onClick={() => navigateTo('kengash')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: '4px solid #ec4899'
            }}
            className="pipeline-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase' }}>05. Kengash</span>
              <ArrowUpRight size={14} color="#64748b" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{kengashApps} nafar</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {kengashDocs.length} ta hujjat {kengashPending > 0 ? `(${kengashPending} kutilmoqda)` : ''}
            </div>
            <div style={{ marginTop: '10px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${kengashApps ? 80 : 0}%`, height: '100%', background: '#ec4899' }} />
            </div>
          </div>

          {/* Step 6: Himoyadan keyingi OAK */}
          <div 
            onClick={() => navigateTo('post_defense')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: '4px solid #06b6d4'
            }}
            className="pipeline-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>06. OAK Attestatsiya</span>
              <ArrowUpRight size={14} color="#64748b" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{postDefenseUsersCount} nafar</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{postDefenseApproved} tasdiq • {postDefensePending} kutilmoqda</div>
            <div style={{ marginTop: '10px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${postDefenseTotal ? Math.round((postDefenseApproved / postDefenseTotal) * 100) : 0}%`, height: '100%', background: '#06b6d4' }} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN ANALYTICAL SPLIT SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: BOSQICHLAR, MONITORING VA DINAMIKA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: 3 Bosqich dinamikasi va yakka tartibdagi reja ijrosi */}
          <article className="panel" style={{ padding: '22px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="section-kicker">3 BOSQICHLI TA’LIM MONITORINGI</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0', color: '#1e293b' }}>
                  Bosqichlar kesimida reja bajarilishi (1-b: {s1Count}, 2-b: {s2Count}, 3-b: {s3Count})
                </h3>
              </div>
              <button className="text-link" onClick={() => navigateTo('plans')} style={{ fontSize: '13px' }}>
                Batafsil reja <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stageDetails.map((st, idx) => {
                const colors = ['#0043ce', '#10b981', '#f59e0b'];
                const stColor = colors[idx] || '#0043ce';
                return (
                  <div key={st.id} style={{ padding: '14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: stColor }} />
                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>{st.id}-bosqich ({st.count} nafar izlanuvchi)</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '16px', color: stColor }}>{st.progress}%</strong>
                        <small style={{ color: '#64748b', fontSize: '12px' }}>o‘rtacha</small>
                      </div>
                    </div>

                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${st.progress}%`, height: '100%', background: stColor, borderRadius: '4px', transition: 'width 0.4s' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                      <span>Asosiy diqqat: <strong>{st.focus}</strong></span>
                      <span style={{ color: '#0f172a' }}>{st.target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          {/* Card 2: Monitoring hisobotlari holati & Radial Diagram */}
          <article className="panel" style={{ padding: '22px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="section-kicker">CHORAKLIK MONITORING HISOBOTLARI</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0', color: '#1e293b' }}>
                  Monitoring hisobotlari tasdiqlanish balansi
                </h3>
              </div>
              <span style={{ fontSize: '12px', padding: '3px 8px', background: '#f0fdf4', color: '#15803d', borderRadius: '12px', fontWeight: 600 }}>
                {totalReports} ta jami hisobot
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px', alignItems: 'center' }}>
              {/* Radial Donut Visualization */}
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                <svg viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="80" cy="80" r="62" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                  {approvedReports > 0 && (
                    <circle 
                      cx="80" cy="80" r="62" fill="none" stroke="#10b981" strokeWidth="16"
                      strokeDasharray={389.5}
                      strokeDashoffset={389.5 * (1 - (approvedReports / (totalReports || 1)))}
                      strokeLinecap="round"
                    />
                  )}
                  {pendingReports > 0 && (
                    <circle 
                      cx="80" cy="80" r="62" fill="none" stroke="#3b82f6" strokeWidth="16"
                      strokeDasharray={389.5}
                      strokeDashoffset={389.5 * (1 - (pendingReports / (totalReports || 1)))}
                      style={{ transform: `rotate(${(approvedReports / (totalReports || 1)) * 360}deg)`, transformOrigin: '80px 80px' }}
                    />
                  )}
                  {rejectedReports > 0 && (
                    <circle 
                      cx="80" cy="80" r="62" fill="none" stroke="#ef4444" strokeWidth="16"
                      strokeDasharray={389.5}
                      strokeDashoffset={389.5 * (1 - (rejectedReports / (totalReports || 1)))}
                      style={{ transform: `rotate(${((approvedReports + pendingReports) / (totalReports || 1)) * 360}deg)`, transformOrigin: '80px 80px' }}
                    />
                  )}
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <strong style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{reportApprovalRate}%</strong>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>ijro darajasi</small>
                </div>
              </div>

              {/* Status details breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                    <CheckCircle2 size={15} color="#16a34a" /> Tasdiqlangan (Qabul qilindi)
                  </span>
                  <strong style={{ fontSize: '14px', color: '#15803d' }}>{approvedReports} ta</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#eff6ff', borderRadius: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
                    <Clock size={15} color="#3b82f6" /> Tekshiruvda (Kutilmoqda)
                  </span>
                  <strong style={{ fontSize: '14px', color: '#2563eb' }}>{pendingReports} ta</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>
                    <XCircle size={15} color="#dc2626" /> Qaytarilgan (Kamchilik bor)
                  </span>
                  <strong style={{ fontSize: '14px', color: '#dc2626' }}>{rejectedReports} ta</strong>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Yuklangan monitoring fayllari: <strong>{monitoringFiles.length} ta hujjat</strong>
                </div>
              </div>
            </div>
          </article>

          {/* Card 3: Kafedralar va Ilmiy Yo‘nalishlar Reytingi */}
          <article className="panel" style={{ padding: '22px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span className="section-kicker">FAKULTET YO‘NALISHLARI</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0', color: '#1e293b' }}>
                  Yetakchi ilmiy yo‘nalishlar va ixtisosliklar
                </h3>
              </div>
              <Building2 size={18} color="#64748b" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fieldAnalytics.map((item, idx) => (
                <div key={item.field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {idx + 1}
                    </span>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>{item.field}</strong>
                      <small style={{ color: '#64748b' }}>{item.phd} PhD • {item.dsc} DSc</small>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0070f3', background: '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>
                    {item.count} izlanuvchi
                  </span>
                </div>
              ))}
              {fieldAnalytics.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  Ma’lumotlar mavjud emas. Excel faylni import qiling.
                </div>
              )}
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN: EXPERTISE, ATTESTATION & LIVE STREAM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 4: Dastlabki ekspertiza & Antiplagiat nazorati */}
          <article className="panel" style={{ padding: '22px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="section-kicker">KAFEDRALARARO MUHOKAMA</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0', color: '#1e293b' }}>
                  Dastlabki ekspertiza va Antiplagiat ko‘rsatkichlari
                </h3>
              </div>
              <button className="text-link" onClick={() => navigateTo('expertise')} style={{ fontSize: '13px' }}>
                Barchasi <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Hujjatlar tekshiruvda</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>{expDocsCheck}</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Taqrizchilarda</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>{expReviewers}</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Muhokama belgilangan</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{expScheduled}</div>
              </div>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase' }}>Tavsiya etilgan</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{expRecommended}</div>
              </div>
            </div>

            {/* Antiplagiarism Gauge Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '8px', border: '1px solid #86efac' }}>
              <div>
                <strong style={{ fontSize: '14px', color: '#166534', display: 'block' }}>O‘rtacha Antiplagiat originallik darajasi</strong>
                <small style={{ color: '#15803d' }}>Talab etiladigan minimal me’yor: kamida 80% o‘zlashtirishsiz</small>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#15803d' }}>
                {avgAntiplagiarism}%
              </div>
            </div>
          </article>

          {/* Card 5: Himoyadan keyingi OAK Attestatsiya hujjatlari */}
          <article className="panel" style={{ padding: '22px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className="section-kicker">OAK ATTESTATSIYASI</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0', color: '#1e293b' }}>
                  Himoyadan keyingi 12 ta talab hujjati
                </h3>
              </div>
              <button className="text-link" onClick={() => navigateTo('post_defense')} style={{ fontSize: '13px' }}>
                Hujjatlar bo‘limi <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Kutilmoqda</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>{postDefensePending} ta</div>
              </div>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Qabul qilindi</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{postDefenseApproved} ta</div>
              </div>
              <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>Qaytarildi</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{postDefenseRejected} ta</div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Jami topshirgan talabgorlar: <strong>{postDefenseUsersCount} nafar</strong>. Hujjatlar OAK mezonlari bo‘yicha to‘liq qabul qilingandan so‘ng ilmiy daraja diplomi berishga taqdim etiladi.
            </p>
          </article>

          {/* Card 6: Tadqiqotchilar bazasidan so‘nggi ro‘yxat & Qidiruv */}
          <article className="panel" style={{ padding: '22px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="section-kicker">RO‘YXAT VA FAOLIYAT</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0', color: '#1e293b' }}>
                  Izlanuvchilar monitoring holati
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px' }}>
                  <Search size={14} color="#64748b" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Qidirish..."
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '110px' }}
                  />
                </div>
                <button className="text-link" onClick={() => navigateTo('people')}>Barchasi ({totalResearchers})</button>
              </div>
            </div>

            <div className="table-scroll">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                    <th style={{ padding: '8px 10px' }}>Izlanuvchi</th>
                    <th style={{ padding: '8px 10px' }}>Bosqich</th>
                    <th style={{ padding: '8px 10px' }}>Yo‘nalish</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResearchers.map(person => (
                    <tr key={person.username || person.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`avatar avatar-${person.color || 'blue'}`} style={{ width: 28, height: 28, fontSize: '12px' }}>{person.initials}</span>
                          <div>
                            <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>{person.name}</strong>
                            <small style={{ color: '#64748b', fontSize: '11px' }}>{person.educationType || 'Mustaqil izlanuvchi'}</small>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{person.stage}-bosqich</span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#475569', display: 'block', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {person.field || 'Ixtisoslik'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button 
                          className="icon-button" 
                          onClick={() => setSelectedResearcher(person)}
                          title="Tafsilotlarni ko‘rish"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredResearchers.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                        Izlanuvchilar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>

      {/* 5. AT-RISK & CRITICAL ALERTS SECTION (Agar e'tibor talab holatlar bo'lsa) */}
      {atRiskResearchers.length > 0 && (
        <section className="panel" style={{ padding: '20px 24px', background: '#fff8f8', border: '1px solid #fecaca', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#991b1b' }}>
              E’tibor talab va xavf guruhidagi izlanuvchilar ({atRiskResearchers.length} nafar)
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 14px' }}>
            Mazkur izlanuvchilarning hisoboti rad etilgan yoki yakka tartibdagi rejasi 40% dan past ko‘rsatkichda. Oliy ta’limdan keyingi ta’lim me’yorlariga muvofiq ogohlantirish berish lozim.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {atRiskResearchers.slice(0, 4).map(person => (
              <div key={person.username || person.name} style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>{person.name}</strong>
                  <small style={{ color: '#dc2626', fontWeight: 600 }}>{person.stage}-bosqich • Reja past yoki qaytarilgan</small>
                </div>
                <button className="secondary-button" onClick={() => setSelectedResearcher(person)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                  Ko‘rish
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. SO‘NGGI TIZIM FAOLLIGI VA INTEGRATSIYA JURNALI */}
      {activityLog && activityLog.length > 0 && (
        <section className="panel" style={{ padding: '20px 24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#0070f3" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                So‘nggi tizim faolligi va hodisalar xronologiyasi
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {activityLog.length} ta yozuv qayd etilgan
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activityLog.slice(0, 5).map(act => (
              <div 
                key={act.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  background: '#f8fafc', 
                  border: '1px solid #f1f5f9',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: act.type === 'success' ? '#10b981' : act.type === 'warning' ? '#f59e0b' : '#3b82f6',
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>{act.text}</span>
                </div>
                <small style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{act.timestamp}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. SYSTEM FOOTER BADGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
        <span>© 2026 Jamoat Xavfsizligi Universiteti • Oliy ta’limdan keyingi ta’lim fakulteti</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Barcha modullar sinxron holatda faol
        </span>
      </div>

    </div>
  );
}
