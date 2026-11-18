import { CrystalTheme } from '../types/health';

export const WHATSAPP_NUM = '923015500379';

export const EMBEDDED_BABY_KAABA_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><radialGradient id="sky" cx="50%" cy="30%" r="75%"><stop offset="0%" stop-color="#3f2e18"/><stop offset="55%" stop-color="#1e1b2e"/><stop offset="100%" stop-color="#050814"/></radialGradient><linearGradient id="robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/></linearGradient><linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbd3b6"/><stop offset="100%" stop-color="#e7a882"/></linearGradient></defs><rect width="800" height="800" fill="url(#sky)"/><rect x="520" y="130" width="210" height="220" rx="6" fill="#0b0b0f" stroke="#ca8a04" stroke-width="3"/><rect x="520" y="175" width="210" height="22" fill="#eab308" opacity="0.88"/><path d="M200 790 C210 540,270 470,400 470 C530 470,590 540,600 790 Z" fill="url(#robe)"/><path d="M350 475 L400 620 L450 475 Z" fill="#f8fafc"/><polygon points="365,485 400,502 365,519" fill="#dc2626"/><polygon points="435,485 400,502 435,519" fill="#dc2626"/><ellipse cx="400" cy="340" rx="125" ry="125" fill="url(#skin)"/><path d="M268 300 C268 175,532 175,532 300 C470 265,330 265,268 300 Z" fill="#f5f5f4" stroke="#dc2626" stroke-width="10"/><polygon points="355,215 398,238 355,260" fill="#dc2626"/><polygon points="442,215 398,238 442,260" fill="#dc2626"/><ellipse cx="352" cy="338" rx="13" ry="15" fill="#1e1b18"/><ellipse cx="448" cy="338" rx="13" ry="15" fill="#1e1b18"/><ellipse cx="400" cy="395" rx="14" ry="11" fill="#be123c" opacity="0.75"/><ellipse cx="318" cy="555" rx="44" ry="62" transform="rotate(-14 318 555)" fill="url(#skin)"/><ellipse cx="482" cy="555" rx="44" ry="62" transform="rotate(14 482 555)" fill="url(#skin)"/><text x="400" y="755" font-size="28" font-family="Arial" font-weight="bold" fill="#fde68a" text-anchor="middle">Noor Haram 2026 Health AI</text></svg>'
  );

