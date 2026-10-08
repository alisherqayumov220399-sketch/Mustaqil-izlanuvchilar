// Himoyadan keyingi hujjatlar (OAK / Attestatsiya talablari bo'yicha)
export const POST_DEFENSE_DOCUMENTS = [
  {
    id: 'pd_1',
    code: '1',
    name: "Talabgorning obyektiv-ma'lumotnomasi",
    category: "Talabgorning obyektiv-ma'lumotnomasi",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 20,
    translations: {
      ru: {
        name: 'Объективка-справка соискателя',
        category: 'Объективка-справка соискателя'
      },
      en: {
        name: "Applicant's objective reference (CV/Resume)",
        category: "Applicant's objective reference"
      }
    }
  },
  {
    id: 'pd_2',
    code: '2',
    name: "Ilmiy kengash majlisining stenogrammasi",
    category: "Ilmiy kengash majlisining stenogrammasi",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 35,
    translations: {
      ru: {
        name: 'Стенограмма заседания научного совета',
        category: 'Стенограмма заседания научного совета'
      },
      en: {
        name: 'Verbatim record (stenogram) of the scientific council meeting',
        category: 'Verbatim record of the scientific council meeting'
      }
    }
  },
  {
    id: 'pd_3',
    code: '3',
    name: "Taqrizlar",
    category: "Rasmiy opponentlar va yetakchi tashkilotning taqrizlari",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 25,
    translations: {
      ru: {
        name: 'Отзывы',
        category: 'Отзывы официальных оппонентов и ведущей организации'
      },
      en: {
        name: 'Reviews',
        category: 'Reviews of official opponents and leading organization'
      }
    }
  },
  {
    id: 'pd_4',
    code: '4',
    name: "Himoya to'g'risidagi e'lon nusxalari",
    category: "Dissertatsiya himoyasi to'g'risidagi e'lon nusxalari",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 20,
    translations: {
      ru: {
        name: 'Копии объявлений о защите',
        category: 'Копии объявлений о защите диссертации'
      },
      en: {
        name: 'Copies of defense announcements',
        category: 'Copies of dissertation defense announcements'
      }
    }
  },
  {
    id: 'pd_5',
    code: '5',
    name: "Amaliyotga joriy qilinganlik to'g'risidagi hujjatlar",
    category: "Ilmiy natijalarning amaliyotga joriy qilinganligi hujjatlari",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 30,
    translations: {
      ru: {
        name: 'Документы о внедрении в практику',
        category: 'Документы о внедрении научных результатов в практику'
      },
      en: {
        name: 'Implementation acts and documents',
        category: 'Documents confirming implementation of scientific results'
      }
    }
  },
  {
    id: 'pd_6',
    code: '6',
    name: "Talabgorning faoliyati va attestatsiya tadbirlarini tasdiqlovchi hujjat nusxalari",
    category: "Attestatsiya tadbirlari natijalarini tasdiqlovchi hujjatlar",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 25,
    translations: {
      ru: {
        name: 'Копии документов, подтверждающих деятельность соискателя и аттестационные мероприятия',
        category: 'Документы, подтверждающие результаты аттестационных мероприятий'
      },
      en: {
        name: "Copies of documents confirming applicant's activity and attestation events",
        category: "Documents confirming results of attestation events"
      }
    }
  },
  {
    id: 'pd_7',
    code: '7',
    name: "Asosiy ilmiy ishlar nusxalari",
    category: "Tasdiqlangan ilmiy ishlar ro'yxati, asosiy ilmiy ishlari nusxalari _uzl",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 50,
    translations: {
      ru: {
        name: 'Копии основных научных трудов',
        category: 'Утвержденный список научных трудов, копии основных трудов _uzl'
      },
      en: {
        name: 'Copies of main scientific publications',
        category: 'Approved publication list, copies of key scientific papers _uzl'
      }
    }
  },
  {
    id: 'pd_8',
    code: '8',
    name: "Fan doktori (DSc) ilmiy darajasi talabgori uchun fan nomzodi yoki falsafa doktori (PhD) yoxud unga tenglashtirilgan boshqa ilmiy daraja dissertatsiyasi avtoreferati",
    category: "Fan doktori (DSc) ilmiy darajasi talabgori uchun fan nomzodi yoki falsafa doktori (PhD) yoxud unga tenglashtirilgan boshqa ilmiy daraja dissertatsiyasi avtoreferati",
    required: false, // DSc uchun ixtiyoriy / shartli
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 30,
    translations: {
      ru: {
        name: 'Автореферат диссертации кандидата наук или PhD для соискателя ученой степени доктора наук (DSc)',
        category: 'Автореферат диссертации кандидата наук или PhD для соискателя ученой степени доктора наук (DSc)'
      },
      en: {
        name: 'PhD or Candidate of Sciences dissertation abstract for Doctor of Science (DSc) applicants',
        category: 'PhD or Candidate of Sciences dissertation abstract for DSc applicants'
      }
    }
  },
  {
    id: 'pd_9',
    code: '9',
    name: "Dissertatsiya nusxasi",
    category: "Dissertatsiya",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 60,
    translations: {
      ru: {
        name: 'Экземпляр диссертации',
        category: 'Диссертация'
      },
      en: {
        name: 'Copy of dissertation',
        category: 'Dissertation'
      }
    }
  },
  {
    id: 'pd_10',
    code: '10',
    name: "Avtoreferat nusxasi",
    category: "Avtoreferat",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 25,
    translations: {
      ru: {
        name: 'Экземпляр автореферата',
        category: 'Автореферат'
      },
      en: {
        name: "Copy of author's abstract",
        category: "Author's abstract"
      }
    }
  },
  {
    id: 'pd_11',
    code: '11',
    name: "Tasdiqlangan ilmiy ishlar ro'yxati",
    category: "Tasdiqlangan ilmiy ishlar ro'yxati, asosiy ilmiy ishlari nusxalari _uzl",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 20,
    translations: {
      ru: {
        name: 'Утвержденный список научных трудов',
        category: 'Утвержденный список научных трудов, копии основных трудов _uzl'
      },
      en: {
        name: 'Approved list of scientific publications',
        category: 'Approved list of publications, copies of key scientific papers _uzl'
      }
    }
  },
  {
    id: 'pd_12',
    code: '12',
    name: "Talabgor ismi, familiyasi va otasining ismi ma'lumotlarining (pasport bo'yicha) davlat tilidagi (lotincha) va ingliz tilidagi tasdiqlangan shakllari",
    category: "Talabgorning obyektiv-ma'lumotnomasi",
    required: true,
    accepts: '.pdf,.doc,.docx,.zip',
    maxSizeMb: 15,
    translations: {
      ru: {
        name: 'Утвержденные формы Ф.И.О. соискателя (по паспорту) на государственном языке (латиница) и английском языке',
        category: 'Объективка-справка соискателя'
      },
      en: {
        name: "Certified forms of applicant's full name (per passport) in state language (Latin) and English",
        category: "Applicant's objective reference"
      }
    }
  }
];

export const POST_DEFENSE_STATUSES = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Qabul qilindi',
  REJECTED: 'Rad etildi'
};
