// Uzbek tilida sana formatlash funksiyalari

const monthNames = {
  uz: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ],
  uzLatn: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]
};

const dayNames = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  uzLatn: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
};

/**
 * Turli xil sana formatlarini parse qiladi
 * @param {string|Date} dateString - Parse qilinadigan sana
 * @returns {Date|null} Parse qilingan Date object yoki null
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Agar Date object bo'lsa, to'g'ridan-to'g'ri qaytar
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString;
  }
  
  // String bo'lsa, turli formatlarni sinab ko'rish
  const str = String(dateString).trim();
  
  // 1. Standart Date parse qilish
  const standardDate = new Date(str);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }
  
  // 2. "M12 29" yoki "M12 29 2024" formatini parse qilish
  // M12 29 -> Month 12, Day 29
  // M12 29 2024 -> Month 12, Day 29, Year 2024
  // M1 5 -> Month 1, Day 5
  const mFormatMatch = str.match(/^M(\d{1,2})\s+(\d{1,2})(?:\s+(\d{2,4}))?$/i);
  if (mFormatMatch) {
    const month = parseInt(mFormatMatch[1], 10);
    const day = parseInt(mFormatMatch[2], 10);
    let year = mFormatMatch[3] ? parseInt(mFormatMatch[3], 10) : new Date().getFullYear();
    
    // 2 xonali yilni to'liq yilga o'tkazish
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        // Sanani tekshirish (masalan, 31 Fevral bo'lmasligi kerak)
        if (parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day) {
          return parsedDate;
        }
      }
    }
  }
  
  // 3. "12/29" yoki "12/29/2024" formatini parse qilish
  const slashFormatMatch = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slashFormatMatch) {
    let month = parseInt(slashFormatMatch[1], 10);
    let day = parseInt(slashFormatMatch[2], 10);
    let year = slashFormatMatch[3] ? parseInt(slashFormatMatch[3], 10) : new Date().getFullYear();
    
    // 2 xonali yilni to'liq yilga o'tkazish
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }
  
  // 4. "29.12" yoki "29.12.2024" formatini parse qilish
  const dotFormatMatch = str.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/);
  if (dotFormatMatch) {
    let day = parseInt(dotFormatMatch[1], 10);
    let month = parseInt(dotFormatMatch[2], 10);
    let year = dotFormatMatch[3] ? parseInt(dotFormatMatch[3], 10) : new Date().getFullYear();
    
    // 2 xonali yilni to'liq yilga o'tkazish
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }
  
  // 5. "2024-12-29" yoki "2024-12-29T10:30:00" ISO formatini parse qilish
  const isoFormatMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T(.+))?$/);
  if (isoFormatMatch) {
    const year = parseInt(isoFormatMatch[1], 10);
    const month = parseInt(isoFormatMatch[2], 10);
    const day = parseInt(isoFormatMatch[3], 10);
    const timePart = isoFormatMatch[4];
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      if (timePart) {
        const parsedDate = new Date(str);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } else {
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
  }
  
  // 6. Faqat raqamlar bo'lsa (timestamp yoki boshqa format)
  const numbersOnly = str.match(/^\d+$/);
  if (numbersOnly) {
    const num = parseInt(str, 10);
    // Agar 10 xonali yoki undan kichik bo'lsa, sekundlar deb hisoblaymiz
    if (str.length <= 10) {
      const parsedDate = new Date(num * 1000);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } else {
      // Aks holda millisekundlar deb hisoblaymiz
      const parsedDate = new Date(num);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }
  
  return null;
};

/**
 * Sana string yoki Date objectni to'g'ri format qiladi
 * @param {string|Date} dateString - Format qilinadigan sana
 * @param {object} options - Formatlash opsiyalari
 * @returns {string} Formatlangan sana
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  
  try {
    // Parse qilish funksiyasidan foydalanish
    const date = parseDate(dateString);
    
    // Agar sana noto'g'ri bo'lsa
    if (!date || isNaN(date.getTime())) {
      return '-';
    }

    const {
      includeTime = false,
      includeDay = false,
      shortMonth = false,
      format = 'full'
    } = options;

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    let formattedDate = '';

    switch (format) {
      case 'full':
        // To'liq format: "15 Yanvar 2024"
        formattedDate = `${day} ${monthNames.uz[month]} ${year}`;
        break;
      
      case 'short':
        // Qisqa format: "15.01.2024"
        formattedDate = `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
        break;
      
      case 'long':
        // Uzun format: "15 Yanvar 2024 yil"
        formattedDate = `${day} ${monthNames.uz[month]} ${year} yil`;
        break;
      
      case 'month-year':
        // Oy va yil: "Yanvar 2024"
        formattedDate = `${monthNames.uz[month]} ${year}`;
        break;
      
      case 'year':
        // Faqat yil: "2024"
        formattedDate = `${year}`;
        break;
      
      case 'month':
        // Faqat oy: "Yanvar"
        formattedDate = monthNames.uz[month];
        break;
      
      default:
        formattedDate = `${day} ${monthNames.uz[month]} ${year}`;
    }

    // Hafta kuni qo'shish
    if (includeDay) {
      formattedDate = `${dayNames.uz[dayOfWeek]}, ${formattedDate}`;
    }

    // Vaqt qo'shish
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      formattedDate += ` ${hours}:${minutes}`;
    }

    return formattedDate;
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * Sana va vaqtni format qiladi
 * @param {string|Date} dateString - Format qilinadigan sana
 * @returns {string} Formatlangan sana va vaqt
 */
export const formatDateTime = (dateString) => {
  return formatDate(dateString, { includeTime: true });
};

/**
 * Sana oraliqini format qiladi
 * @param {string|Date} startDate - Boshlanish sanasi
 * @param {string|Date} endDate - Tugash sanasi
 * @returns {string} Formatlangan oraliq
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '-';
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  return `${start} - ${end}`;
};

/**
 * Oy nomini olish
 * @param {number} monthIndex - Oy indeksi (0-11)
 * @returns {string} Oy nomi
 */
export const getMonthName = (monthIndex) => {
  if (monthIndex < 0 || monthIndex > 11) return '-';
  return monthNames.uz[monthIndex];
};

/**
 * Hafta kuni nomini olish
 * @param {number} dayIndex - Hafta kuni indeksi (0-6)
 * @returns {string} Hafta kuni nomi
 */
export const getDayName = (dayIndex) => {
  if (dayIndex < 0 || dayIndex > 6) return '-';
  return dayNames.uz[dayIndex];
};

/**
 * Sana va vaqtni to'liq format qiladi (jadval uchun)
 * @param {string|Date} dateString - Format qilinadigan sana
 * @returns {string} Formatlangan sana va vaqt
 */
export const formatTableDate = (dateString) => {
  return formatDate(dateString, { 
    includeTime: true,
    format: 'short'
  });
};

/**
 * Yil va oyni format qiladi
 * @param {number} year - Yil
 * @param {number} month - Oy (1-12)
 * @returns {string} Formatlangan oy va yil
 */
export const formatYearMonth = (year, month) => {
  if (!year || !month) return '-';
  if (month < 1 || month > 12) return '-';
  return `${monthNames.uz[month - 1]} ${year}`;
};