const rawThemes: Array<[string, string, string, string, string, string]> = [
  ['💎', 'Emerald Crystal', '#065f46', '#0f172a', '#10b981', '#06b6d4'],
  ['❄️', 'Windows 11 Ice', '#0369a1', '#0c4a6e', '#38bdf8', '#818cf8'],
  ['🪟', 'Aero Blue', '#1e3a8a', '#0284c7', '#60a5fa', '#22d3ee'],
  ['✨', 'Kaaba Gold', '#422006', '#18181b', '#f59e0b', '#fde047'],
  ['🌌', 'Aurora', '#042f2e', '#1e1b4b', '#2dd4bf', '#a855f7'],
  ['🌸', 'Sakura Quartz', '#831843', '#1e1b4b', '#f472b6', '#c084fc'],
  ['🔮', 'Amethyst', '#4c1d95', '#09090b', '#c084fc', '#ec4899'],
  ['🌊', 'Sapphire', '#0e7490', '#0f172a', '#22d3ee', '#3b82f6'],
  ['🌹', 'Ruby Frosted', '#881337', '#18181b', '#fb7185', '#fb923c'],
  ['☀️', 'Amber Sun', '#92400e', '#0f172a', '#fbbf24', '#f59e0b'],
  ['🌿', 'Jade Mica', '#065f46', '#020617', '#4ade80', '#14b8a6'],
  ['🪩', 'Silver Frosted', '#334155', '#0f172a', '#e2e8f0', '#38bdf8'],
  ['🧊', 'Glacier', '#155e75', '#083344', '#67e8f9', '#a5f3fc'],
  ['🌠', 'Nebula', '#1e1b4b', '#581c87', '#818cf8', '#d946ef'],
  ['🦋', 'Morpho Teal', '#0f766e', '#1d4ed8', '#2dd4bf', '#3b82f6'],
  ['🪷', 'Lotus Glass', '#701a75', '#0f172a', '#e879f9', '#6366f1'],
  ['🏔️', 'Alpine Mist', '#1e293b', '#0f766e', '#5eead4', '#38bdf8'],
  ['🔥', 'Ember Crystal', '#7c2d12', '#09090b', '#fb923c', '#ef4444'],
  ['🌙', 'Madina Night', '#022c22', '#064e3b', '#34d399', '#fde047'],
  ['🦚', 'Peacock Aero', '#0e7490', '#1e3a8a', '#38bdf8', '#818cf8'],
  ['🍇', 'Berry Quartz', '#4c1d95', '#831843', '#f43f5e', '#8b5cf6'],
  ['🍋', 'Citrus Mint', '#365314', '#09090b', '#a3e635', '#10b981'],
  ['🫧', 'Bubble Glass', '#0369a1', '#6d28d9', '#a78bfa', '#38bdf8'],
  ['🐚', 'Pearl Shimmer', '#334155', '#1e293b', '#f8fafc', '#7dd3fc'],
  ['🌋', 'Garnet Glow', '#7f1d1d', '#3b0764', '#f87171', '#a855f7'],
  ['🧿', 'Cobalt Nazar', '#1d4ed8', '#1e1b4b', '#60a5fa', '#06b6d4'],
  ['🥝', 'Kiwi Fresh', '#15803d', '#020617', '#4ade80', '#a3e635'],
  ['🍑', 'Coral Sunset', '#9a3412', '#831843', '#fdba74', '#f472b6'],
  ['🪐', 'Saturn Rings', '#3f3f46', '#18181b', '#facc15', '#94a3b8'],
  ['💠', 'Prism Cyan', '#164e63', '#020617', '#22d3ee', '#10b981'],
  ['🌻', 'Saffron Glass', '#713f12', '#09090b', '#fde047', '#f97316'],
  ['🪻', 'Lavender Mist', '#4c1d95', '#312e81', '#a78bfa', '#38bdf8'],
  ['🌴', 'Oasis Teal', '#115e59', '#020617', '#5eead4', '#34d399'],
  ['⚡', 'Electric Indigo', '#312e81', '#1d4ed8', '#818cf8', '#22d3ee'],
  ['🍷', 'Velvet Wine', '#500724', '#3b0764', '#f472b6', '#9333ea'],
  ['🪨', 'Obsidian Mica', '#27272a', '#09090b', '#d4d4d8', '#38bdf8'],
  ['🌈', 'Holo Spectrum', '#6d28d9', '#be185d', '#38bdf8', '#22d3ee'],
  ['🌲', 'Nordic Pine', '#14532d', '#09090b', '#34d399', '#84cc16'],
  ['🦢', 'Swan Frosted', '#1e293b', '#0369a1', '#bae6fd', '#e2e8f0'],
  ['🍓', 'Strawberry Ice', '#881337', '#1e1b4b', '#fb7185', '#f472b6'],
  ['🪙', 'Bronze Luxury', '#78350f', '#18181b', '#d97706', '#fb923c'],
  ['🐬', 'Dolphin Lagoon', '#0284c7', '#0d9488', '#38bdf8', '#14b8a6'],
  ['🌺', 'Hibiscus Glow', '#86198f', '#be123c', '#e879f9', '#f43f5e'],
  ['🛸', 'Neon Cyber', '#0f766e', '#4c1d95', '#2dd4bf', '#a855f7'],
  ['🌵', 'Desert Emerald', '#365314', '#065f46', '#bef264', '#10b981'],
  ['🕊️', 'Peace Crystal', '#155e75', '#1e293b', '#7dd3fc', '#cbd5e1'],
  ['🐉', 'Imperial Jade', '#064e3b', '#713f12', '#10b981', '#eab308'],
  ['☔', 'Monsoon Glass', '#1e3a8a', '#334155', '#60a5fa', '#64748b'],
  ['🎆', 'Festive Prism', '#4c1d95', '#047857', '#34d399', '#a855f7'],
  ['🌟', 'Noor Starlight', '#1e1b4b', '#064e3b', '#fde047', '#10b981'],
];

export const themes50: CrystalTheme[] = rawThemes.map((t) => ({
  icon: t[0],
  name: t[1],
  c1: t[2],
  c2: t[3],
  bg: `linear-gradient(135deg,${t[2]},${t[3]},#020617)`,
  card: `${t[2]}88`,
  border: `${t[4]}66`,
  accent: t[4],
  orb1: t[4],
  orb2: t[5],
}));

