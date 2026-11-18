import { CrystalTheme } from '../types/health';

export const WHATSAPP_NUM = '923015500379';

export const USER_KAABA_BABY_BG = '/assets/aistudio/IMG-20261102-WA0002_a2af0755.jpg';

export const EMBEDDED_BABY_KAABA_SVG = USER_KAABA_BABY_BG;

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
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <defs>
          <linearGradient id="gBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${t.c1}"/>
            <stop offset="52%" stop-color="${t.c2}"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <radialGradient id="gHalo" cx="50%" cy="40%" r="52%">
            <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.55"/>
            <stop offset="65%" stop-color="${t.orb2}" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="${t.accent}"/>
          </linearGradient>
          <linearGradient id="gPulse" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#67e8f9"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="${t.accent}"/>
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="60" fill="url(#gBg)"/>
        <circle cx="128" cy="118" r="96" fill="url(#gHalo)"/>
        <rect x="7" y="7" width="242" height="242" rx="54" fill="none" stroke="url(#gGold)" stroke-width="5.5"/>
        <path d="M20 64 Q128 24 236 64 L236 32 Q128 8 20 32 Z" fill="#ffffff" fill-opacity="0.14"/>
        <path d="M128 24 L208 56 V122 C208 175 173 213 128 230 C83 213 48 175 48 122 V56 Z" fill="#020617" fill-opacity="0.68" stroke="url(#gGold)" stroke-width="4.5"/>
        <rect x="115" y="48" width="26" height="68" rx="9" fill="url(#gGold)" fill-opacity="0.92"/>
        <rect x="94" y="69" width="68" height="26" rx="9" fill="url(#gGold)" fill-opacity="0.92"/>
        <circle cx="128" cy="82" r="10" fill="#020617"/>
        <path d="M134 73 A11 11 0 1 0 134 91 A8.5 8.5 0 1 1 134 73 Z" fill="#fef08a"/>
        <path d="M58 144 H92 L106 116 L124 170 L142 126 L156 144 H198" fill="none" stroke="url(#gPulse)" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="198" cy="144" r="5" fill="#fef08a"/>
        <rect x="46" y="186" width="164" height="32" rx="16" fill="#020617" fill-opacity="0.9" stroke="${t.accent}" stroke-width="2.5"/>
        <text x="128" y="207" font-size="13.5" font-family="Arial,sans-serif" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.4">NOOR HARAM +</text>
      </svg>`
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
  searchPlaceholder: string;
  voiceTestPhrase: string;
  launchVoice: string;
  launchTranslate: string;
  launchMeds: string;
  launchAi: string;
  launchParchi: string;
  launchEmergency: string;
  launchWorld: string;
  tabAll: string;
  tabEmergency: string;
  tabVision: string;
  tabAi: string;
  tabDocs: string;
  tabTools: string;
  tabAnatomy: string;
  parchiTitle: string;
  parchiSub: string;
  gdocsTitle: string;
  gdocsSub: string;
  emergencyBannerTitle: string;
  emergencyBannerSub: string;
  visionTitle: string;
  visionSub: string;
  translatorTitle: string;
  translatorSub: string;
  worldRadarTitle: string;
  worldRadarSub: string;
  patientModeLabel: string;
  speakSummaryBtn: string;
  hubTitle: string;
  hubSub: string;
  hubTabSearch: string;
  hubTabReport: string;
  hubTabNearby: string;
  hubTabQuick: string;
  hubSearchBtn: string;
  hubNearbyBtn: string;
  hubUploadBtn: string;
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
      'Kisi bhi medicine card par CLICK karein — foran dawai ka naam aur kitni leni hai aapki selected zuban mein sunayega:',
    noteTitle: 'Health Reminder Note',
    saveBtn: 'Save Note',
    listenBtn: 'Bol kar Sunein',
    problemLabel: 'Bemariyan:',
    solutionLabel: 'Ilaj, Medicine & Dose:',
    opLabel: 'Operation & Post-Op Meds:',
    onlineLabel: 'Online',
    aiTitle: 'High-Power AI Doctor 2026',
    aiSub: 'Sawal likhein, Mic se bolein, ya Report/Dawai ki photo scan karein — AI aapki zuban mein jawab dega!',
    medNameLbl: 'Dawai ka naam:',
    medDoseLbl: 'Kitni leni hai:',
    medUseLbl: 'Fayda:',
    medWarnLbl: 'Ehtiyat:',
    searchPlaceholder: '37,800+ features mein talash karein: Panadol, Arinac, Ramadan, Diet, Sugar, BP...',
    voiceTestPhrase: 'Assalam-o-Alaikum, Noor Haram 2026 aapki zuban mein bilkul theek bol raha hai.',
    launchVoice: 'Voice Test',
    launchTranslate: 'Translate Dawai',
    launchMeds: '66 Medicines',
    launchAi: 'AI Doctor Ask',
    launchParchi: 'Scan Parchi',
    launchEmergency: 'SOS 1122 & CPR',
    launchWorld: 'World 2026 Radar',
    tabAll: 'All Suite',
    tabEmergency: 'SOS & CPR',
    tabVision: 'Vision & Halal',
    tabAi: 'AI & Parchi',
    tabDocs: 'Google Docs',
    tabTools: 'Meds & Translate',
    tabAnatomy: 'Body, Vitals & QR',
    parchiTitle: 'Doctor Parchi & Lab Report Deep Scanner',
    parchiSub: 'Doctor ki parchi (OD, BD, TDS, HS) ya Lab report (Hb, PLT, Sugar, LFT, RFT) paste ya upload karein:',
    gdocsTitle: 'Google Docs Health Records Sync',
    gdocsSub: 'Mareez ka record, parchi scan aur summary seedha Google Docs mein save ya listen karein.',
    emergencyBannerTitle: 'AI Emergency Triage, 110 BPM CPR & First-Aid',
    emergencyBannerSub: 'Fori khatra check, bol kar First-Aid hidayat, Stroke FAST check aur WHO ORS hisab.',
    visionTitle: '3-in-1 AI Vision Lab (Halal / Meal / Strip)',
    visionSub: 'Khane ki plate, Halal ingredients ya dawai patti ki photo scan karein.',
    translatorTitle: 'Google Super Translation System (Her Zuban Mein Dawai)',
    translatorSub: 'Kisi bhi dawai ka naam ya doctor ki hidayat 55 mein se kisi bhi zuban mein translate aur listen karein.',
    worldRadarTitle: '2026 World Latest Medical System & Brand Finder',
    worldRadarSub: 'Puri duniya ki nayi 2026 medical tehqeeq, WHO/FDA updates aur international dawai ka salt check karein.',
    patientModeLabel: 'Mareez Aasan Display',
    speakSummaryBtn: 'Poora Khulasa Sunein',
    hubTitle: 'International Super Hospital Online Command Center',
    hubSub: 'Koi bhi Dawai ya Bemari online search karein, X-Ray / Ultrasound / Blood Pressure / Lab Report (100+ checks) scan karein, ya qareebi Hospital & Medical Store bol kar sunein.',
    hubTabSearch: 'Online Dawai / Marz',
    hubTabReport: 'X-Ray / Lab / BP Check',
    hubTabNearby: 'Nazdeeki Hospital & Lab',
    hubTabQuick: 'Aasan Quick Ilaj',
    hubSearchBtn: 'Online Check & Bolein',
    hubNearbyBtn: 'GPS Se Nazdeeki Dhundein',
    hubUploadBtn: 'Photo / Report Upload Karein',
  },
  ur_script: {
    warningTitle: 'جان کی حفاظت پہلے (2026 حفاظتی اصول):',
    warningText: 'یہ ایپ صرف تعلیمی معلومات اور ذاتی صحت کے ریکارڈ کے لیے ہے۔ اصل ایکسرے، الٹراساؤنڈ اور دوا کی مقدار ہمیشہ مستند ڈاکٹر سے تصدیق کروائیں۔',
    emergTitle: 'ایمرجنسی ہیلپ لائنز',
    anatomyTitle: 'جسم کے 40 بیرونی و اندرونی حصے اور آپریشن',
    anatomySub: 'کسی بھی حصے پر کلک کریں اور دوا کی مقدار سنیں:',
    medTitle: '66 عالمی ادویات (کلک کریں — نام اور مقدار سنیں)',
    medBadge: '66 ادویات',
    medSub: 'کسی بھی دوا پر کلک کریں — فوراً آپ کی منتخب زبان میں نام اور مقدار سنائے گا:',
    noteTitle: 'صحت کا نوٹ',
    saveBtn: 'محفوظ کریں',
    listenBtn: 'آواز میں سنیں',
    problemLabel: 'بیماریاں:',
    solutionLabel: 'دوا اور مقدار:',
    opLabel: 'آپریشن اور دوائیں:',
    onlineLabel: 'آن لائن',
    aiTitle: 'ہائی پاور اے آئی ڈاکٹر 2026',
    aiSub: 'کوئی بھی سوال لکھیں یا مائیک سے بولیں — اے آئی آپ کی زبان میں جواب دے گا:',
    medNameLbl: 'دوا کا نام:',
    medDoseLbl: 'کتنی لینی ہے:',
    medUseLbl: 'فائدہ:',
    medWarnLbl: 'احتیاط:',
    searchPlaceholder: '37,800+ فیچرز میں تلاش کریں: پیناڈول، شوگر، بلڈ پریشر، رمضان، خوراک...',
    voiceTestPhrase: 'السلام علیکم، نورِ حرم 2026 آپ کی منتخب اردو زبان میں بالکل درست بول رہا ہے۔',
    launchVoice: 'آواز چیک کریں',
    launchTranslate: 'دوا کا ترجمہ',
    launchMeds: '66 ادویات',
    launchAi: 'ڈاکٹر سے پوچھیں',
    launchParchi: 'پرچی اسکین کریں',
    launchEmergency: 'ایمرجنسی 1122',
    launchWorld: 'عالمی 2026 ریڈار',
    tabAll: 'تمام سسٹم',
    tabEmergency: 'ایمرجنسی و سی پی آر',
    tabVision: 'تصویر و حلال چیک',
    tabAi: 'اے آئی اور پرچی',
    tabDocs: 'گوگل ڈاکس',
    tabTools: 'ادویات و ترجمہ',
    tabAnatomy: 'جسم اور وائٹلز',
    parchiTitle: 'ڈاکٹر کی پرچی اور لیب رپورٹ اسکینر',
    parchiSub: 'ڈاکٹر کی پرچی یا لیب رپورٹ کی تصویر یا ٹیکسٹ لکھیں:',
    gdocsTitle: 'گوگل ڈاکس ہیلتھ ریکارڈ',
    gdocsSub: 'مریض کا ریکارڈ اور رپورٹ براہِ راست گوگل ڈاکس میں محفوظ کریں یا سنیں۔',
    emergencyBannerTitle: 'ایمرجنسی ٹرائی ایج، 110 سی پی آر اور ابتدائی طبی امداد',
    emergencyBannerSub: 'فوری خطرے کی جانچ، آواز میں ابتدائی مدد اور او آر ایس کیلکولیٹر۔',
    visionTitle: 'تھری ان ون تصویر و حلال اسکینر',
    visionSub: 'کھانے کی پلیٹ، حلال اجزاء یا دوا کے پتے کی تصویر اسکین کریں۔',
    translatorTitle: 'گوگل سپر ٹرانسلیشن سسٹم (ہر زبان میں دوا)',
    translatorSub: 'کسی بھی دوا کا نام یا ہدایت 55 زبانوں میں ترجمہ کریں اور سنیں۔',
    worldRadarTitle: '2026 عالمی جدید میڈیکل سسٹم و دوا ریڈار',
    worldRadarSub: 'پوری دنیا کی نئی طبی تحقیق، عالمی ادارہ صحت کی ہدایات اور غیر ملکی دوا کا فارمولا دیکھیں۔',
    patientModeLabel: 'مریض آسان ڈسپلے',
    speakSummaryBtn: 'مکمل خلاصہ سنیں',
    hubTitle: 'انٹرنیشنل سپر ہسپتال آن لائن کمانڈ سینٹر',
    hubSub: 'کوئی بھی دوا یا بیماری آن لائن تلاش کریں، ایکسرے / الٹراساؤنڈ / بلڈ پریشر / لیب رپورٹ (100+ ٹیسٹ) چیک کریں، یا قریبی ہسپتال اور میڈیکل اسٹور آواز میں سنیں۔',
    hubTabSearch: 'آن لائن دوا / مرض',
    hubTabReport: 'ایکسرے / لیب / بی پی',
    hubTabNearby: 'قریبی ہسپتال و اسٹور',
    hubTabQuick: 'آسان فوری علاج',
    hubSearchBtn: 'آن لائن چیک و آواز',
    hubNearbyBtn: 'قریبی ہسپتال تلاش کریں',
    hubUploadBtn: 'تصویر / رپورٹ اپلوڈ کریں',
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
    searchPlaceholder: 'Search 37,800+ features: Panadol, Arinac, Ramadan, Diet, Sugar, BP...',
    voiceTestPhrase: 'Hello, Noor Haram 2026 voice system is speaking clearly in English.',
    launchVoice: 'Test Voice',
    launchTranslate: 'Translate Med',
    launchMeds: '66 Medicines',
    launchAi: 'Ask AI Doctor',
    launchParchi: 'Scan Prescription',
    launchEmergency: 'SOS 1122 & CPR',
    launchWorld: 'World 2026 Radar',
    tabAll: 'All Suite',
    tabEmergency: 'SOS & CPR',
    tabVision: 'Vision & Halal',
    tabAi: 'AI & Parchi',
    tabDocs: 'Google Docs',
    tabTools: 'Meds & Translate',
    tabAnatomy: 'Body, Vitals & QR',
    parchiTitle: 'Doctor Prescription & Lab Report Deep Scanner',
    parchiSub: 'Paste or upload prescription abbreviations (OD, BD, TDS, HS) or lab results (Hb, PLT, Sugar, LFT, RFT):',
    gdocsTitle: 'Google Docs Health Records Sync',
    gdocsSub: 'Save patient summaries, lab scans & prescriptions directly to Google Docs or listen aloud.',
    emergencyBannerTitle: 'AI Emergency Triage, Live 110 BPM CPR & First-Aid',
    emergencyBannerSub: 'Instant red-flag check, spoken first-aid, Stroke FAST test & WHO child ORS calculator.',
    visionTitle: '3-in-1 AI Vision Lab (Halal / Meal / Medicine)',
    visionSub: 'Scan meal plates for calories, packaged labels for Halal E-numbers, or strips for conflicts.',
    translatorTitle: 'Google Super Translation System (Medicines in Every Language)',
    translatorSub: 'Translate any medicine name or doctor instruction into all 55 languages and hear it spoken aloud.',
    worldRadarTitle: '2026 Global Medical Breakthroughs & Brand Converter',
    worldRadarSub: 'Check live 2026 worldwide treatments, WHO/FDA alerts, and international medicine generics.',
    patientModeLabel: 'Patient Easy Display',
    speakSummaryBtn: 'Speak Full Summary',
    hubTitle: 'International Super Hospital Online Command Center',
    hubSub: 'Search any medicine or disease online for purpose & dosage, check X-Ray / Ultrasound / BP / 100+ Lab Reports, or find & hear nearby Hospitals, Medical Stores & Labs.',
    hubTabSearch: 'Online Med / Disease',
    hubTabReport: 'X-Ray / Lab / BP Scan',
    hubTabNearby: 'Nearby Hospital & Store',
    hubTabQuick: 'Easy Quick Care',
    hubSearchBtn: 'Online Check & Speak',
    hubNearbyBtn: 'Find Nearby & Speak',
    hubUploadBtn: 'Upload Photo / Report',
  },
  ar: {
    warningTitle: 'السلامة أولاً (2026):',
    warningText: 'للمعلومات التعليمية فقط. كاميرا الهاتف لا تجري أشعة أو سوناراً حقيقياً. تأكد دائماً من الجرعة مع طبيب مختص.',
    emergTitle: 'خطوط الطوارئ',
    anatomyTitle: '40 جزءاً خارجياً وداخلياً والعمليات',
    anatomySub: 'انقر على أي جزء لعرض الأدوية والجرعة:',
    medTitle: 'دليل 66 دواءً عالمياً',
    medBadge: '66 دواء',
    medSub: 'اضغط على أي دواء لسماع الاسم والجرعة باللغة المختارة:',
    noteTitle: 'ملاحظة صحية',
    saveBtn: 'حفظ',
    listenBtn: 'استمع الآن',
    problemLabel: 'الأمراض:',
    solutionLabel: 'الدواء والجرعة:',
    opLabel: 'الجراحة:',
    onlineLabel: 'أونلاين',
    aiTitle: 'الذكاء الاصطناعي الطبي 2026',
    aiSub: 'اكتب أو تحدث أو صوّر الوصفة الطبية وسيرد عليك بالصوت فوراً:',
    medNameLbl: 'اسم الدواء:',
    medDoseLbl: 'الجرعة:',
    medUseLbl: 'الاستخدام:',
    medWarnLbl: 'تحذير:',
    searchPlaceholder: 'ابحث في 37,800+ ميزة: بنادول، سكري، ضغط، رمضان...',
    voiceTestPhrase: 'السلام عليكم، نظام الصوت في نور الحرم 2026 يتحدث العربية بوضوح.',
    launchVoice: 'فحص الصوت',
    launchTranslate: 'ترجمة الدواء',
    launchMeds: '66 دواء',
    launchAi: 'اسأل الطبيب الذكي',
    launchParchi: 'مسح الوصفة',
    launchEmergency: 'طوارئ وإنعاش',
    launchWorld: 'رادار العالم 2026',
    tabAll: 'الكل',
    tabEmergency: 'الطوارئ والإنعاش',
    tabVision: 'الفحص والحلال',
    tabAi: 'الطبيب والوصفة',
    tabDocs: 'مستندات جوجل',
    tabTools: 'الأدوية والترجمة',
    tabAnatomy: 'الجسم والمؤشرات',
    parchiTitle: 'ماسح الوصفات الطبية والتحاليل',
    parchiSub: 'الصق أو ارفع صورة الوصفة الطبية أو نتائج المختبر:',
    gdocsTitle: 'مزامنة السجلات مع مستندات جوجل',
    gdocsSub: 'احفظ ملخصات المريض والتحاليل مباشرة في مستندات جوجل أو استمع إليها.',
    emergencyBannerTitle: 'فرز الطوارئ الذكي والإنعاش القلبي',
    emergencyBannerSub: 'فحص فوري لعلامات الخطر مع تعليمات صوتية وحاسبة محلول الجفاف.',
    visionTitle: 'مختبر الرؤية الذكي (حلال / وجبة / دواء)',
    visionSub: 'امسح صور الطعام أو المكونات الحلال أو شريط الدواء.',
    translatorTitle: 'نظام جوجل الخارق لترجمة الأدوية',
    translatorSub: 'ترجم أي دواء أو تعليمات طبية إلى 55 لغة واستمع إلى النطق فوراً.',
    worldRadarTitle: 'أحدث الأنظمة الطبية العالمية 2026',
    worldRadarSub: 'تابع أحدث العلاجات العالمية وتنبيهات منظمة الصحة العالمية وبدائل الأدوية.',
    patientModeLabel: 'عرض المريض السهل',
    speakSummaryBtn: 'استمع للملخص الكامل',
    hubTitle: 'مركز المستشفى الدولي الذكي عبر الإنترنت',
    hubSub: 'ابحث عن أي دواء أو مرض لمعرفة الاستخدام والجرعة، افحص الأشعة والسونار والضغط و100+ تحليل، واعثر على أقرب مستشفى وصيدلية بالصوت.',
    hubTabSearch: 'بحث دواء / مرض',
    hubTabReport: 'فحص الأشعة / التحاليل',
    hubTabNearby: 'أقرب مستشفى وصيدلية',
    hubTabQuick: 'علاج سريع وسهل',
    hubSearchBtn: 'فحص أونلاين ونطق',
    hubNearbyBtn: 'ابحث بالـ GPS وتحدث',
    hubUploadBtn: 'رفع صورة / تقرير',
  },
  hi: {
    warningTitle: 'सुरक्षा पहले (2026):',
    warningText: 'यह ऐप केवल शैक्षिक जानकारी के लिए है। फोन कैमरा असली एक्स-रे या अल्ट्रासाउंड नहीं कर सकता। हमेशा डॉक्टर से सलाह लें।',
    emergTitle: 'आपातकालीन हेल्पलाइन',
    anatomyTitle: '40 बाहरी व भीतरी अंग व ऑपरेशन',
    anatomySub: 'दवा और खुराक के लिए किसी भी अंग पर क्लिक करें:',
    medTitle: '66 विश्व दवाइयाँ (क्लिक करें — नाम व खुराक सुनें)',
    medBadge: '66 दवाइयाँ',
    medSub: 'किसी भी दवा कार्ड पर क्लिक करें — चुनी गई भाषा में नाम और खुराक सुनें:',
    noteTitle: 'स्वास्थ्य नोट',
    saveBtn: 'सेव करें',
    listenBtn: 'सुनें',
    problemLabel: 'बीमारियाँ:',
    solutionLabel: 'दवा व खुराक:',
    opLabel: 'ऑपरेशन:',
    onlineLabel: 'ऑनलाइन',
    aiTitle: 'हाई-पावर मेडिकल AI डॉक्टर 2026',
    aiSub: 'सवाल लिखें, बोलें या पर्चे की फोटो स्कैन करें:',
    medNameLbl: 'दवा का नाम:',
    medDoseLbl: 'कितनी लेनी है:',
    medUseLbl: 'उपयोग:',
    medWarnLbl: 'सावधानी:',
    searchPlaceholder: '37,800+ फीचर्स में खोजें: पेनाडोल, शुगर, बीपी, डाइट...',
    voiceTestPhrase: 'नमस्ते, नूर हरम 2026 वॉइस सिस्टम हिंदी में बिल्कुल स्पष्ट बोल रहा है।',
    launchVoice: 'आवाज़ टेस्ट',
    launchTranslate: 'दवा अनुवाद',
    launchMeds: '66 दवाइयाँ',
    launchAi: 'AI डॉक्टर',
    launchParchi: 'पर्चा स्कैन',
    launchEmergency: 'इमरजेंसी 1122',
    launchWorld: 'वर्ल्ड 2026 रडार',
    tabAll: 'सभी टूल',
    tabEmergency: 'इमरजेंसी व CPR',
    tabVision: 'विज़न व हलाल',
    tabAi: 'AI व पर्चा',
    tabDocs: 'गूगल डॉक्स',
    tabTools: 'दवा व अनुवाद',
    tabAnatomy: 'शरीर व वाइटल्स',
    parchiTitle: 'डॉक्टर पर्चा और लैब रिपोर्ट स्कैनर',
    parchiSub: 'पर्चा या लैब रिपोर्ट टेक्स्ट लिखें या फोटो अपलोड करें:',
    gdocsTitle: 'गूगल डॉक्स हेल्थ रिकॉर्ड सिंक',
    gdocsSub: 'मरीज़ की रिपोर्ट सीधे गूगल डॉक्स में सेव करें या सुनें।',
    emergencyBannerTitle: 'AI इमरजेंसी ट्राइएज व 110 BPM CPR',
    emergencyBannerSub: 'तुरंत खतरे की जांच, बोलकर प्राथमिक उपचार व ORS कैलकुलेटर।',
    visionTitle: '3-इन-1 AI विज़न लैब',
    visionSub: 'खाने की थाली, सामग्री या दवा के पत्ते की फोटो स्कैन करें।',
    translatorTitle: 'गूगल सुपर अनुवाद सिस्टम (हर भाषा में दवा)',
    translatorSub: 'किसी भी दवा का नाम या डॉक्टर की सलाह 55 भाषाओं में अनुवाद करें और सुनें।',
    worldRadarTitle: '2026 विश्व नवीनतम मेडिकल सिस्टम रडार',
    worldRadarSub: 'दुनिया भर के नए इलाज, WHO/FDA अपडेट और विदेशी दवा का साल्ट खोजें।',
    patientModeLabel: 'मरीज़ आसान डिस्प्ले',
    speakSummaryBtn: 'पूरा सारांश सुनें',
    hubTitle: 'इंटरनेशनल सुपर हॉस्पिटल ऑनलाइन कमांड सेंटर',
    hubSub: 'कोई भी दवा या बीमारी ऑनलाइन खोजें (किस लिए व कितनी लें), एक्स-रे / अल्ट्रासाउंड / बीपी / 100+ लैब रिपोर्ट जांचें, और पास के अस्पताल व मेडिकल स्टोर आवाज़ में सुनें।',
    hubTabSearch: 'ऑनलाइन दवा / रोग',
    hubTabReport: 'एक्स-रे / लैब / बीपी',
    hubTabNearby: 'पास का अस्पताल व स्टोर',
    hubTabQuick: 'आसान त्वरित देखभाल',
    hubSearchBtn: 'ऑनलाइन जांचें व सुनें',
    hubNearbyBtn: 'GPS से पास खोजें व सुनें',
    hubUploadBtn: 'फ़ोटो / रिपोर्ट अपलोड',
  },
};
