import { useState } from 'react'
import { BookOpen, Calendar, ChevronRight, Clock, FileCheck, Info, Sparkles, UserCheck } from 'lucide-react'

export default function NizomView({ onNavigateExpertise, locale }) {
  const [activeTab, setActiveTab] = useState('all') // 'all', 'chap2', 'chap3', 'chap4', 'annex1', 'calc'
  const [calcDegree, setCalcDegree] = useState('PhD')
  const [calcDate, setCalcDate] = useState(() => new Date().toISOString().slice(0, 10))

  // Calculate regulatory deadlines based on submission date
  const submissionDateObj = new Date(calcDate || new Date())
  
  // 7-band: PhD 1 oy, DSc 2 oy
  const maxMeetingDateObj = new Date(submissionDateObj)
  if (calcDegree === 'PhD') {
    maxMeetingDateObj.setMonth(maxMeetingDateObj.getMonth() + 1)
  } else {
    maxMeetingDateObj.setMonth(maxMeetingDateObj.getMonth() + 2)
  }

  // 15-band: Kun tartibi a'zolarga kamida 5 kun oldin tarqatiladi
  const agendaNoticeDateObj = new Date(maxMeetingDateObj)
  agendaNoticeDateObj.setDate(agendaNoticeDateObj.getDate() - 5)

  // 9-band: Anonim va boshqa taqrizlar talabgorga kamida 5 kun oldin beriladi
  const reviewsDeadlineObj = new Date(maxMeetingDateObj)
  reviewsDeadlineObj.setDate(reviewsDeadlineObj.getDate() - 5)

  const formatDate = (date) => {
    return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="nizom-container">
      <div className="nizom-hero">
        <div className="nizom-hero-content">
          <span className="section-kicker">{locale === 'ru' ? 'ОФИЦИАЛЬНЫЙ НОРМАТИВНЫЙ ДОКУМЕНТ' : locale === 'en' ? 'OFFICIAL REGULATORY DOCUMENT' : 'RASMIY ME’YORIY HUJJAT'}</span>
          <h2>{locale === 'ru' ? 'Положение о порядке предварительной экспертизы диссертации' : locale === 'en' ? 'Regulation on preliminary expertise of dissertation' : 'Universitetda dissertatsiya ishini dastlabki ekspertizadan o‘tkazish tartibi to‘g‘risidagi Nizom'}</h2>
          <p>
            OAK Rayosatining 20.03.2015 yildagi 214/8-son qarori, VMning 2017-yil 22-maydagi 304-son qarori hamda OAKning 28.02.2022 yildagi 312/6-son qarorlari asosida ishlab chiqilgan.
          </p>
        </div>
        <div className="nizom-hero-badges">
          <div className="nizom-stat-card">
            <Clock size={18} />
            <div>
              <strong>1 oy / 2 oy</strong>
              <span>PhD 1 oyda, DSc 2 oyda ekspertiza</span>
            </div>
          </div>
          <div className="nizom-stat-card">
            <FileCheck size={18} />
            <div>
              <strong>11 ta hujjat</strong>
              <span>1-ilova majburiy ro‘yxati</span>
            </div>
          </div>
          <div className="nizom-stat-card">
            <UserCheck size={18} />
            <div>
              <strong>2 yoki 3 taqrizchi</strong>
              <span>Kamida 1 nafari anonim shaklda</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="nizom-tabs">
        <button
          className={`nizom-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <BookOpen size={15} />{locale === 'ru' ? 'Все' : locale === 'en' ? 'All' : 'Barchasi'}</button>
        <button
          className={`nizom-tab-btn ${activeTab === 'chap2' ? 'active' : ''}`}
          onClick={() => setActiveTab('chap2')}
        >
          II bob. Taqdim etish tartibi
        </button>
        <button
          className={`nizom-tab-btn ${activeTab === 'chap3' ? 'active' : ''}`}
          onClick={() => setActiveTab('chap3')}
        >
          III bob. Ekspertizadan o‘tkazish
        </button>
        <button
          className={`nizom-tab-btn ${activeTab === 'annex1' ? 'active' : ''}`}
          onClick={() => setActiveTab('annex1')}
        >
          1-ilova. 11 ta hujjat
        </button>
        <button
          className={`nizom-tab-btn ${activeTab === 'calc' ? 'active' : ''}`}
          onClick={() => setActiveTab('calc')}
        >
          <Calendar size={15} />{locale === 'ru' ? 'Калькулятор сроков' : locale === 'en' ? 'Deadline Calculator' : 'Muddatlar kalkulyatori'}</button>
      </div>

      {/* Calculator tab */}
      {activeTab === 'calc' && (
        <div className="panel nizom-calc-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">AVTOMATIK HISOBLAGICH</span>
              <h2>Nizom bo‘yicha me’yoriy muddatlar kalkulyatori</h2>
              <p>7-band, 9-band va 15-bandlar talablariga muvofiq qat’iy muddatlarni aniqlang</p>
            </div>
          </div>

          <div className="calc-grid">
            <div className="calc-inputs">
              <label>
                Talabgorning ilmiy darajasi:
                <select value={calcDegree} onChange={(e) => setCalcDegree(e.target.value)}>
                  <option value="PhD">Falsafa doktori (PhD) — 1 oy ichida o‘tkaziladi</option>
                  <option value="DSc">Fan doktori (DSc) — 2 oy ichida o‘tkaziladi</option>
                </select>
              </label>

              <label>
                Hujjatlar qabul qilingan sana (bildirgi/ariza):
                <input
                  type="date"
                  value={calcDate}
                  onChange={(e) => setCalcDate(e.target.value)}
                />
              </label>

              <div className="calc-rules-reminder">
                <Info size={16} />
                <span>
                  <strong>Eslatma (6-band):</strong> Talabgor muhokamadan kamida 1 oy oldin Universitet boshlig‘i nomiga bildirgi bilan murojaat qiladi.
                </span>
              </div>
            </div>

            <div className="calc-results">
              <h3>Belgilangan me’yoriy muddatlar zanjiri:</h3>
              <div className="calc-timeline">
                <div className="calc-timeline-step">
                  <div className="step-marker done">1</div>
                  <div className="step-body">
                    <strong>Hujjatlar topshirildi</strong>
                    <span>{formatDate(submissionDateObj)}</span>
                    <small>1-ilovadagi 11 ta hujjat qabul qilinadi</small>
                  </div>
                </div>

                <div className="calc-timeline-step">
                  <div className="step-marker alert">2</div>
                  <div className="step-body">
                    <strong>Kun tartibi tarqatilishi va e’lon</strong>
                    <span className="highlight-date">{formatDate(agendaNoticeDateObj)} gacha</span>
                    <small>15-band: A’zolarga va Axborot guruhiga kamida 5 kun oldin beriladi</small>
                  </div>
                </div>

                <div className="calc-timeline-step">
                  <div className="step-marker alert">3</div>
                  <div className="step-body">
                    <strong>Taqrizlar talabgorga berilishi</strong>
                    <span className="highlight-date">{formatDate(reviewsDeadlineObj)} gacha</span>
                    <small>9-band: Anonim va boshqa taqrizlar talabgorga kamida 5 kun oldin taqdim etiladi</small>
                  </div>
                </div>

                <div className="calc-timeline-step">
                  <div className="step-marker final">4</div>
                  <div className="step-body">
                    <strong>Kafedralararo majlisining so‘nggi kuni</strong>
                    <span className="highlight-date final-date">{formatDate(maxMeetingDateObj)} gacha</span>
                    <small>7-band: {calcDegree} ishi topshirilgan kundan e’tiboran {calcDegree === 'PhD' ? '1 oy' : '2 oy'} ichida o‘tkazilishi shart</small>
                  </div>
                </div>
              </div>

              <div className="calc-footer-action">
                <button className="primary-button" onClick={onNavigateExpertise}>
                  Dastlabki ekspertiza arizalariga o‘tish <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11-band Highlight Callout */}
      {(activeTab === 'all' || activeTab === 'chap2') && (
        <div className="nizom-callout-exempt">
          <div className="callout-icon">
            <Sparkles size={22} />
          </div>
          <div className="callout-content">
            <h4>11-band: Himoyasiz ilmiy daraja berish (Dastlabki ekspertizadan ozod etish)</h4>
            <p>
              OAK Rayosatining 28.02.2022 yildagi 312/6-son qaroriga asosan: salmoqli ilmiy yangiliklar olgan va yuqori impakt-faktorli xalqaro jurnallarda
              <b> kamida 12 ta</b> (ijtimoiy-gumanitar bo‘yicha 8 ta) maqola chop ettirgan mutaxassisga <b>Fan doktori (DSc)</b>,
              <b> kamida 6 ta</b> (ijtimoiy-gumanitar bo‘yicha 4 ta) maqola chop ettirgan mutaxassisga <b>Falsafa doktori (PhD)</b> ilmiy darajasi dissertatsiya himoyasisiz berilishi mumkin va ular <u>dastlabki ekspertizani o‘tkazishdan ozod etiladi</u>.
            </p>
          </div>
        </div>
      )}

      {/* Chapters content */}
      <div className="nizom-content-grid">
        {(activeTab === 'all' || activeTab === 'chap2') && (
          <article className="panel nizom-chapter">
            <div className="chapter-header">
              <span className="section-kicker">II BOB</span>
              <h3>Dissertatsiya ishini dastlabki ekspertizaga taqdim etish tartibi</h3>
            </div>
            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-num">3</span>
                <p>Dissertatsiya “Dissertatsiya va dissertatsiya avtoreferatini rasmiylashtirish qoidalari” (OAK Rayosatining 20.03.2015 yildagi 214/8-son qarori)da belgilangan talablarga javob berishi lozim.</p>
              </div>
              <div className="rule-item">
                <span className="rule-num">4</span>
                <p>Dissertatsiya talabgor tomonidan shaxsan tayyorlanishi shart. Talabgor Dissertatsiyani yozishda plagiat, ma’lumotlarni soxtalashtirish, shuningdek soxta iqtiboslar keltirishga yo‘l qo‘ymasligi lozim.</p>
              </div>
              <div className="rule-item highlight-rule">
                <span className="rule-num">5</span>
                <p>Ilmiy rahbar tomonidan dissertatsiyani ko‘rib chiqish natijalari bo‘yicha ijobiy xulosa berilganda, talabgor tomonidan kafedralararo muhokamaga VMning 2017-yil 22-maydagi 304-son qarori talablari bajarilgan holda mazkur <b>Nizomning 1-ilovasida keltirilgan 11 ta hujjat</b> taqdim etilganda qabul etiladi.</p>
              </div>
              <div className="rule-item">
                <span className="rule-num">6</span>
                <p>Talabgor dissertatsiyani dastlabki ekspertizadan o‘tkazish uchun kafedralararo muhokamasidan <b>kamida bir oy oldin</b> Universitet boshlig‘i nomiga yoziladigan bildirgi/ariza (Universitet boshlig‘ining Ilmiy ishlar va innovatsiyalar bo‘yicha o‘rinbosari bilan kelishgan holda) bilan murojaat qilishi lozim.</p>
              </div>
              <div className="rule-item highlight-rule">
                <span className="rule-num">7</span>
                <p>Talabgor tomonidan hujjatlar topshirilgan kundan e’tiboran: <br />• <b>PhD</b> ilmiy darajasi uchun dissertatsiya ishi <b>1 oy ichida</b>; <br />• <b>DSc</b> ilmiy darajasi uchun dissertatsiya ishi <b>2 oy ichida</b> kafedralararo majlisida dastlabki ekspertizadan o‘tkazilishi lozim.</p>
              </div>
              <div className="rule-item">
                <span className="rule-num">8</span>
                <p>Tegishli kafedra tomonidan dissertatsiya dastlabki ekspertizadan o‘tkazish uchun qabul qilib olingandan so‘ng, kafedralararo muhokamasi kuni va taqrizchilar belgilanadi.</p>
              </div>
              <div className="rule-item highlight-rule">
                <span className="rule-num">9</span>
                <p>
                  Kafedra a’zolaridan yoki boshqa mutaxassis-olimlar orasidan <b>PhD uchun 2 nafar</b>, <b>DSc uchun 3 nafar taqrizchi</b> tayinlanadi. Taqrizchilardan biri <b>anonim shaklda</b> tayinlanadi. Anonim shaklda olingan taqriz va boshqa taqrizlar talabgorga <b>kamida 5 kun oldin</b> taqdim etiladi. Anonim taqrizchi ilmiy daraja yoki unvonga ega bo‘lishi yoki shu sohada <b>kamida 5 yillik amaliy tajribaga</b> ega bo‘lishi shart.
                </p>
              </div>
              <div className="rule-item">
                <span className="rule-num">10</span>
                <p>Ilmiy rahbar (maslahatchi) xulosasi, taqriz, dastlabki ekspertiza bayonnomasini rasmiylashtirishda sifatliligi va xolisliligini inobatga olgan holda o‘z vaqtida rasmiylashtirilishi lozim.</p>
              </div>
            </div>
          </article>
        )}

        {(activeTab === 'all' || activeTab === 'chap3') && (
          <article className="panel nizom-chapter">
            <div className="chapter-header">
              <span className="section-kicker">III BOB</span>
              <h3>Dissertatsiya ishini dastlabki ekspertizasidan o‘tkazish tartibi</h3>
            </div>
            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-num">12</span>
                <p>Dissertatsiyaning dastlabki ekspertizasi tegishli ixtisoslik yo‘nalishidan kelib chiqqan holda kafedralararo majlislarida o‘tkaziladi.</p>
              </div>
              <div className="rule-item highlight-rule">
                <span className="rule-num">13</span>
                <p>
                  Kafedralararo majlislarida talabgor biriktirilgan kafedraning boshlig‘i raislik qiladi. <br />
                  <b>Muhim cheklov:</b> Kafedra boshlig‘i ilmiy rahbarligida himoya qilinayotgan dissertatsiya muhokamasida <u>turdosh kafedra boshlig‘i (o‘rinbosari) yoki turdosh kafedra professori</u> majlisga raislik qilishi mumkin.
                </p>
              </div>
              <div className="rule-item">
                <span className="rule-num">14</span>
                <p>Kafedralararo majlislarida qabul qilingan qarorlar bayonnoma ko‘rinishida rasmiylashtiriladi hamda Universitet boshlig‘i yoki boshliqning Ilmiy-ishlar va inovatsiyalar bo‘yicha o‘rinbosari tomonidan tasdiqlanadi.</p>
              </div>
              <div className="rule-item">
                <span className="rule-num">15</span>
                <p>Kafedralararo majlisning kun tartibi a’zolarga majlis o‘tkazilishidan <b>kamida 5 kun oldin</b> mas’ul kafedra tomonidan tarqatiladi hamda Universitetning rasmiy ijtimoiy tarmoqlaridagi sahifalarida e’lon qilinishi uchun Axborot guruhiga ma’lumotlar taqdim qilinadi (xdfu va yopiq dissertatsiyalar bundan mustasno).</p>
              </div>
              <div className="rule-item">
                <span className="rule-num">16-19</span>
                <p>Majlis reglamenti: Rais ochadi, talabgor va mavzuni e’lon qiladi, kotib qisqacha ma’lumot beradi, talabgor ma’ruza qiladi (savol-javoblar), taqrizchilarga so‘z beriladi. Taqrizchilardan biri kelmasa o‘qib eshittiriladi, birortasi ham ishtirok etmasa majlis boshqa kunga qoldiriladi.</p>
              </div>
              <div className="rule-item alert-rule">
                <span className="rule-num">20</span>
                <p>Barcha taqrizchilar tomonidan ijobiy taqriz taqdim etilmagan taqdirda dissertatsiya ishi talabgorga taqrizlarda ko‘rsatilgan kamchiliklarni bartaraf etish uchun qaytariladi hamda kafedralararo majlisi boshqa muddatga qoldiriladi.</p>
              </div>
              <div className="rule-item highlight-rule">
                <span className="rule-num">23</span>
                <p>
                  Kafedralararo majlisining Ilmiy seminarga dissertatsiyani yuborish to‘g‘risidagi xulosasi ochiq ovoz berishda ko‘pchilik ovoz bilan qabul qilinadi. <br />
                  Xulosa: <b>“dissertatsiya keyingi bosqichga tavsiya etilsin”</b> yoki <b>“dissertatsiya qayta ishlash uchun tavsiya etilsin”</b> tarzida beriladi.
                </p>
              </div>
              <div className="rule-item">
                <span className="rule-num">24</span>
                <p>Agar majlis muayyan dissertatsiya bo‘yicha “dissertatsiya qayta ishlash uchun tavsiya etilsin” xulosasini qabul qilsa, ko‘rsatilgan kamchiliklar bartaraf etilgandan so‘ng, istisno tariqasida <b>kamida 1 (bir) oyda</b> dissertatsiya qayta dastlabki ekspertizadan o‘tkaziladi.</p>
              </div>
            </div>
          </article>
        )}

        {(activeTab === 'all' || activeTab === 'annex1') && (
          <article className="panel nizom-chapter full-width-chapter">
            <div className="chapter-header">
              <span className="section-kicker">NIZOMGA 1-ILOVA</span>
              <h3>Talabgor tomonidan dastlabki ekspertizaga taqdim etiladigan hujjatlar RO‘YXATI</h3>
              <p>Mazkur 11 ta hujjat to‘liq taqdim etilmaguncha kafedralararo muhokamaga qabul qilinmaydi</p>
            </div>
            <div className="annex-documents-grid">
              <div className="annex-doc-card">
                <span className="doc-num">01</span>
                <div>
                  <strong>Pasport nusxasi</strong>
                  <span>Shaxsni tasdiqlovchi identifikatsiya hujjati (ID-karta yoki pasport)</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">02</span>
                <div>
                  <strong>Obyektiv ma’lumotnoma (anketa)</strong>
                  <span>Talabgorning tasdiqlangan obyektivkasi (so‘nggi yangilangan ma’lumotlar)</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">03</span>
                <div>
                  <strong>Diplom (bakalavr, magistr) nusxasi</strong>
                  <span>Oliy ma’lumot haqidagi barcha diplomlar va ilovalari nusxalari</span>
                </div>
              </div>
              <div className="annex-doc-card special-doc">
                <span className="doc-num">04</span>
                <div>
                  <strong>Dissertatsiya va dissertatsiya avtoreferati (3 ta tilda)</strong>
                  <span>O‘zbek, rus, ingliz tillarida. Yuridik fanlar bo‘yicha qonun loyihasi, alohida metodika va tegishli ixtisoslik bo‘yicha uslubiy-metodika ishlab chiqilishi lozim.</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">05</span>
                <div>
                  <strong>Ilmiy rahbar (maslahatchi)ning xulosasi</strong>
                  <span>Dissertatsiya ishini ko‘rib chiqish natijalari bo‘yicha ijobiy xulosa</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">06</span>
                <div>
                  <strong>Ilmiy ishlari ro‘yxati va asosiy nusxalari</strong>
                  <span>Talabgor va ilmiy rahbar tomonidan tasdiqlangan 3,4-shakl hamda nusxalari (yoki havolalari)</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">07</span>
                <div>
                  <strong>Malakaviy imtihon guvohnomalari nusxalari</strong>
                  <span>Ixtisoslik va chet tili bo‘yicha topshirilgan malakaviy imtihonlar</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">08</span>
                <div>
                  <strong>Amaliyotga joriy etilganligi to‘g‘risida hujjat</strong>
                  <span>Kamida 2 ta joriy etish dalolatnomasi yoki ma’lumotnomasi</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">09</span>
                <div>
                  <strong>Antiplagiat tekshiruvi xulosasi</strong>
                  <span>Asillik darajasi tekshiruvi (xdfu va yopiq mavzular bundan mustasno)</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">10</span>
                <div>
                  <strong>Dissertatsiya mavzusiga doir monografiya</strong>
                  <span>Universitet Kengashi muhokamasidan o‘tkazilgan va nashr etilgan</span>
                </div>
              </div>
              <div className="annex-doc-card">
                <span className="doc-num">11</span>
                <div>
                  <strong>Ijtimoiy so‘rovnomalar natijalari</strong>
                  <span>Tadqiqot doirasida olib borilgan empirik sotsiologik so‘rovnomalar</span>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