export function makeThemeIconSvg(t: CrystalTheme): string {
  const safeName = String(t.name || 'Crystal')
    .replace(/[<>&"']/g, '')
    .slice(0, 16);
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${t.c1}"/><stop offset="55%" stop-color="${t.c2}"/><stop offset="100%" stop-color="#020617"/></linearGradient><linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.38"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.04"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0.22"/></linearGradient></defs><rect width="256" height="256" rx="54" fill="url(#bg)"/><rect x="10" y="10" width="236" height="236" rx="46" fill="url(#shine)" stroke="${t.accent}" stroke-width="6"/><polygon points="128,22 230,128 128,234 26,128" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="3"/><text x="128" y="144" font-size="108" text-anchor="middle">${t.icon}</text><rect x="34" y="196" width="188" height="32" rx="14" fill="#020617" fill-opacity="0.72" stroke="${t.accent}" stroke-width="2"/><text x="128" y="217" font-size="15" font-family="Arial,sans-serif" font-weight="bold" fill="#f8fafc" text-anchor="middle">${safeName}</text></svg>`
    )
  );
}

export const langList: Array<[string, string, string]> = [
  ['ur', '🇵🇰 Roman Urdu / اردو', 'en-IN'],
  ['ur_script', '🇵🇰 اردو (Script)', 'ur-PK'],
  ['en', '🇺🇸 English', 'en-US'],
  ['ar', '🇸🇦 العربية', 'ar-SA'],
  ['hi', '🇮🇳 हिन्दी', 'hi-IN'],
  ['pa', '🇵🇰 ਪੰਜਾਬੀ', 'pa-IN'],
  ['ps', '🇦🇫 پښتو', 'ps-AF'],
  ['sd', '🇵🇰 سنڌي', 'ur-PK'],
  ['bn', '🇧🇩 বাংলা', 'bn-BD'],
  ['fa', '🇮🇷 فارسی', 'fa-IR'],
  ['tr', '🇹🇷 Türkçe', 'tr-TR'],
  ['es', '🇪🇸 Español', 'es-ES'],
  ['fr', '🇫🇷 Français', 'fr-FR'],
  ['de', '🇩🇪 Deutsch', 'de-DE'],
  ['it', '🇮🇹 Italiano', 'it-IT'],
  ['pt', '🇧🇷 Português', 'pt-BR'],
  ['ru', '🇷🇺 Русский', 'ru-RU'],
  ['zh', '🇨🇳 中文', 'zh-CN'],
  ['ja', '🇯🇵 日本語', 'ja-JP'],
  ['ko', '🇰🇷 한국어', 'ko-KR'],
  ['id', '🇮🇩 Indonesia', 'id-ID'],
  ['ms', '🇲🇾 Melayu', 'ms-MY'],
  ['th', '🇹🇭 ไทย', 'th-TH'],
  ['vi', '🇻🇳 Tiếng Việt', 'vi-VN'],
  ['sw', '🇰🇪 Kiswahili', 'sw-KE'],
  ['tl', '🇵🇭 Tagalog', 'tl-PH'],
  ['ta', '🇮🇳 தமிழ்', 'ta-IN'],
  ['te', '🇮🇳 తెలుగు', 'te-IN'],
  ['mr', '🇮🇳 मराठी', 'mr-IN'],
  ['gu', '🇮🇳 ગુજરાતી', 'gu-IN'],
  ['ne', '🇳🇵 नेपाली', 'ne-NP'],
  ['si', '🇱🇰 සිංහල', 'si-LK'],
  ['my', '🇲🇲 မြန်မာ', 'my-MM'],
  ['km', '🇰🇭 ខ្មែរ', 'km-KH'],
  ['nl', '🇳🇱 Nederlands', 'nl-NL'],
  ['pl', '🇵🇱 Polski', 'pl-PL'],
  ['uk', '🇺🇦 Українська', 'uk-UA'],
  ['el', '🇬🇷 Ελληνικά', 'el-GR'],
  ['ro', '🇷🇴 Română', 'ro-RO'],
  ['cs', '🇨🇿 Čeština', 'cs-CZ'],
  ['hu', '🇭🇺 Magyar', 'hu-HU'],
  ['sv', '🇸🇪 Svenska', 'sv-SE'],
  ['no', '🇳🇴 Norsk', 'nb-NO'],
  ['fi', '🇫🇮 Suomi', 'fi-FI'],
  ['da', '🇩🇰 Dansk', 'da-DK'],
  ['he', '🇮🇱 עברית', 'he-IL'],
  ['uz', '🇺🇿 Oʻzbek', 'uz-UZ'],
  ['kk', '🇰🇿 Қазақ', 'kk-KZ'],
  ['az', '🇦🇿 Azərbaycan', 'az-AZ'],
  ['ku', '🇹🇷 Kurdî', 'ku-TR'],
  ['so', '🇸🇴 Soomaali', 'so-SO'],
  ['am', '🇪🇹 አማርኛ', 'am-ET'],
  ['ha', '🇳🇬 Hausa', 'ha-NG'],
  ['yo', '🇳🇬 Yorùbá', 'yo-NG'],
  ['af', '🇿🇦 Afrikaans', 'af-ZA'],
];

