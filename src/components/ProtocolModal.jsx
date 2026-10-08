import { Printer, X } from 'lucide-react'

export default function ProtocolModal({ expertiseCase, onClose }) {
  if (!expertiseCase) return null

  const printProtocol = () => {
    window.print()
  }

  const isLawField = /huquq|12\.00/i.test(expertiseCase.field)

  return (
    <div className="modal-backdrop protocol-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="protocol-paper" role="dialog" aria-modal="true">
        <div className="protocol-actions-bar no-print">
          <span className="protocol-badge">Rasmiy Nizom 14-bandi talabi bo‘yicha bayonnoma</span>
          <div className="protocol-buttons">
            <button className="secondary-button" onClick={printProtocol}>
              <Printer size={15} /> Chop etish / PDF saqlash
            </button>
            <button className="icon-button" onClick={onClose} aria-label="Yopish">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Official Letterhead */}
        <div className="protocol-printable">
          <div className="protocol-header">
            <h4>O‘ZBEKISTON RESPUBLIKASI UNIVERSITETI</h4>
            <p>“TASDIQLAYMAN”<br />
            Universitet boshlig‘ining Ilmiy ishlar va innovatsiyalar bo‘yicha o‘rinbosari<br />
            _______________________ prof. S.A. Karimov<br />
            «____» ________________ 2026-yil</p>
          </div>

          <h3 className="protocol-title">
            KAFEDRALARARO MAJLISI BAYONNOMASI № _____<br />
            <small>(Dissertatsiya ishini dastlabki ekspertizadan o‘tkazish bo‘yicha)</small>
          </h3>

          <div className="protocol-meta-grid">
            <div><strong>Sana:</strong> {expertiseCase.meetingDate || '«____» ________ 2026-yil'}</div>
            <div><strong>O‘tkazilgan joy:</strong> {expertiseCase.assignedDepartment} majlislar zali</div>
            <div><strong>Majlis raisi:</strong> {expertiseCase.presidingPerson}</div>
            <div><strong>Majlis kotibi:</strong> dots. M.I. Xalilova</div>
            <div><strong>Talabgor:</strong> {expertiseCase.researcherName}</div>
            <div><strong>Ilmiy daraja talabgori:</strong> {expertiseCase.degree === 'PhD' ? 'Falsafa doktori (PhD)' : 'Fan doktori (DSc)'}</div>
            <div><strong>Ixtisoslik shifri va nomi:</strong> {expertiseCase.field}</div>
            <div><strong>Ilmiy rahbar:</strong> {expertiseCase.supervisor}</div>
          </div>

          <div className="protocol-body">
            <h4>KUN TARTIBI:</h4>
            <p>
              Talabgor <b>{expertiseCase.researcherName}</b>ning <i>«{expertiseCase.topic}»</i> mavzusidagi {expertiseCase.degree === 'PhD' ? 'falsafa doktori (PhD)' : 'fan doktori (DSc)'} ilmiy darajasini olish uchun yozilgan dissertatsiya ishining dastlabki ekspertizasi muhokamasi.
            </p>

            <h4>ESHITILDI:</h4>
            <ol>
              <li>Kafedralararo majlisiga raislik qiluvchi <b>{expertiseCase.presidingPerson}</b>ning kirish so‘zi (Reglament 16-bandi).</li>
              <li>Majlis kotibining talabgor haqida qisqacha ma’lumotnomasi va 1-ilovadagi 11 ta hujjat to‘liq taqdim etilganligi (Reglament 17-bandi).</li>
              <li>Talabgor <b>{expertiseCase.researcherName}</b>ning dissertatsiyaning asosiy ilmiy natijalari va ilmiy yangiligi to‘g‘risidagi ma’ruzasi.</li>
              {isLawField && <li>Talabgor tomonidan ishlab chiqilgan tegishli qonun loyihasi va metodik qo‘llanmalar taqdimoti.</li>}
              <li>
                Taqrizchilar xulosalari (Reglament 18-19-bandlari):
                <ul>
                  {expertiseCase.reviewers.map((rev, idx) => (
                    <li key={idx}>
                      {rev.isAnonymous ? 'Anonim taqrizchi' : rev.name} ({rev.organization}) — ijobiy baholagan.
                    </li>
                  ))}
                </ul>
              </li>
              <li>Antiplagiat tekshiruvi natijasi: dissertatsiyaning o‘zlashtirishsiz (originallik) ko‘rsatkichi: <b>{expertiseCase.antiplagiarismScore}%</b>.</li>
            </ol>

            <h4>OCHIQ OVOZ BERISH NATIJALARI (Reglament 22-23-bandlari):</h4>
            <p>
              Kafedralararo majlis a’zolari jami: 18 nafar. <br />
              Ishtirok etdi: 18 nafar. <br />
              «Yoqlab» — 18 nafar, «Qarshi» — 0 nafar, «Betaraf» — 0 nafar.
            </p>

            <h4>KAFEDRALARARO MAJLISI QAROR QILADI:</h4>
            <div className="protocol-resolution-box">
              <p>
                1. Talabgor <b>{expertiseCase.researcherName}</b>ning «{expertiseCase.topic}» mavzusidagi dissertatsiya ishi OAK Rayosatining 20.03.2015 yildagi 214/8-son qarori talablariga to‘liq javob beradi deb hisoblansin.
              </p>
              <p>
                2. <b>{expertiseCase.resolution === 'needs_revision' ? 'Dissertatsiya qayta ishlash uchun tavsiya etilsin.' : 'Dissertatsiya keyingi bosqichga (Ilmiy seminarga) tavsiya etilsin.'}</b>
              </p>
              <p>
                3. Mazkur bayonnoma va ekspertiza xulosasi 3 kun muddatda Universitet boshlig‘iga tasdiqlash uchun kiritilsin.
              </p>
            </div>

            <div className="protocol-signatures">
              <div>
                <span>Majlis raisi:</span>
                <strong>{expertiseCase.presidingPerson}</strong>
              </div>
              <div>
                <span>Majlis kotibi:</span>
                <strong>dots. M.I. Xalilova</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