export const langSpeechMap: Record<string, string> = {};
langList.forEach(([code, , speech]) => {
  langSpeechMap[code] = speech;
});

export const rtlLangs = ['ur_script', 'ar', 'ps', 'sd', 'fa', 'he', 'ku'];

export interface I18nStrings {
  warningTitle: string;
  warningText: string;
  emergTitle: string;
  anatomyTitle: string;
  anatomySub: string;
  medTitle: string;
  medBadge: string;
  medSub: string;
  noteTitle: string;
  saveBtn: string;
  listenBtn: string;
  problemLabel: string;
  solutionLabel: string;
  opLabel: string;
  onlineLabel: string;
  aiTitle: string;
  aiSub: string;
  medNameLbl: string;
  medDoseLbl: string;
  medUseLbl: string;
  medWarnLbl: string;
}

export const i18n: Record<string, I18nStrings> = {
  ur: {
    warningTitle: 'Jaan ki Hifazat Pehle (2026 Safety):',
    warningText:
      'Yeh app educational maloomat aur personal health record ke liye hai. Phone camera real X-Ray, Ultrasound, Blood Test, BP ya Baby Boy/Girl gender detect nahi kar sakta — asli scan aur exact medicine dose hamesha licensed doctor se verify karein.',
    emergTitle: 'Emergency Helplines',
    anatomyTitle: 'Complete 40 External & Internal Body Parts',
    anatomySub: 'Kisi bhi external ya internal part par click karein — medicine, dose, tasveer aur voice sunein:',
    medTitle: '66 World Medicines (Tap Card = Voice)',
    medBadge: '66 Medicines',
    medSub:
      'Kisi bhi medicine card par CLICK karein — foran dawai ka naam aur kitni leni hai Girl ya Man voice mein sunayega:',
    noteTitle: 'Health Reminder Note',
    saveBtn: 'Save Note',
    listenBtn: 'Bol kar Sunein',
    problemLabel: 'Bemariyan:',
    solutionLabel: 'Ilaj, Medicine & Dose:',
    opLabel: 'Operation & Post-Op Meds:',
    onlineLabel: 'Online',
    aiTitle: 'High-Power AI Doctor 2026',
    aiSub: 'Sawal likhein, Mic se bolein, ya Report/Dawai ki photo scan karein — AI bol kar jawab dega!',
    medNameLbl: 'Dawai ka naam:',
    medDoseLbl: 'Kitni leni hai:',
    medUseLbl: 'Fayda:',
    medWarnLbl: 'Ehtiyat:',
  },
  ur_script: {
    warningTitle: 'جان کی حفاظت پہلے (2026):',
    warningText: 'یہ ایپ صرف تعلیمی معلومات کے لیے ہے۔ فون کیمرہ اصلی ایکسرے، الٹراساؤنڈ یا بلڈ ٹیسٹ نہیں کر سکتا۔',
    emergTitle: 'ایمرجنسی ہیلپ لائنز',
    anatomyTitle: 'جسم کے 40 بیرونی و اندرونی حصے اور آپریشن',
    anatomySub: 'کسی بھی حصے پر کلک کریں اور دوا کی مقدار سنیں:',
    medTitle: '66 عالمی ادویات (کلک کریں — نام اور مقدار سنیں)',
    medBadge: '66 ادویات',
    medSub: 'کسی بھی دوا پر کلک کریں — فوراً نام اور مقدار آواز میں سنائے گا:',
    noteTitle: 'صحت کا نوٹ',
    saveBtn: 'محفوظ کریں',
    listenBtn: 'آواز میں سنیں',
    problemLabel: 'بیماریاں:',
    solutionLabel: 'دوا اور مقدار:',
    opLabel: 'آپریشن اور دوائیں:',
    onlineLabel: 'آن لائن',
    aiTitle: 'ہائی پاور اے آئی ڈاکٹر 2026',
    aiSub: 'کوئی بھی سوال لکھیں یا بولیں:',
    medNameLbl: 'دوا کا نام:',
    medDoseLbl: 'کتنی لینی ہے:',
    medUseLbl: 'فائدہ:',
    medWarnLbl: 'احتیاط:',
  },
  en: {
    warningTitle: 'Safety First (2026):',
    warningText:
      'Educational reference only. A smartphone camera cannot perform real X-ray, ultrasound, blood tests, BP, or baby gender checks. Always confirm dosage with a licensed doctor.',
    emergTitle: 'Emergency Helplines',
    anatomyTitle: 'Complete 40 External & Internal Body Parts',
    anatomySub: 'Click any body part to see pictures, medicines, dosage & voice:',
    medTitle: '66 World Medicines (Tap Card = Voice)',
    medBadge: '66 Medicines',
    medSub: 'Tap any medicine card or Speak button to hear medicine name and exact usage dose:',
    noteTitle: 'Health Reminder Note',
    saveBtn: 'Save Note',
    listenBtn: 'Speak Aloud',
    problemLabel: 'Diseases:',
    solutionLabel: 'Care & Dose:',
    opLabel: 'If Operation & Meds:',
    onlineLabel: 'Online',
    aiTitle: 'High-Power AI Doctor 2026',
    aiSub: 'Ask anything in chat, voice or photo — instant spoken medicine & dose guidance!',
    medNameLbl: 'Medicine name:',
    medDoseLbl: 'How much to take:',
    medUseLbl: 'Use:',
    medWarnLbl: 'Caution:',
  },
  ar: {
    warningTitle: 'السلامة أولاً (2026):',
    warningText: 'للمعلومات التعليمية فقط. كاميرا الهاتف لا تجري أشعة أو سوناراً حقيقياً.',
    emergTitle: 'خطوط الطوارئ',
    anatomyTitle: '40 جزءاً خارجياً وداخلياً والعمليات',
    anatomySub: 'انقر على أي جزء لعرض الأدوية:',
    medTitle: 'دليل 66 دواءً عالمياً',
    medBadge: '66 دواء',
    medSub: 'اضغط على أي دواء لسماع الاسم والجرعة:',
    noteTitle: 'ملاحظة صحية',
    saveBtn: 'حفظ',
    listenBtn: 'استمع',
    problemLabel: 'الأمراض:',
    solutionLabel: 'الدواء والجرعة:',
    opLabel: 'الجراحة:',
    onlineLabel: 'أونلاين',
    aiTitle: 'الذكاء الاصطناعي الطبي 2026',
    aiSub: 'اكتب أو تحدث:',
    medNameLbl: 'اسم الدواء:',
    medDoseLbl: 'الجرعة:',
    medUseLbl: 'الاستخدام:',
    medWarnLbl: 'تحذير:',
  },
  hi: {
    warningTitle: 'सुरक्षा पहले (2026):',
    warningText: 'यह ऐप केवल शैक्षिक जानकारी के लिए है। फोन कैमरा असली एक्स-रे या अल्ट्रासाउंड नहीं कर सकता।',
    emergTitle: 'आपातकालीन हेल्पलाइन',
    anatomyTitle: '40 बाहरी व भीतरी अंग व ऑपरेशन',
    anatomySub: 'दवा और खुराक के लिए किसी भी अंग पर क्लिक करें:',
    medTitle: '66 विश्व दवाइयाँ (क्लिक करें — नाम व खुराक सुनें)',
    medBadge: '66 दवाइयाँ',
    medSub: 'किसी भी दवा कार्ड पर क्लिक करें — नाम और खुराक सुनें:',
    noteTitle: 'स्वास्थ्य नोट',
    saveBtn: 'सेव करें',
    listenBtn: 'सुनें',
    problemLabel: 'बीमारियाँ:',
    solutionLabel: 'दवा व खुराक:',
    opLabel: 'ऑपरेशन:',
    onlineLabel: 'ऑनलाइन',
    aiTitle: 'हाई-पावर मेडिकल AI डॉक्टर 2026',
    aiSub: 'सवाल लिखें या बोलें:',
    medNameLbl: 'दवा का नाम:',
    medDoseLbl: 'कितनी लेनी है:',
    medUseLbl: 'उपयोग:',
    medWarnLbl: 'सावधानी:',
  },
};
