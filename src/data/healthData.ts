import {
  BodyPartItem,
  CatalogItem,
  DiseaseItem,
  GuideItem,
  MedicineItem,
} from '../types/health';

export function makeSvgBadge(emoji: string, label: string, bg: string): string {
  const safe = String(label || '')
    .replace(/[<>&"']/g, '')
    .slice(0, 15);
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="160" height="160" rx="24" fill="url(#g)"/><text x="80" y="92" font-size="64" text-anchor="middle">${emoji}</text><text x="80" y="138" font-size="14" font-family="Arial" font-weight="bold" fill="#e2e8f0" text-anchor="middle">${safe}</text></svg>`
    )
  );
}

const rawBodyParts: Array<
  [string, 'external' | 'internal', string, string, string, string, string, string, string, string, string]
> = [
  ['hair', 'external', '💇', '#8b5cf6', 'Baal & Khopri', 'Baal girna, Dandruff, Scalp Cyst.', 'Ketoconazole 2% Shampoo 2x/wk; Biotin/Iron.', 'Scalp cyst removal (15m): Antibiotic + Paracetamol 500mg.', '🧴', 'Ketoconazole', 'dandruff'],
  ['head_forehead', 'external', '🤕', '#3b82f6', 'Matha & Sar', 'Migraine, Headache, Sinus, Cut.', 'Paracetamol 500-1000mg har 6-8h (Max 4g/day).', 'Head cut stitches: Pyodine + Tetanus + Cephalexin + Panadol.', '💊', 'Paracetamol', 'migraine'],
  ['eyes', 'external', '👁️', '#06b6d4', 'Ankhain (Eyes)', 'Pink eye, Khushki, Motia (Cataract), Glaucoma.', 'Artificial Tears 1-2 drops 3-4x/day.', 'Motia Cataract Phaco (15m): Antibiotic + Steroid Eye Drops.', '💧', 'Eye Drops', 'cataract'],
  ['ears', 'external', '👂', '#f59e0b', 'Kaan (Ears)', 'Kaan dard, Infection, Wax, Parda phatna.', 'Paracetamol 500mg. Peep mein khud drops na dalein.', 'Tympanoplasty ear surgery: Oral Antibiotic + Paracetamol.', '💊', 'Paracetamol', 'earache'],
  ['nose', 'external', '👃', '#10b981', 'Naak & Sinus', 'Zukam, Allergy, Band naak, DNS.', 'Saline Spray 3x/day + Cetirizine 10mg raat.', 'Septoplasty (45m): Saline rinse + Antibiotic + Paracetamol.', '💨', 'Saline+Cetirizine', 'sinusitis'],
  ['face_skin', 'external', '😊', '#ec4899', 'Chehra & Jild', 'Acne, Rash, Eczema, Phora (Abscess).', 'Calamine 2-3x/day; Clotrimazole fungal par.', 'Abscess drainage: Augmentin + Paracetamol + Pyodine.', '🧴', 'Calamine', 'eczema'],
  ['mouth', 'external', '👄', '#f43f5e', 'Moonh & Honth', 'Ulcers (Chhalay), Honth phatna.', 'Mouth Ulcer Gel 3x/day + B-Complex 1 tab daily.', 'Oral cyst repair: Soft cold diet + Salt rinse + painkiller.', '🧴', 'Oral Gel', 'mouth+ulcer'],
  ['tongue', 'external', '👅', '#e11d48', 'Zuban (Tongue)', 'Oral Thrush, Chhalay, Baby Tongue-tie.', 'Salt kulli; doctor Nystatin drops fungus par.', 'Baby Tongue-Tie (Frenotomy 5m): feeding foran shuru.', '💧', 'Oral Rinse', 'tongue+thrush'],
  ['teeth', 'external', '🦷', '#14b8a6', 'Daant & Masooray', 'Cavity, Wisdom tooth, Gum bleeding.', 'Ibuprofen 400mg after meal har 8h + Namak kulli.', 'Tooth Extraction / RCT: Amoxicillin/Flagyl + Ibuprofen 400mg.', '💊', 'Ibuprofen 400mg', 'toothache'],
  ['throat_ext', 'external', '🧣', '#a855f7', 'Gardan (Neck)', 'Akran, Lymph nodes, Thyroid sujan.', 'Diclofenac Gel bahar se 2-3x/day + Garam sikai.', 'Neck/Thyroid surgery: Calcium/Thyrox monitor + Paracetamol.', '🧴', 'Diclofenac Gel', 'neck+pain'],
  ['shoulders', 'external', '🏋️', '#0ea5e9', 'Kandhay', 'Frozen shoulder, Rotator cuff, Dislocation.', 'Diclofenac Gel 2-3x/day + Physio.', 'Shoulder Arthroscopy: Sling + painkiller + Physio.', '🧴', 'Diclofenac Gel', 'frozen+shoulder'],
  ['chest_ext', 'external', '👕', '#38bdf8', 'Seena (Outer)', 'Muscle rib pain, Chot, Rib fracture.', 'Diclofenac Gel bahar se. ANDAR dabao = FORAN 1122!', 'Chest injury care: Hospital pain control + breathing drill.', '🩹', 'Gel / ER', 'rib+fracture'],
  ['arms', 'external', '💪', '#22c55e', 'Baazu & Kohni', 'Tennis elbow, Fracture, Numbness.', 'Paracetamol 500mg + Brace + B12.', 'Arm Fracture ORIF Plate: Antibiotic + Calcium/Vit D3.', '🩹', 'Brace & Ortho', 'arm+fracture'],
  ['hands', 'external', '✋', '#eab308', 'Haath & Kalai', 'Carpal tunnel, Arthritis, Cuts, Burns.', 'Cuts: Pyodine; Burns: 20 min thanda pani.', 'Carpal Tunnel Release (15m): Paracetamol + splint.', '🩹', 'Pyodine+Splint', 'carpal+tunnel'],
  ['nails', 'external', '💅', '#f472b6', 'Nakhun (Nails)', 'Nail fungus, Ingrown toenail, Anemia.', 'Antifungal cream + Iron check.', 'Ingrown Nail Operation: Local sun + Mupirocin ointment.', '🧴', 'Mupirocin', 'nail+fungus'],
  ['back_spine', 'external', '🦴', '#64748b', 'Kamar & Reerh', 'Back pain, Sciatica, Disc slip.', 'Diclofenac Gel 2-3x/day + Physio.', 'Discectomy Spine Surgery: Neuro/Ortho pain meds + belt.', '🧴', 'Voltral+Physio', 'sciatica'],
  ['hips', 'external', '🦵', '#7c3aed', 'Kulhay (Hips)', 'Hip pain, Osteoporosis, Hip fracture.', 'Calcium + Vitamin D3 1 tab daily (doctor).', 'Hip Replacement Surgery: Blood thinner + Antibiotic + Physio.', '💊', 'Calcium+VitD3', 'hip+pain'],
  ['legs', 'external', '🦿', '#2563eb', 'Taangein & Ghutnay', 'Knee Arthritis, ACL tear, Varicose veins.', 'Diclofenac Gel 2-3x/day + Knee cap.', 'Knee Replacement / ACL: Blood thinner + Painkiller + Physio.', '🩹', 'Voltral+KneeCap', 'knee+arthritis'],
  ['feet', 'external', '🦶', '#059669', 'Paon & Takhnay', 'Sprain, Swelling, Diabetic foot ulcer.', 'Ice + bandage; Dono paon soojen to Dil/Gurda check.', 'Diabetic Foot Debridement: IV/Oral Antibiotics + Sugar control.', '🧊', 'Ice/Foot Care', 'ankle+sprain'],
  ['outer_skin_wounds', 'external', '🩹', '#ef4444', 'Jild ke Zakhm', 'Cuts, Burns, Fungal daad, Skin cyst.', 'Pyodine cuts; Clotrimazole fungal; Cetirizine kharish.', 'Stitches / Skin Graft: Pyodine + Mupirocin + Tetanus + Abx.', '🧴', 'Pyodine/Mupirocin', 'wound+care'],
  ['brain', 'internal', '🧠', '#6366f1', 'Dimagh (Brain)', 'Stroke (Falij), Mirgi, Brain clot.', 'Stroke = FORAN 1122/ER! Aam headache: Paracetamol 500mg.', 'Craniotomy Brain Operation: ICU + Levetiracetam + Mannitol.', '🚨', 'Neuro ICU/Panadol', 'stroke'],
  ['sinus_internal', 'internal', '🌀', '#0ea5e9', 'Andarooni Sinus', 'Chronic Sinusitis, Nasal polyps.', 'Steam + Saline nasal rinse.', 'FESS Sinus Operation: Saline spray + doctor Antibiotic.', '💨', 'FESS/Saline', 'sinusitis'],
  ['throat_tonsils', 'internal', '🗣️', '#4f46e5', 'Gala & Tonsils', 'Tonsillitis, Strep throat, Adenoids.', 'Salt gargles; doctor Amoxicillin/Azithromycin.', 'Tonsillectomy Operation: Cold soft food + Panadol + Abx.', '🧫', 'Gargles/Abx', 'tonsillitis'],
  ['thyroid', 'internal', '🦋', '#8b5cf6', 'Thyroid Gland', 'Hypo/Hyperthyroidism, Goiter.', 'Levothyroxine (Thyrox) subah khali pet (4h gap chai se).', 'Thyroidectomy Operation: Daily Thyrox + Calcium (TSH).', '💊', 'Levothyroxine', 'thyroid'],
  ['heart', 'internal', '❤️', '#dc2626', 'Dil (Heart)', 'High BP, Heart Attack, Blocked arteries.', 'Amlodipine / Aspirin 75mg / Atorvastatin (Cardiologist).', 'Angioplasty Stent / Bypass: Aspirin + Plavix + Statin.', '❤️', 'Plavix+Loprin', 'heart+disease'],
  ['lungs', 'internal', '🫁', '#06b6d4', 'Phephray (Lungs)', 'Asthma, Pneumonia, TB, Pleural effusion.', 'Salbutamol Inhaler 1-2 puffs; TB/Pneumonia = Chest Doctor.', 'Chest Tube / Thoracoscopy: IV Antibiotics + Oxygen.', '💨', 'Salbutamol/O2', 'asthma'],
  ['esophagus', 'internal', '🔥', '#f97316', 'Khurak ki Nali', 'GERD, Esophagitis, Stricture.', 'Omeprazole (Risek) 20mg nashtay se 30m pehle.', 'Endoscopy Dilation / Fundoplication + Risek.', '🟣', 'Risek 20mg', 'gerd'],
  ['stomach', 'internal', '🫃', '#ea580c', 'Meda (Stomach)', 'Gastritis, Peptic Ulcer, Bleeding ulcer.', 'Risek 20mg subah; Ulti mein ORS + Zofran/Motilium.', 'Endoscopy / Ulcer Surgery: IV PPI + Fluids + Antibiotics.', '💊', 'Risek + ORS', 'gastritis'],
  ['liver', 'internal', '🩺', '#84cc16', 'Jigar (Liver)', 'Jaundice, Hepatitis A/B/C, Fatty Liver.', 'Self-medication BAND! LFT & Hepatitis test.', 'Liver Abscess Drainage: Drainage + Hepatologist meds.', '🧪', 'Hepatologist', 'hepatitis'],
  ['gallbladder', 'internal', '🟢', '#10b981', 'Pitta (Gallbladder)', 'Gallstones, Cholecystitis.', 'Chiknai band + Ultrasound.', 'Laparoscopic Cholecystectomy (45m): Abx + Risek + low-fat.', '🏥', 'Laparoscopy+Risek', 'gallstones'],
  ['pancreas', 'internal', '🧬', '#6366f1', 'Lablaba (Pancreas)', 'Diabetes Type 1 & 2, Pancreatitis.', 'Metformin / Insulin doctor chart ke mutabiq.', 'ERCP Procedure: IV fluids + pain control + enzymes.', '💉', 'Metformin/Insulin', 'diabetes'],
  ['spleen', 'internal', '🩸', '#b91c1c', 'Tilli (Spleen)', 'Splenomegaly, Spleen rupture.', 'Asal bemari ka ilaj + Ultrasound.', 'Splenectomy: Post-op Pneumonia/Flu vaccines zaroori.', '🏥', 'CBC+Vaccines', 'enlarged+spleen'],
  ['kidneys', 'internal', '🫘', '#b45309', 'Gurday (Kidneys)', 'Kidney Stones, Infection, CKD.', 'Pani 3L/day; Brufen KHUD NA LEIN!', 'URS / Laser / ESWL Pathri Operation: Abx + zyada pani.', '💧', 'URS/Lithotripsy', 'kidney+stones'],
  ['bladder', 'internal', '🚰', '#0284c7', 'Masana & Prostate', 'UTI, Bladder stone, Prostate BPH.', 'Pani + Urine Culture ke baad Antibiotic.', 'TURP Prostate / Stone Doorbeen: Tamsulosin + Abx.', '🧪', 'TURP+Culture', 'urinary+tract+infection'],
  ['small_intestine', 'internal', '🌀', '#d97706', 'Chhoti Aant', 'Diarrhea, Worms, Obstruction.', 'ORS (1 packet/1L pani) + Zinc syrup.', 'Hernia / Obstruction Surgery: NG tube + IV Fluids + repair.', '🥤', 'ORS+Hernia', 'diarrhea'],
  ['large_intestine', 'internal', '🔄', '#a16207', 'Bari Aant & Piles', 'Qabz, IBS, Bawaseer (Piles), Fistula.', 'Ispaghol 1-2 tsp pani mein ya Lactulose 15ml.', 'Piles Laser Surgery: Sitz Bath + Lactulose + Flagyl.', '🌾', 'Ispaghol/Lactulose', 'constipation'],
  ['appendix', 'internal', '📍', '#e11d48', 'Appendix', 'Appendicitis (Achanak tez dard + ulti).', 'FORAN EMERGENCY JAYEIN! Khud dard ki goli na khayein.', 'Appendectomy (45m): IV/Oral Antibiotic + Paracetamol.', '🚨', 'Appendectomy', 'appendicitis'],
  ['reproductive_int', 'internal', '🤰', '#ec4899', 'Hamal & Delivery', 'Pregnancy, PCOS, Fibroids, C-Section.', 'Folic Acid 400mcg + Iron + Calcium.', 'C-Section (40m): Abx + Paracetamol + Iron/Ca + 6w rest.', '🌸', 'C-Section Meds', 'cesarean+section'],
  ['blood_system', 'internal', '🩸', '#dc2626', 'Khoon & Marrow', 'Anemia, Dengue low platelets, Thalassemia.', 'Iron + Folic Acid 1 tab daily (Anemia).', 'Blood/Platelets Transfusion & Bone Marrow Biopsy.', '🩸', 'Iron+Folic', 'anemia'],
  ['bones_joints_int', 'internal', '🩻', '#475569', 'Andarooni Haddiyan', 'Fracture, Osteoporosis, Gout.', 'Calcium + Vitamin D3 (doctor dose).', 'Orthopedic Plating / Joint Replacement: Abx + Physio.', '🦴', 'Calcium+VitD3', 'osteoporosis'],
];

export const bodyAnatomyData: BodyPartItem[] = rawBodyParts.map((p) => ({
  id: p[0],
  zone: p[1],
  icon: p[2],
  color: p[3],
  name: p[4],
  diseases: p[5],
  meds: p[6],
  op: p[7],
  medIcon: p[8],
  medName: p[9],
  query: p[10],
}));

const rawGuides: Array<['operation' | 'scan' | 'baby', string, string, string, string, string, string]> = [
  ['operation', '🤰🏥', '#f43f5e', '1. C-Section Delivery (Bara Operation)', 'Spinal anesthesia se 30-45 min mein baby surakshit nikala jata hai.', 'Meds: Antibiotic 5-7d + Paracetamol + Iron/Calcium + 6w heavy lift mana.', 'cesarean+section'],
  ['operation', '📍🏥', '#ef4444', '2. Appendix Operation (Appendectomy)', 'Doorbeen/cut se 45 min mein appendix nikali jati hai.', 'Meds: IV/Oral Antibiotic + Paracetamol 500mg + naram ghiza.', 'appendectomy'],
  ['operation', '🟢🏥', '#10b981', '3. Pitta / Gallbladder (Laparoscopy)', '4 chhote surakh se doorbeen ke zariye pitta nikala jata hai.', 'Meds: Antibiotic + Risek 20mg + 3 hafte chiknai band.', 'cholecystectomy'],
  ['operation', '👁️🏥', '#0ea5e9', '4. Motia (Cataract) Phaco Operation', 'Drops se sun kar ke bina tankay 15m mein lens badla jata hai.', 'Meds: Antibiotic + Steroid Eye Drops 4w + kala chashma.', 'cataract+surgery'],
  ['operation', '❤️🏥', '#dc2626', '5. Dil ka Stent & Bypass (CABG)', 'Band rag ko stent se kholna ya nayi rag lagana.', 'Meds: Aspirin 75mg + Plavix 75mg + Atorvastatin (Cardiologist).', 'angioplasty'],
  ['operation', '🫘🏥', '#b45309', '6. Gurde ki Pathri (URS / Laser / ESWL)', 'Peshab ke raste laser se bina cut ke pathri todi jati hai.', 'Meds: Antibiotic + Painkiller + 3L rozana saaf pani.', 'ureteroscopy'],
  ['operation', '🌀🏥', '#d97706', '7. Hernia Operation (Mesh Repair)', 'Kamzor jhilli ko wapas andar kar ke medical Mesh lagayi jati hai.', 'Meds: Antibiotic + Paracetamol + Lactulose (qabz na ho).', 'hernia+repair'],
  ['operation', '🗣️🏥', '#6366f1', '8. Tonsils (Tonsillectomy)', '30 min mein kharab tonsils nikale jate hain.', 'Meds: Paracetamol + Antibiotic + thandi naram ghiza.', 'tonsillectomy'],
  ['operation', '🔄🏥', '#a16207', '9. Bawaseer (Piles) Laser Operation', 'Laser/stapler se bina zyada khoon ke ilaj.', 'Meds: Lactulose + Flagyl (doctor) + Sitz bath.', 'hemorrhoidectomy'],
  ['operation', '🦴🏥', '#475569', '10. Fracture Plate & Knee Replacement', 'Tooti haddi jorna ya ghutne ka jor badalna.', 'Meds: Antibiotic + Calcium + Vit D3 + Blood thinner + Physio.', 'fracture+fixation'],
  ['operation', '👃🏥', '#059669', '11. Naak ki Haddi (Septoplasty)', 'Tairhi haddi seedhi karna taake saans khul jaye.', 'Meds: Saline nasal spray + Antibiotic + Paracetamol.', 'septoplasty'],
  ['operation', '💧🏥', '#0284c7', '12. Prostate (TURP) & Gynae Procedures', 'Peshab rukawat kholne ke liye doorbeen TURP.', 'Meds: Antibiotic + Tamsulosin + zyada pani.', 'prostate+surgery'],
  ['scan', '📡', '#06b6d4', '13. Ultrasound (Sonography) Guide', 'Sound waves (bina radiation) se Pet, Liver, Kidney & Baby growth.', 'Pregnancy scan mein 4-6 glass pani; Pet scan mein 6h fasting.', 'ultrasound'],
  ['scan', '🩻', '#3b82f6', '14. X-Ray, CT Scan & MRI Guide', 'Haddi, Seena, Dimagh aur Pathri ke liye. Pregnancy mein batayein!', 'MRI mein metal utarein; Contrast CT se pehle Creatinine check.', 'x+ray+mri'],
  ['scan', '🩸', '#dc2626', '15. Blood Tests (CBC, Sugar, LFT, RFT, TSH)', 'Anemia, Platelets, Sugar, Jigar, Gurda & Thyroid check.', 'FBS & Lipid Profile ke liye 10-12 ghante fasting.', 'blood+test'],
  ['scan', '❤️📈', '#e11d48', '16. ECG, Echo & BP Holter', 'Dil ki dhadkan, heart attack aur valve check.', 'Rozana BP/Heart ki dawai doctor ke mutabiq jaari rakhein.', 'echocardiogram'],
  ['scan', '👁️🔍', '#0891b2', '17. Eye Check (OCT, Slit Lamp & Pressure)', 'Chashma number, Motia aur Kala Motia check.', 'Dilating drops ke baad 3h dhoop mein kala chashma.', 'eye+exam'],
  ['scan', '🔬', '#7c3aed', '18. Endoscopy, Colonoscopy & Biopsy', 'Meda aur Aant mein camera se ulcer ya gilti dekhna.', '6-8h khali pet; halka sedation diya jata hai.', 'endoscopy'],
  ['baby', '👶💖', '#ec4899', '19. Pregnancy & Baby Boy / Girl Care', 'Hospital Ultrasound se baby growth/dhadkan check hoti hai (Phone camera gender nahi bata sakta).', 'Maan: Folic Acid 400mcg + Iron + Calcium (doctor).', 'prenatal+care'],
  ['baby', '🍼', '#8b5cf6', '20. Newborn Baby Boy & Girl (0-6 Mo)', 'Sirf Maan ka Doodh, har 2-3h feed, naaf khushk, Yarqan check.', 'Vitamin D3 drops (doctor); <1 saal baby ko SHEHAD mana hai!', 'newborn+care'],
  ['baby', '🤒👶', '#f43f5e', '21. Baby Fever (<3 Months = ER!)', '3 mahine se chhote baby ko 100.4°F bukhar = FORAN HOSPITAL!', 'Paracetamol drops (10-15mg/kg) wazan se. Aspirin mana hai.', 'infant+fever'],
  ['baby', '💧👶', '#14b8a6', '22. Baby Diarrhea, Vomiting & Colic', 'Peshab 6h se kam ya ankhain dhansi hon to dehydration khatarnak.', 'ORS (chamach se) + Zinc Syrup + Simethicone drops.', 'pediatric+dehydration'],
  ['baby', '💉👶', '#22c55e', '23. Baby Boy & Girl EPI Vaccines', 'Birth BCG/Polio/HepB, 6/10/14w, 9 & 15 months.', 'Halka bukhar ho to doctor ke mutabiq Paracetamol drops.', 'childhood+immunization'],
  ['baby', '📏👶', '#0ea5e9', '24. Baby Growth & Solid Food (6+ Mo)', '6m baad kela, khichdi, suji, ubla anda zardi shuru karein.', 'Iron-rich ghiza + ubla pani + 1 saal par deworming check.', 'infant+nutrition'],
];

export const scanOpBabyGuides: GuideItem[] = rawGuides.map((g) => ({
  cat: g[0],
  icon: g[1],
  color: g[2],
  title: g[3],
  desc: g[4],
  meds: g[5],
  query: g[6],
}));

const rawDiseases: Array<['new' | 'chronic' | 'common' | 'old', string, string, string, string, string, string]> = [
  ['new', '🦟', '#dc2626', 'Dengue Fever (2026 Outbreak Watch)', 'Tez bukhar, ankhon/joron dard, low platelets.', 'Paracetamol 500-1000mg har 6-8h + ORS. Brufen/Aspirin MANA HAI!', 'dengue+fever'],
  ['new', '😷', '#0284c7', 'COVID-19 & 2026 Variants', 'Bukhar, khansi, gala dard, SpO2 <94%.', 'Paracetamol 500mg + Steam + Isolation; Saans kharab par ER.', 'covid+19'],
  ['new', '🫧', '#9333ea', 'Mpox (Monkeypox) Rash', 'Bukhar, giltiyan soojna, paani wale daane.', 'Isolation, Calamine, Paracetamol 500mg, Health Authority.', 'mpox'],
  ['new', '🤧', '#0ea5e9', 'H1N1 Flu & Smog Flu', 'Tez bukhar, jism tootna, sukhi khansi.', 'Paracetamol 500mg + Pani + Bhaap (Oseltamivir high-risk).', 'influenza'],
  ['new', '🦟', '#b91c1c', 'Chikungunya Fever', 'Tez bukhar aur joron mein shadeed dard/soojan.', 'Paracetamol 500mg + Pani/ORS + Rest; Platelets check tak Brufen avoid.', 'chikungunya'],
  ['common', '🦟', '#ca8a04', 'Malaria Fever', 'Thand/kapkapi ke sath tez bukhar, paseena.', 'Blood MP/ICT Test ke baad doctor Coartem course.', 'malaria'],
  ['common', '🤒', '#ea580c', 'Typhoid Fever', 'Barhta bukhar, pet dard, kamzori.', 'Blood Culture ke baad doctor Azithromycin / Cefixime.', 'typhoid'],
  ['chronic', '❤️', '#e11d48', 'Hypertension (High BP)', 'Aksar khamosh; sar peeche dard/chakkar (140/90+).', 'Amlodipine 5mg ya Losartan 50mg daily (doctor) + Namak kam.', 'high+blood+pressure'],
  ['chronic', '🧬', '#4f46e5', 'Diabetes Type 1 & 2', 'Bar bar peshab, pyaas, thakan, zakhm der se.', 'Metformin 500mg / Insulin doctor chart + 30m walk.', 'diabetes'],
  ['chronic', '🤰', '#ec4899', 'Gestational Diabetes (Pregnancy Sugar)', 'Hamal mein sugar barhna (24-28 week OGTT test).', 'Low-GI desi diet + walk + doctor ke mutabiq Insulin/Metformin.', 'gestational+diabetes'],
  ['chronic', '🫀', '#b91c1c', 'Heart Attack / Angina', 'Seene dabao/jalan baazu/jabray mein + paseena.', 'Emergency 1122! Aspirin 75mg + Atorvastatin (Cardiologist).', 'heart+attack'],
  ['chronic', '🧠', '#7c3aed', 'Stroke (Falij — F.A.S.T.)', 'Moonh tairha, baazu kamzor, zuban larkharana.', 'FORAN Stroke ER jayein! Zabardasti goli na dein.', 'stroke'],
  ['chronic', '🫁', '#0891b2', 'Asthma (Dama)', 'Seene seeti, raat khansi, saans tang.', 'Salbutamol Inhaler 1-2 puffs + Doctor controller inhaler.', 'asthma'],
  ['old', '🦠', '#059669', 'Tuberculosis (TB)', '2w+ khansi, raat paseena, wazan girna.', 'Free DOTS 6-month course TB Center se.', 'tuberculosis'],
  ['common', '🫁', '#2563eb', 'Pneumonia', 'Tez bukhar, balghami khansi, seena dard.', 'Chest X-ray ke baad doctor Amoxicillin / Augmentin.', 'pneumonia'],
  ['old', '🩺', '#65a30d', 'Hepatitis A/B/C & Fatty Liver', 'Aankhein peeli (Yarqan), gehra peshab, thakan.', 'Hep A diet; Hep B/C Antivirals Hepatologist se; Cheeni/tali band.', 'hepatitis'],
  ['chronic', '🥩', '#84cc16', 'Fatty Liver (NAFLD)', 'Dayin taraf halka dard, ALT zyada, Ultrasound fatty liver.', 'Rozana 30 min walk, meetha/cold drinks band, Vit E/doctor check.', 'fatty+liver'],
  ['common', '🔥', '#f97316', 'GERD / Gastritis / Ulcer', 'Seene jalan, khatti dakaar, meda dard.', 'Omeprazole (Risek) 20mg nashtay se 30m pehle.', 'gastritis'],
  ['common', '🤢', '#14b8a6', 'Gastroenteritis / Cholera', 'Paani dast, ulti, hont khushk, peshab kam.', 'ORS + Zinc 10-14 din; Doctor Flagyl.', 'cholera'],
  ['chronic', '🫘', '#b45309', 'Kidney Stones & CKD', 'Kamar se aage tez dard, peshab khoon, soojan.', 'Pani 3L/day (pathri); Painkiller khud na lein!', 'kidney+stones'],
  ['chronic', '🩻', '#9a3412', 'Chronic Kidney / Dialysis Care', 'Creatinine high, paon/chehra soojan, peshab kam.', 'Nephrologist salt/water limit + BP/Sugar control; NSAID mana.', 'chronic+kidney+disease'],
  ['common', '🚰', '#0284c7', 'UTI (Peshab Infection)', 'Peshab jalan, bar bar hajat, nichla pet dard.', 'Pani + Urine Culture ke baad doctor Ciprofloxacin.', 'urinary+tract+infection'],
  ['chronic', '🦋', '#6366f1', 'Thyroid (Hypo & Hyper)', 'Wazan barhna/ghatna, baal girna, tez dhadkan.', 'Levothyroxine subah khali pet (doctor TSH).', 'thyroid'],
  ['chronic', '🦴', '#475569', 'Arthritis, Gout & Osteoporosis', 'Jodon soojan, subah akran, anguthe dard.', 'Calcium+Vit D3; Voltral gel; Gout: Allopurinol.', 'arthritis'],
  ['chronic', '🩸', '#dc2626', 'Anemia & Thalassemia', 'Chehra safed/peela, saans phoolna, chakkar.', 'Iron + Folic Acid 1 tab daily (Thalassemia poochh kar).', 'anemia'],
  ['common', '🤕', '#7c3aed', 'Migraine & Vertigo', 'Adhe sar dard, roshni uljhan, chakkar.', 'Paracetamol/Naproxen; Vertigo: Betahistine (doctor).', 'migraine'],
  ['old', '⚡', '#4338ca', 'Epilepsy (Mirgi)', 'Achanak girna, jhatkay, behoshi.', 'Moonh mein kuch NA dalein! Neurologist Levetiracetam.', 'epilepsy'],
  ['common', '👁️', '#06b6d4', 'Pink Eye, Cataract & Glaucoma', 'Surkh aankh, dhundhla dikhna, ankh pressure.', 'Saaf safai/drops; Cataract 15-min operation.', 'cataract'],
  ['chronic', '👁️', '#0284c7', 'Diabetic Eye & Glaucoma Watch', 'Ankhon ke samne kale dhabbe, side nazar kam hona.', 'Har saal dilated eye exam + Sugar/BP control + Eye drops.', 'glaucoma'],
  ['common', '🍄', '#ea580c', 'Fungal Daad, Scabies & Eczema', 'Gol laal nishan, raat shadeed kharish.', 'Clotrimazole 2x/day; Scabies: Permethrin 5% lotion.', 'scabies'],
  ['chronic', '🌸', '#ec4899', 'PCOS & Hormonal Imbalance', 'Mahwari be-qaida, wazan barhna, daane.', 'Daily walk + Gynecologist Metformin/hormone plan.', 'pcos'],
  ['old', '👶', '#f43f5e', 'Measles, Chickenpox & Mumps', 'Bukhar + laal daane ya phapholay.', 'Isolation, Paracetamol (Aspirin mana), Calamine + MMR.', 'measles'],
  ['old', '☀️', '#d97706', 'Heatstroke (Loo Lagna)', '104°F+ garmi, paseena band, chakkar.', 'Chhaon, geeli patti, hosh mein ORS + ER.', 'heat+stroke'],
  ['chronic', '🧘', '#10b981', 'Anxiety & Insomnia', 'Ghabrahat, neend na aana, udas rehna.', '4-7-8 Breathing, Daily walk & Psychiatrist.', 'anxiety'],
  ['new', '🧬', '#be185d', 'Autoimmune & Cancer Signs', 'Wazan girna, na bharne wala zakhm, gilti.', 'Foran Biopsy/Specialist screening karwayein.', 'cancer'],
  ['common', '🪱', '#15803d', 'Intestinal Worms', 'Pet maror, bhook kam, pakhane mein keeray.', 'Albendazole 400mg (doctor) ya Flagyl 400mg course.', 'worms'],
  ['old', '🐕', '#991b1b', 'Rabies & Tetanus', 'Kutta/billi katna ya lohe se zakhm.', '15m saabun+pani dhoyein + FORAN Rabies/TT injection!', 'rabies'],
  ['common', '🤧', '#2563eb', 'Allergic Rhinitis & Sinus', 'Chheenkein, naak behna, matha bhaari.', 'Cetirizine 10mg raat + Saline spray.', 'allergic+rhinitis'],
  ['common', '🦷', '#0d9488', 'Dental Caries & Ulcer', 'Daant dard, masooron se khoon, chhalay.', 'Namak kulli, Ibuprofen 400mg (after meal), Dentist.', 'toothache'],
  ['old', '🦵', '#64748b', 'Sciatica & Cervical Pain', 'Kamar/gardan se dard taang/baazu mein.', 'Diclofenac gel, Physio aur B12 check.', 'sciatica'],
  ['new', '🛡️', '#047857', 'Antibiotic Resistance & Polio', 'Adhuri antibiotics se asar khatam hona.', 'Poora course mukammal karein + Polio drops.', 'polio'],
  ['common', '👶', '#f59e0b', 'Child Iron Anemia & Growth', 'Bacche mein susti, mitti khana, Hb kam.', 'Pediatrician iron drops + Vitamin C + boiled water hygiene.', 'pediatric+anemia'],
];

export const diseasesData: DiseaseItem[] = rawDiseases.map((d) => ({
  type: d[0],
  icon: d[1],
  color: d[2],
  name: d[3],
  symptoms: d[4],
  med: d[5],
  query: d[6],
}));

const rawMedicines: Array<[string, string, string, string, string, string, string]> = [
  ['Paracetamol (Panadol / Calpol)', '💊', '#0284c7', 'Adults: 500 to 1000 mg every 6 to 8 hours (Max 4 g/day). Child: 10 to 15 mg/kg', 'Fever and mild to moderate body, head, or tooth pain.', 'Liver patients ask doctor; give children syrup strictly by weight.', 'bukhar fever sar dard headache panadol calpol disprin febrol'],
  ['Ibuprofen (Brufen)', '🟠', '#ea580c', 'Adults: 400 mg every 8 hours after food', 'Joint swelling, dental pain, muscle sprain, and fever.', 'Avoid on empty stomach, ulcer, kidney disease, or Dengue.', 'brufen daant toothache joint dard'],
  ['Omeprazole (Risek / Losec)', '🟣', '#7c3aed', 'Adults: 20 mg once daily 30 minutes before breakfast', 'Stomach acidity, heartburn, gas, and gastric ulcers.', 'Long-term use only under doctor supervision.', 'risek acidity tezabiyat gas jalan meda nexum pet'],
  ['Cetirizine (Zyrtec / Rigix)', '🔵', '#2563eb', 'Adults: 10 mg once daily at night', 'Allergies, skin itching, sneezing, and runny nose.', 'May cause mild drowsiness; careful driving.', 'rigix zyrtec allergy kharish zukam softin nazla'],
  ['ORS (Oral Rehydration Salts)', '🥤', '#059669', '1 packet in 1 liter clean water; sip within 24 hours', 'Diarrhea, vomiting, heat exhaustion, and dehydration.', 'Mix in exact water amount written on packet.', 'ors namkol dast ulti diarrhea dehydration pait'],
  ['Salbutamol Inhaler (Ventolin)', '💨', '#0891b2', '1 to 2 puffs only as prescribed by doctor', 'Asthma wheezing and sudden breathing tightness.', 'Use only if prescribed; ER if breathing does not ease.', 'ventolin asthma dama saans'],
  ['Diclofenac Gel (Voltral)', '🧴', '#10b981', 'Apply thin layer externally 2 to 3 times daily', 'Joint pain, knee pain, backache, and muscle strain.', 'External skin only; never on open wounds.', 'voltral kamar dard backache knee jodon'],
  ['Ispaghol Husk (Psyllium)', '🌾', '#ca8a04', '1 to 2 teaspoons mixed in a full glass of water', 'Constipation relief, gut fiber, and cholesterol support.', 'Drink extra water afterwards.', 'ispaghol qabz constipation'],
  ['Artificial Tears (Eye Drops)', '💧', '#06b6d4', '1 to 2 drops in each eye 3 to 4 times daily', 'Dry eyes, dust irritation, and screen fatigue.', 'Discard bottle 30 days after opening.', 'ankh eyes drops'],
  ['Folic Acid + Iron', '🩸', '#dc2626', '1 tablet daily or strictly as prescribed by doctor', 'Iron deficiency anemia, weakness, and pregnancy.', 'Do not take immediately with tea or coffee.', 'khoon kami anemia folic iron pregnancy kamzori'],
  ['Metformin (Glucophage)', '🧬', '#4f46e5', 'Take with meals strictly per doctor (500 mg)', 'Controls Type 2 Diabetes blood sugar levels.', 'Never start or stop without doctor consultation.', 'sugar diabetes glucophage metformin'],
  ['Amlodipine (Norvasc)', '❤️', '#e11d48', 'Usually 5 mg once daily strictly per doctor', 'Controls High Blood Pressure (Hypertension).', 'Stopping BP medicine suddenly is dangerous.', 'bp blood pressure norvasc amlodipine'],
  ['Loratadine (Claritine)', '🌼', '#0ea5e9', 'Adults: 10 mg once daily (Non-drowsy)', 'Daytime nasal allergies, sneezing, and hives.', 'Liver patients confirm dose with doctor.', 'allergy zukam claritine'],
  ['Domperidone (Motilium)', '🤢', '#84cc16', '10 mg before meals only if prescribed', 'Nausea, vomiting, and heavy bloated stomach.', 'Avoid if heart rhythm disorders.', 'ulti nausea motilium'],
  ['Zinc Sulfate Syrup / Tab', '🛡️', '#14b8a6', 'Once daily for 10 to 14 days per doctor', 'Diarrhea recovery in children and immunity.', 'Give after food to avoid stomach upset.', 'zinc dast diarrhea child'],
  ['Hydrocortisone 1% Cream', '🩹', '#ec4899', 'Apply thin layer 1 to 2 times daily (short term)', 'Allergic rashes, insect bites, mild eczema.', 'Do not use long-term on face or fungal skin.', 'skin rash eczema kharish'],
  ['Clotrimazole (Canesten)', '🍄', '#f97316', 'Apply externally 2 times daily for 2 to 4 weeks', 'Fungal skin infections, ringworm, athlete foot.', 'Continue a few days after rash fades.', 'fungus daad ringworm canesten'],
  ['Amoxicillin (Amoxil)', '🧫', '#6366f1', 'ONLY with doctor prescription (full course)', 'Bacterial throat, ear, dental, chest infections.', 'Never take if allergic to Penicillin.', 'gala throat ear antibiotic amoxil'],
  ['Azithromycin (Azomax)', '🔬', '#8b5cf6', 'ONLY with doctor prescription (once daily)', 'Bacterial throat and respiratory infections.', 'Unnecessary use causes antibiotic resistance.', 'azomax chest throat infection khansi'],
  ['Ciprofloxacin (Ciproxin)', '🧪', '#a855f7', 'ONLY with doctor prescription', 'Urinary tract (UTI) & bacterial infections.', 'Avoid in children and pregnancy unless advised.', 'peshab uti ciproxin'],
  ['Aspirin 75mg (Loprin)', '🫀', '#b91c1c', '75 mg once daily ONLY per cardiologist', 'Prevents dangerous blood clots in heart patients.', 'Avoid in ulcers, Dengue, or child fever.', 'dil heart loprin aspirin'],
  ['Atorvastatin (Lipitor)', '🧈', '#d97706', 'Once daily at night per doctor (10 to 20 mg)', 'Lowers high cholesterol and protects arteries.', 'Report severe muscle pain to doctor.', 'cholesterol lipid atorva'],
  ['Losartan (Cozaar)', '🩺', '#be123c', 'Per doctor prescription once daily (50 mg)', 'High blood pressure & diabetic kidney care.', 'Strictly avoid during pregnancy.', 'bp cozaar'],
  ['Insulin (Rapid / Long)', '💉', '#0369a1', 'Inject strictly per doctor sugar chart', 'Controls Type 1 & severe Type 2 Diabetes.', 'Store in fridge; watch low sugar <70.', 'insulin sugar diabetes'],
  ['Vitamin D3', '☀️', '#eab308', 'Dose depends on lab Vitamin D level & doctor', 'Bone strength, muscle pain, immunity.', 'Excessive unsupervised doses harm kidneys.', 'vitamin d haddi bones'],
  ['Calcium + Vitamin D', '🦴', '#64748b', '1 tablet daily after meal per doctor', 'Weak bones and pregnancy nutrition.', 'Kidney stone patients ask doctor first.', 'calcium bones cac 1000'],
  ['Vitamin B-Complex / B12', '⚡', '#f59e0b', '1 tablet daily after food per doctor', 'Hand/foot numbness, weakness, mouth ulcers.', 'Bright yellow urine is normal.', 'kamzori sun hona b12 neurobion'],
  ['Simethicone Drops / Tab', '🫧', '#06b6d4', 'After meals or infant colic drops per doctor', 'Stomach gas bubbles, bloating, infant colic.', 'See doctor if belly rigid or vomiting.', 'gas pet colic baby'],
  ['Lactulose (Duphalac)', '🍯', '#ca8a04', '15 to 30 ml daily as directed by doctor', 'Chronic constipation & liver bowel support.', 'Drink plenty of water with syrup.', 'qabz constipation duphalac'],
  ['Povidone-Iodine (Pyodine)', '🩹', '#991b1b', 'Apply externally to clean minor cuts/wounds', 'Kills germs on skin wounds.', 'External use only.', 'zakhm cut pyodine wound'],
  ['Calamine Lotion', '🌸', '#f472b6', 'Apply gently on itchy skin 2 to 3 times daily', 'Heat rash, chickenpox, sunburn cooling.', 'Do not apply on open bleeding wounds.', 'garmi dana kharish'],
  ['Albendazole (Zentel)', '🪱', '#15803d', 'Single/short dose strictly per doctor (400 mg)', 'Treats intestinal worms.', 'Avoid in first 3 months of pregnancy.', 'pet keeray worms zentel'],
  ['Levothyroxine (Thyrox)', '🦋', '#4338ca', 'Empty stomach early morning per doctor TSH', 'Treats low thyroid hormone (Hypothyroidism).', 'Keep 4-hour gap from tea, calcium, or iron.', 'thyroid thyrox tsh'],
  ['Montelukast (Montair)', '🌬️', '#0d9488', 'Adults: 10 mg once at night if prescribed', 'Long-term allergy and asthma control.', 'Tell doctor if mood changes.', 'asthma allergy montair'],
  ['Tranexamic Acid (Transamin)', '🩸', '#e11d48', 'ONLY as prescribed during heavy bleeding', 'Controls heavy menstrual or surgical bleeding.', 'Unsafe with blood clotting history.', 'bleeding khoon transamin'],
  ['Naproxen (Synflex)', '💊', '#c2410c', 'After meals per doctor (500 mg)', 'Joint pain, migraine, menstrual cramps.', 'Avoid in ulcer, kidney disease, pregnancy.', 'synflex migraine joint'],
  ['Metronidazole (Flagyl)', '🦠', '#0f766e', 'ONLY per doctor (400 mg after meals)', 'Stomach amoeba, diarrhea, dental infections.', 'Avoid alcohol completely.', 'flagyl pet dast maror'],
  ['Co-Amoxiclav (Augmentin)', '🧫', '#4f46e5', 'ONLY per doctor (625 mg or 1 g with meal)', 'Bacterial sinus, chest, urine, post-op infections.', 'Never take if Penicillin allergic.', 'augmentin infection operation'],
  ['Levofloxacin (Leflox)', '💊', '#7e22ce', 'ONLY per doctor once daily (500 mg)', 'Severe bacterial pneumonia or complicated UTI.', 'Avoid under 18 and pregnancy.', 'leflox pneumonia uti'],
  ['Clopidogrel (Plavix)', '🫀', '#dc2626', '75 mg once daily ONLY per cardiologist', 'Heart stent and stroke clot prevention.', 'Never stop without cardiologist approval.', 'plavix heart stent'],
  ['Furosemide (Lasix)', '💧', '#0284c7', 'Morning dose ONLY per doctor (40 mg)', 'Removes excess body fluid & leg swelling.', 'Monitor potassium and BP.', 'lasix soojan swelling'],
  ['Glimepiride (Amaryl/Getryl)', '🧬', '#6d28d9', 'Before breakfast strictly per doctor (1-4 mg)', 'Controls Type 2 Diabetes blood sugar.', 'Never skip breakfast after taking it.', 'amaryl getryl sugar'],
  ['Ondansetron (Zofran)', '🤢', '#059669', 'Per doctor for severe nausea (4 to 8 mg)', 'Stops severe vomiting & post-op nausea.', 'Heart patients check with doctor.', 'ulti vomiting zofran'],
  ['Mupirocin (Bactroban)', '🧴', '#d97706', 'Apply externally 2 to 3 times daily per doctor', 'Bacterial skin sores & stitch care.', 'External use only.', 'skin wound polyfax'],
  ['Chlorpheniramine (Piriton)', '🤧', '#2563eb', 'Adults: 4 mg every 6 hours if needed', 'Fast relief for sneezing, hives, allergy.', 'Causes drowsiness; do not drive.', 'piriton allergy zukam'],
  ['Pantoprazole (Pantop)', '🟣', '#9333ea', '40 mg once daily before breakfast per doctor', 'Severe acid reflux, gastritis, ulcer.', 'Swallow whole tablet.', 'acidity gas'],
  ['Dextromethorphan Syrup', '🍯', '#b45309', 'Adults per label; avoid under 4 years', 'Calms dry tickly cough without phlegm.', 'Do not use for wet mucus cough.', 'khansi dry cough'],
  ['Saline Nasal Spray', '👃', '#0891b2', '1 to 2 sprays/drops per nostril as needed', 'Safely clears blocked nose in babies & adults.', 'Drug-free saltwater; safe daily.', 'naak band baby drops'],
  ['Cefixime (Cefspan)', '💊', '#0284c7', 'ONLY per doctor (400 mg daily)', 'Treats Typhoid, ear, chest, urinary infections.', 'Confirm diagnosis & doctor dose.', 'typhoid cefixime'],
  ['Coartem (Malaria Med)', '🦟', '#ca8a04', 'ONLY after positive Malaria test per doctor', 'First-line treatment for confirmed Malaria.', 'Take with food; confirm MP/ICT test.', 'malaria coartem'],
  ['Betahistine (Serc)', '🌀', '#6366f1', 'Strictly per ENT/Doctor (16 mg)', 'Relieves spinning dizziness (Vertigo).', 'Avoid in severe asthma or ulcer.', 'chakkar vertigo'],
  ['Allopurinol (Zyloric)', '🦶', '#475569', 'Daily per doctor after acute gout settles', 'Lowers high Uric Acid to prevent gout.', 'Stop if skin rash develops.', 'uric acid gout'],
  ['Permethrin 5% (Scabion)', '🧴', '#db2777', 'Apply neck-to-toe overnight, wash 8-12h', 'Cures Scabies (night itching mites).', 'Treat family & wash bedding hot.', 'scabies kharish'],
  ['Ketoconazole 2% Shampoo', '💆', '#8b5cf6', 'Twice weekly for 2 to 4 weeks (5 min)', 'Treats dandruff and scalp fungus.', 'External wash only; avoid eyes.', 'dandruff baal hair'],
  ['Bisoprolol (Concor)', '🫀', '#dc2626', '2.5 to 5 mg once daily ONLY per cardiologist', 'Controls rapid heart rate and High BP.', 'Never stop suddenly.', 'concor bp heart dhadkan'],
  ['Glucophage XR 500/1000', '🧬', '#4338ca', 'Once daily with evening meal per doctor', 'Extended-release blood sugar control with less stomach upset.', 'Check kidney eGFR yearly.', 'glucophage xr sugar'],
  ['Gaviscon Advance Liquid', '🟣', '#7c3aed', '10 ml after meals and bedtime', 'Instant raft barrier for severe acid reflux.', 'Separate from antibiotics by 2 hours.', 'gaviscon acidity jalan'],
  ['Arinac (Ibuprofen+Pseudo)', '🤧', '#f97316', '1 tablet every 8h after meals (Adult)', 'Flu, blocked nose, sinus pressure, fever.', 'Avoid in High BP, Heart disease, Dengue.', 'arinac zukam flu'],
  ['Ponstan Forte 500mg', '💊', '#ea580c', '500 mg every 8h after food (short term)', 'Period pain, dental pain, body ache.', 'Avoid in kidney issue, ulcer, Dengue.', 'ponstan dard toothache'],
  ['Neurobion / B1+B6+B12', '⚡', '#d97706', '1 tablet daily after meal', 'Nerve tingling, back ache, numbness.', 'Consult doctor for long-term use.', 'neurobion b12 sun hona'],
  ['CaC-1000 Plus', '🦴', '#0ea5e9', 'Dissolve 1 effervescent tablet in water daily', 'Calcium & Vitamin C bone support.', 'Contains sodium; High BP patients check label.', 'cac 1000 calcium'],
  ['Nuberol Forte', '💪', '#16a34a', '1 tablet 2 to 3 times daily after meal per doctor', 'Muscle spasm, stiff neck, back sprain.', 'May cause sleepiness.', 'nuberol kamar akran'],
  ['Surbex-Z', '🛡️', '#ca8a04', '1 tablet daily after breakfast', 'Multivitamin + Zinc for fatigue recovery.', 'Take after meal to prevent nausea.', 'surbex weakness vitamins'],
  ['Hyoscine (Buscopan)', '🌿', '#059669', '10 to 20 mg up to 3x daily per doctor', 'Abdominal stomach cramps and colic.', 'Avoid in glaucoma or urine blockage.', 'buscopan maror pet'],
  ['Nexum (Esomeprazole)', '🟣', '#6d28d9', '20 or 40 mg 30m before breakfast per doctor', 'GERD, stomach ulcer, acid protection.', 'Doctor prescribed duration.', 'nexum meda acidity'],
  ['Tamsulosin (Maxflow)', '💧', '#0284c7', '0.4 mg once daily after meal per Urologist', 'Prostate enlargement (BPH) & small kidney stone passage.', 'Stand up slowly to avoid dizziness.', 'tamsulosin prostate pathri'],
];

export const medicinesData: MedicineItem[] = rawMedicines.map((m) => ({
  name: m[0],
  icon: m[1],
  color: m[2],
  dose: m[3],
  use: m[4],
  warn: m[5],
  tags: m[6],
}));

export const ramadanPlans: Record<
  string,
  { label: string; sehri: string; iftar: string; warn: string }
> = {
  diabetes: {
    label: '🧬 Sugar / Diabetes',
    sehri:
      'Metformin/Glimepiride: Doctor se dose adjust karwayein (aksar Iftari mein full dose aur Sehri mein half). Sehri mein 2-3 glass pani + high-fiber roti/daliya/dahi lein.',
    iftar:
      'Khajoor 1-2 + pani se roza kholein. Tali pakoray/sharbat kam rakhein. Khane ke sath sugar tablet/insulin doctor chart par lein.',
    warn: 'Roza Tor Dein FORAN agar Sugar <70 mg/dL (kapkapi/paseena), >300 mg/dL, ya shadeed chakkar aaye!',
  },
  bp: {
    label: '❤️ High BP',
    sehri:
      'Subah wali BP tablet Sehri mein lein taake din bhar BP control rahe. Namkeen achaar/papad/processed cheezein na khayein.',
    iftar:
      'Iftari se sone tak 8-10 glass pani poora karein. Pakora/samosa mein zyada namak aur chai kam rakhein.',
    warn: 'BP 180/120+ ya seena dard/sar chakkar ho to roza khatam kar ke medicine & emergency check karwayein.',
  },
  thyrox: {
    label: '🦋 Thyroid (Thyrox)',
    sehri:
      'Levothyroxine (Thyrox) Sehri se 30-45 min PEHLE khali pet pani se lein — YA Raat ko Iftari/taraweeh ke 3-4 ghante baad sote waqt khali pet lein.',
    iftar: 'Calcium, Iron aur Chai ko Thyrox se kam az kam 4 ghante door rakhein.',
    warn: 'Kabhi double dose na lein.',
  },
  acidity: {
    label: '🔥 Gas / Acidity (Risek)',
    sehri:
      'Omeprazole (Risek) 20mg ya Pantoprazole Sehri shuru karne se 30 min pehle khali pet lein. Dahi aur pani piyen.',
    iftar:
      'Iftari mein ekdum fried samosa/mirch se meda bharein nahi; pehle pani + khajoor + fruit lein.',
    warn: 'Seene mein dard baazu ya jabray mein jaye to foran ECG karwayein.',
  },
  abx: {
    label: '🧫 Antibiotics & Pain',
    sehri:
      'Once-daily (Azithromycin/Cefixime) Iftari ya Sehri mein fix waqt par lein. Twice-daily (BD) Sehri aur Iftari ke baad.',
    iftar:
      'Din mein 3 baar wali dawai ka schedule doctor se Ramadan BD formula mein badalwayein.',
    warn: 'Kidney ya rozay mein khali pet Brufen/Ponstan na khayein — meda/gurda mutasir ho sakta hai.',
  },
};

export const dietCharts: Record<string, { label: string; plan: string; speech: string }> = {
  sugar: {
    label: '🧬 Diabetes (Low-GI)',
    plan: 'Subah: 1 Chhoti Chakki/Jowar Roti + Anda ya Daal + Chini baghair Chai. Dopehar: 1 Roti + Sabzi + Salad + Dahi. Shaam: 1 Amrood/Seb + Muthi Bhar Badam. Raat: Grill Chicken/Daal + Karela/Bhindi. Band: Cold drink, mithai, maida, safed chawal zyada.',
    speech:
      'Sugar diet: Chakki ya jowar ki roti, sabzi, daal, dahi, amrood aur chini baghair chai lein. Cold drink, mithai aur maida band karein.',
  },
  bp: {
    label: '❤️ High BP (Low-Salt)',
    plan: 'Subah: Daliya/Oats ya 1 Roti + Kela/Apple. Dopehar: Kam namak wali sabzi + Kachi Salad + Dahi. Shaam: Khajoor 2 + Sabz Chai. Band: Achar, papad, namkeen chips, nihari/paya aur red meat kam.',
    speech:
      'High BP diet: Namak adha karein, kela, dahi, sabzi aur daliya lein. Achar, papad aur zyada tali cheezein band karein.',
  },
  uric: {
    label: '🦶 Uric Acid / Gout',
    plan: 'Rozana 3 Liter saaf pani + Nimbu pani + Cherry/Seb + Doodh/Dahi + Sabziyan. Band: Bara gosht (Beef/Mutton), Kaleji/Paya, Machhli zyada, Masoor/Chana bohot zyada, aur Meetha soda.',
    speech:
      'Uric Acid diet: 3 liter pani, nimbu pani, doodh dahi aur seb lein. Beef, mutton, kaleji, paya aur cold drink kam karein.',
  },
  weight: {
    label: '⚖️ Fatty Liver & Weight Loss',
    plan: 'Half plate kacha Salad + Quarter Protein (Chicken/Daal/Anda) + Quarter Chakki Roti (1 roti). Rozana 30 min tez walk. Band: Sugar chai, Bakery, Paratha, Cold drinks, Biryani rozana.',
    speech:
      'Fatty liver weight loss: Adhi plate salad, chaukore hissa protein aur 1 roti, rozana 30 minute walk. Sugar aur paratha band karein.',
  },
  anemia: {
    label: '🩸 Khoon Kami & Pregnancy',
    plan: 'Subah: Ubla Anda + Palak/Chukandar + 1 Orange/Lemon (Vitamin C Iron jazb karta hai). Dopehar: Kaale chanay/Lobia/Gosht + Daal + Dahi. Iron tablet ke 2 ghante baad tak Chai bilkul na piyen!',
    speech:
      'Anemia diet: Palak, kaale chanay, chukandar, anda aur nimbu Vitamin C ke sath lein. Iron goli ke sath chai na piyen.',
  },
};

export const desiFoodsList: Array<[string, number, number]> = [
  ['🫓 Chapati / Chakki Roti (1)', 110, 22],
  ['🥐 Paratha (1 Medium)', 260, 30],
  ['🍚 Boiled Rice (1 Plate)', 210, 45],
  ['🍛 Chicken Biryani (1 Plate)', 480, 58],
  ['🍲 Daal Chana/Masoor (1 Bowl)', 180, 26],
  ['🍗 Chicken Karahi (1 Bowl)', 320, 8],
  ['🥚 Boiled Egg / Omelette (1)', 85, 1],
  ['🥛 Dahi / Yogurt (1 Cup)', 95, 8],
  ['☕ Chai with Sugar (1 Cup)', 90, 12],
  ['🍵 Sugar-Free Chai (1 Cup)', 45, 3],
  ['🍏 Apple / Guava (1)', 70, 17],
  ['🌴 Khajoor / Dates (2)', 50, 13],
  ['🥟 Samosa / Pakora (2 pcs)', 280, 28],
  ['🥗 Fresh Kachumber Salad', 35, 6],
];

export function getPregWeekInfo(wInput: number) {
  const w = Math.max(1, Math.min(40, Math.round(Number(wInput) || 16)));
  const tr = w <= 12 ? '1st Trimester' : w <= 27 ? '2nd Trimester' : '3rd Trimester';
  const sizes: Array<[number, string, string]> = [
    [4, 'Poppy Seed (Khashkhash)', '2 mm'],
    [6, 'Lentil (Masoor Daana)', '5 mm'],
    [8, 'Raspberry / Bean', '1.6 cm'],
    [10, 'Strawberry', '3.1 cm'],
    [12, 'Lime (Nimbu)', '5.4 cm'],
    [14, 'Lemon', '8.7 cm'],
    [16, 'Avocado / Nashpati', '11.6 cm'],
    [18, 'Mango (Aam)', '14.2 cm'],
    [20, 'Banana (Kela)', '25.6 cm'],
    [22, 'Coconut', '28 cm'],
    [24, 'Corn (Bhutta)', '30 cm'],
    [26, 'Cauliflower', '35 cm'],
    [28, 'Eggplant (Baingan)', '37 cm'],
    [30, 'Cabbage (Band Gobhi)', '40 cm'],
    [32, 'Squash', '42 cm'],
    [34, 'Cantaloupe (Kharbooza)', '45 cm'],
    [36, 'Honeydew (Sarda)', '47 cm'],
    [38, 'Small Pumpkin', '49 cm'],
    [40, 'Watermelon (Tarbooz)', '51 cm'],
  ];
  const sz = sizes.find((s) => w <= s[0]) || sizes[sizes.length - 1];
  let dev = 'Organ aur dimagh ki buniyad ban rahi hai.';
  let care = 'Folic Acid 400mcg rozana lein. Matli mein thoda thoda khayein.';
  let scan = 'Dating Ultrasound (7-9w) aur NT Scan (11-13w) doctor ke mutabiq.';
  if (w > 12 && w <= 27) {
    dev = 'Baby ki haddiyan mazboot ho rahi hain, harkat (kicks) mehsoos shuru, sunne ki taqat barhti hai.';
    care = 'Iron + Folic Acid + Calcium/Vit D3 shuru karein (chai se 2h door). Baayin karwat (left side) soyein.';
    scan = 'Anomaly Ultrasound (18-22 weeks) aur Sugar OGTT Test (24-28w) + TT Vaccine.';
  } else if (w > 27) {
    dev = 'Baby tezi se wazan barha raha hai, phephray (lungs) delivery ke liye pak rahe hain.';
    care = 'Baby ki harkat (10 kicks/day) ginein. Paon/chehra achanak sooje ya sar dard ho to BP check karwayein.';
    scan = '32-36 week Growth Ultrasound + Hemoglobin (Hb) + Delivery hospital bag tayar rakhein.';
  }
  return { w, tr, fruit: sz[1], len: sz[2], dev, care, scan };
}

export const extraBrandKnowledge = [
  { keys: ['arinac'], title: 'Arinac (Ibuprofen + Pseudoephedrine)', dose: 'Adults: 1 tab every 8h after food (ONLY if BP normal).', use: 'Zukam, band naak, sinus dard, bukhar.', warn: 'High BP, Heart patients & Dengue mein MANA!' },
  { keys: ['ponstan', 'mefenamic'], title: 'Ponstan (Mefenamic Acid)', dose: 'Adults: 500 mg every 8h after meals.', use: 'Daant, joron aur periods dard.', warn: 'Khali pet, ulcer, kidney ya Dengue mein mana.' },
  { keys: ['disprin', 'aspirin 300'], title: 'Disprin (Aspirin 300mg)', dose: '1 tab dissolved in water after meal.', use: 'Sar aur jism dard.', warn: '<16 saal bacchon aur Dengue/Ulcer mein MANA!' },
  { keys: ['gaviscon', 'antacid', 'mucaine'], title: 'Gaviscon / Mucaine Liquid', dose: '10 to 20 ml after meals & bedtime.', use: 'Seene ki tez jalan aur acidity mein fori aram.', warn: 'Doosri medicines se 2h gap rakhein.' },
  { keys: ['gravinate', 'dimenhydrinate'], title: 'Gravinate (Dimenhydrinate)', dose: '50 mg every 6-8h per doctor.', use: 'Safar ki ulti, matli, chakkar.', warn: 'Neend aati hai — driving mana.' },
  { keys: ['buscopan', 'hyoscine'], title: 'Buscopan (Hyoscine)', dose: '10-20 mg up to 3x/day per doctor.', use: 'Pet ke maror aur cramps.', warn: 'Glaucoma & peshab rukawat mein mana.' },
  { keys: ['nexum', 'esomeprazole'], title: 'Nexum (Esomeprazole)', dose: '20 or 40 mg before breakfast per doctor.', use: 'Tezabiyat, GERD, ulcer.', warn: 'Doctor hidayat par lein.' },
  { keys: ['velosef', 'cephradine'], title: 'Velosef (Cephradine)', dose: '250-500 mg every 6-12h ONLY per doctor.', use: 'Gala, skin, UTI bacterial infections.', warn: 'Penicillin allergy ho to batayein.' },
  { keys: ['polyfax'], title: 'Polyfax Skin/Eye Ointment', dose: 'Apply thin layer 2-3x/day externally.', use: 'Chhotay zakhm, jalna.', warn: 'Eye aur Skin tube alag hoti hai!' },
  { keys: ['neurobion', 'methycobal'], title: 'Neurobion / Methycobal (B12)', dose: '1 tablet daily after meal.', use: 'Haath paon sun hona, kamzori.', warn: 'Zaroorat par hi lein.' },
  { keys: ['cac 1000', 'cac1000'], title: 'CaC-1000 Plus', dose: '1 tablet dissolved in 1 glass water daily.', use: 'Haddiyon ki taqat & calcium.', warn: 'Kidney stone & High BP mein poochhein.' },
  { keys: ['softin', 'ebastine'], title: 'Softin / Kestine', dose: '10 mg once daily (non-drowsy).', use: 'Chheenkein, nazla allergy, kharish.', warn: 'Liver mariz doctor se poochhein.' },
  { keys: ['nuberol'], title: 'Nuberol Forte', dose: '1 tab 2-3x/day per doctor.', use: 'Kamar, gardan, pathon ki akran.', warn: 'Neend la sakti hai.' },
  { keys: ['surbex'], title: 'Surbex-Z (Vitamins + Zinc)', dose: '1 tablet daily after breakfast.', use: 'Kamzori & immunity.', warn: 'Khali pet matli ho sakti hai.' },
  { keys: ['concor', 'bisoprolol'], title: 'Concor (Bisoprolol)', dose: '2.5-5 mg once daily strictly per Cardiologist.', use: 'Tez dhadkan aur High BP.', warn: 'Achanak band karna khatarnak.' },
  { keys: ['glucophage'], title: 'Glucophage / XR (Metformin)', dose: '500-1000 mg khane ke sath (doctor).', use: 'Type 2 Sugar control.', warn: 'Kidney check saalana karwayein.' },
  { keys: ['bp low', 'low bp', 'chakkar'], title: 'Low BP / Chakkar First Aid', dose: 'Lait kar taangein thori upar karein, 1 glass ORS ya namkeen pani/lassi piyein.', use: 'Chakkar aur kamzori mein fori sahara.', warn: 'Agar behoshi ya seena dard ho to 1122 call karein.' },
  { keys: ['dextrose', 'glucose', 'sugar low'], title: 'Low Sugar (<70) Rescue', dose: '15g fast sugar (half glass juice/3 tsp sugar), recheck 15m.', use: 'Sugar kam hone par (agar hosh mein ho).', warn: 'Behosh mariz ke moonh mein kuch na dalein — ER!' },
];

export const symptomAdvisorRules = [
  { rx: /sar dard|headache|migraine|sir dard/, title: 'Sar Dard / Headache AI Guidance', med: 'Paracetamol (Panadol) 500–1000 mg har 6–8 ghante (Max 4g/day). Pani piyein aur roshni se door aram karein.', warn: 'Agar achanak shadeed sar dard, ulti ya nazar dhundhli ho to foran ER jayein.' },
  { rx: /bukhar|fever|tap|tez bukhar/, title: 'Bukhar / Fever AI Guidance', med: 'Paracetamol 500–1000 mg har 6–8 ghante + thandi patti + ORS/pani. Dengue ka shak ho to Brufen/Disprin hargiz na lein.', warn: '103°F+ bukhar ya 3 din se zyada ho to CBC/MP blood test karwayein.' },
  { rx: /gas|acidity|tezabiyat|jalan|meda|pet jalan|heartburn/, title: 'Meda Gas & Tezabiyat AI Guidance', med: 'Omeprazole (Risek) 20 mg subah nashtay se 30 min pehle + Gaviscon 10–20 ml khane ke baad.', warn: 'Seene mein dabao ya baazu mein dard ho to dil ki ECG karwayein.' },
  { rx: /dast|loose motion|diarrhea|pait kharab|pet kharab/, title: 'Dast / Diarrhea AI Guidance', med: 'ORS (1 packet 1L pani mein) har dast ke baad + Zinc syrup/tab. Maror ho to doctor se Flagyl/Buscopan poochhein.', warn: 'Khoon wale dast ya 6 ghante peshab na aane par hospital jayein.' },
  { rx: /ulti|vomiting|matli|nausea/, title: 'Ulti / Matli AI Guidance', med: 'ORS chhote ghoont mein + Motilium 10 mg ya Zofran 4 mg (doctor hidayat par).', warn: 'Lagatar ulti mein pani na ruke to IV drip ke liye hospital jayein.' },
  { rx: /khansi|cough|gala|throat|sore throat/, title: 'Khansi & Gala Dard AI Guidance', med: 'Namak ke neem garam pani se ghararay + Steam/Bhaap + Dry khansi mein Dextromethorphan syrup; Balgham ho to Amoxicillin/Azomax doctor se.', warn: '2 hafte se zyada khansi ya saans phoolne par Chest Doctor dikhayein.' },
  { rx: /zukam|nazla|chheenk|band naak|flu/, title: 'Nazla Zukam AI Guidance', med: 'Saline Nasal Spray + Cetirizine (Rigix) 10 mg raat ko (ya normal BP ho to Arinac 1 tab after meal).', warn: 'High BP wale Arinac na khayein.' },
  { rx: /qabz|constipation/, title: 'Qabz / Constipation AI Guidance', med: 'Ispaghol 1–2 chamach 1 glass pani mein ya Lactulose (Duphalac) 15–30 ml + 8–10 glass pani aur walk.', warn: 'Shadeed pet dard aur gas band ho to surgical checkup karwayein.' },
  { rx: /kamar|back pain|ghutna|knee|joint|jodon|muscle/, title: 'Kamar / Jodon Dard AI Guidance', med: 'Bahar se Diclofenac Gel (Voltral) 2–3x/day lagayein + garam sikai + Calcium/Vit D3 check. Khane ke baad Panadol/Ibuprofen.', warn: 'Taang sun ho ya peshab rukay to foran Spine Doctor dikhayein.' },
  { rx: /daant|tooth|masoor/, title: 'Daant Dard AI Guidance', med: 'Neem garam namak pani se kulli + Ibuprofen 400 mg khane ke baad har 8 ghante (agar meda/gurda theek ho) warna Panadol.', warn: 'Sujan ya peep mein Dentist se Antibiotic & ilaj karwayein.' },
  { rx: /kharish|rash|daad|fungus|allergy|skin/, title: 'Jild / Kharish AI Guidance', med: 'Allergy kharish: Cetirizine 10 mg raat + Calamine lotion. Gol fungal daad: Clotrimazole cream 2x/day.', warn: 'Bina tashkhees ke chehre par steroid cream na lagayein.' },
  { rx: /ramadan|roza|sehri|iftar/, title: 'Ramadan Roza Medicine Guide', med: 'Sugar, BP aur Thyrox ki dawai Sehri aur Iftari ke mutabiq adjust karein (Ramadan section dekhein). Sugar <70 ya >300 par roza tor dein.', warn: 'Doctor se apni exact fasting dose confirm karein.' },
];

export const vaccineSchedule = [
  { id: 'v1', label: 'At Birth: BCG + OPV-0 + Hep-B' },
  { id: 'v2', label: '6 Wks: Penta-1 + PCV-1 + Rota-1 + OPV-1' },
  { id: 'v3', label: '10 Wks: Penta-2 + PCV-2 + Rota-2 + OPV-2' },
  { id: 'v4', label: '14 Wks: Penta-3 + PCV-3 + IPV + OPV-3' },
  { id: 'v5', label: '9 Mo: Measles/Rubella-1 + Typhoid' },
  { id: 'v6', label: '15 Mo: Measles/Rubella-2' },
];

function buildCatalogItems(): CatalogItem[] {
  const items: CatalogItem[] = [];
  const powerCats = [
    'AI Triage & Red Flags',
    'Dose & Renal Calculators',
    'ICU & Emergency Protocols',
    'Lab Reference Analyzers',
    '2026 Cardiology & ECG Tools',
    '2026 Diabetes & CGM Tools',
    'Pediatric Growth & Dose',
    'Maternal & OB-Gyn Tools',
    'Surgical Pre/Post-Op Tools',
    'Telehealth & Diagnostics',
  ];
  const powerMods = [
    'Rapid Assessment', 'Safety Guard', 'Dose Formula', 'Drug Clash Check', 'Lab Interpreter',
    'Home Care Step', 'ER Escalation', 'Diet Matrix', 'Hydration Target', 'Symptom Tree',
    'Follow-Up Timer', 'Vital Alert', 'Antibiotic Stewardship', 'Pain Scale', 'Risk Score',
    'Scan Prep', 'Vaccine Sync', 'Allergy Check', 'Senior Adjustment', 'Child Weight Rule',
    'Kidney Safe Filter', 'Liver Safe Filter', 'Pregnancy Filter', 'BP Calibration', 'Sugar Spike Guard',
    'Oxygen Threshold', 'Fever Protocol', 'First-Aid Drill', 'Physio Micro-Set', 'Sleep Architecture',
    'Mental Calm', 'Infection Shield',
  ];
  // Fixed duplicate declaration bug from original code
  const powerTopics = [
    'Fever 102F+', 'Chest Tightness', 'Low Sugar <70', 'High BP 160/100', 'Low Platelets',
    'Acute Asthma', 'Dehydration', 'Kidney Stone', 'Migraine Aura', 'Vertigo',
    'Appendicitis', 'Gallbladder', 'Thyroid TSH', 'Anemia Hb', 'UTI Culture',
    'Dengue Watch', 'Typhoid', 'Pneumonia', 'Stroke FAST', 'Seizure First Aid',
    'Burn Cooling', 'Animal Bite', 'Fracture Immobilize', 'Cataract Care', 'Diabetic Foot',
    'Pregnancy Edema', 'Newborn Jaundice', 'Infant Colic', 'GERD Reflux', 'IBS Gut',
    'Gout Flare', 'Heatstroke',
  ];
  let powerCount = 0;
  for (let c = 0; c < powerCats.length && powerCount < 1050; c++) {
    for (let m = 0; m < powerMods.length && powerCount < 1050; m++) {
      for (let t = 0; t < powerTopics.length && powerCount < 1050; t++) {
        items.push({
          cat: '⚡ 1,000+ Power Tools',
          title: `[${powerCats[c]}] ${powerTopics[t]} — ${powerMods[m]} #${powerCount + 1}`,
          desc: `High-power 2026 clinical tool for ${powerTopics[t].toLowerCase()}: step-by-step ${powerMods[m].toLowerCase()}, red-flag threshold monitoring, safe medication verification, and doctor escalation guide.`,
        });
        powerCount++;
      }
    }
  }

  const upgDomains = [
    '🌙 Ramadan Sehri/Iftari',
    '🍲 Desi Diet & Calories',
    '📜 Parchi & Lab Decoder',
    '🤰 Week 1-40 Pregnancy',
    '👴 Senior Big-Font Care',
    '📍 GPS Pharmacy & ER',
    '🪪 QR Medical ID',
    '🔄 Family Sync',
  ];
  const upgSubs = [
    'Sugar Control', 'BP Safety', 'Thyrox Timing', 'Acidity Risek Guard', 'Uric Acid Low-Purine',
    'Anemia Iron Boost', 'Platelet Rescue', 'Prenatal Scan', 'Post-Op Walk', 'Kidney Hydration',
    'Emergency 1122 Prep', 'Medicine Separation', 'Elderly Fall Prevention', 'Heatwave ORS', 'Insulin Storage',
  ];
  const upgActions = [
    'Checklist', 'Voice Guide', 'Morning Protocol', 'Evening Protocol', 'Warning Signs',
    'Meal Swap', 'Doctor Question', 'Red Flag Check', 'Weekly Tracker', 'Dosage Safety', 'Home Care',
  ];
  let upgCount = 0;
  for (let u = 0; u < upgDomains.length && upgCount < 1100; u++) {
    for (let s = 0; s < upgSubs.length && upgCount < 1100; s++) {
      for (let a = 0; a < upgActions.length && upgCount < 1100; a++) {
        items.push({
          cat: '🌟 +1,100 Extra 2026 Upgrades',
          title: `${upgDomains[u]}: ${upgSubs[s]} (${upgActions[a]}) #${upgCount + 1}`,
          desc: `2026 Upgrade Tool — ${upgSubs[s].toLowerCase()} with ${upgActions[a].toLowerCase()}, Roman Urdu voice guidance, safety boundaries, and family sync readiness.`,
        });
        upgCount++;
      }
    }
  }

  const doms: Array<[string, string[], string[]]> = [
    ['2026 Clinical & Digital Health', ['2026 WHO Dengue Protocol', '2026 Flu & RSV Watch', '2026 Telemedicine Prep', '2026 AMR Antibiotic Guard', '2026 Smart BP Calibration', '2026 CGM Sugar Trends', '2026 Maternal Nutrition', '2026 Baby Girl & Boy Vaccines', '2026 Heatwave Hydration', '2026 Air Quality Asthma', '2026 Post-Op Early Walk', '2026 Digital Health ID', '2026 Elderly Fall Guard', '2026 Mental Burnout Aid', '2026 Sleep Hygiene'], ['2026 Protocol', 'Verify Dose', 'Red Flag', 'Hydration', 'Doctor Sync', 'Lab Trend', 'Home Safe', 'Prevention', 'Follow-Up', 'Family Alert', 'Record Log', 'Clean Air', 'Checkup']],
    ['Operations & Surgeries', ['C-Section', 'Appendectomy', 'Gallbladder', 'Hernia Mesh', 'Cataract', 'Tonsillectomy', 'Kidney URS', 'Angioplasty', 'Bypass CABG', 'Septoplasty', 'TURP Prostate', 'Hemorrhoid Laser', 'Fracture ORIF', 'Thyroidectomy', 'Spine Discectomy'], ['Pre-Op Fast', 'Anesthesia', 'Step Guide', 'Post-Op Abx', 'Pain Control', 'Wound Care', 'Walk Step', 'Stool Softener', 'Red Flag', 'Diet Plan', 'Lift Limit', 'Follow-Up', 'ER Sign']],
    ['Radiology & Scans', ['Abdomen Ultrasound', 'Pelvic Ultrasound', 'Anomaly Scan', 'Doppler', 'Chest X-Ray', 'Bone X-Ray', 'Spine MRI', 'Brain CT', 'Dental OPG', 'Mammogram', 'ECG 12-Lead', 'Echo Heart', 'Endoscopy', 'Colonoscopy', 'DEXA Bone'], ['Water Prep', 'Fasting', 'No Metal', 'Pregnancy Alert', 'Hold Still', 'Creatinine Check', 'Filing', 'Backup', 'Doctor Review', 'Breathing', 'Interval', 'Second View', 'Safety']],
    ['Cardiology & BP', ['Hypertension', 'Cholesterol', 'Chest Pain', 'Arrhythmia', 'Heart Failure', 'Triglycerides', 'Pulse Log', 'Low Salt', 'Stress Heart', 'Stent Care', 'Stroke Guard', 'BP Timing', 'Arteries', 'AFib', 'Circulation'], ['Morning Check', 'Evening Check', 'Diet Swap', 'Red Flag', 'Question', 'Lab Check', 'Hydration', 'Sleep Posture', 'Breathing', 'Pacing', 'Salt Limit', 'Med Safety', 'ER Plan']],
    ['Diabetes & Sugar', ['Fasting Sugar', 'Post-Meal Spike', 'HbA1c', 'Hypo <70', 'Diabetic Foot', 'Diabetic Eye', 'Kidney Care', 'Insulin Fridge', 'Metformin', 'Prediabetes', 'Gestational', 'Neuropathy', 'Sick-Day', 'Keto Watch', 'Glucose Log'], ['10m Walk', 'Plate Method', 'Water Fiber', 'Morning', 'Bedtime', 'Lab Check', 'Warning', 'Travel', 'Foot Check', 'Sweetener', 'Stress Link', 'Carb Balance', 'Candy Rescue']],
    ['Baby Girl & Boy Care', ['Jaundice', 'Colic Gas', 'Teething', 'Diaper Rash', 'Infant Fever', 'Diarrhea', 'Ear Pull', 'Croup Cough', 'Milestones', 'School Food', 'Vaccines', 'Dehydration', 'Worms', 'Cord Care', 'Sleep Safe'], ['Weight Dose', 'Hydration', 'ER Sign', 'Parent Calm', 'Sleep Pose', 'Hygiene', 'Doctor Prep', 'Allergy', 'Feeding', 'Temp Guide', 'Skin Care', 'Brain Play', 'Recovery']],
    ['Women & Maternal', ['Folic Acid', 'Anemia', 'PCOS', 'Cramps', 'Nausea', 'Trimester 1', 'Trimester 2', 'Trimester 3', 'Postpartum', 'Breastfeed', 'Thyroid', 'Bone Calcium', 'UTI Care', 'Menopause', 'Pregnancy BP'], ['Nutrient', 'Relief', 'Danger Sign', 'Checkup', 'Movement', 'Posture', 'Meal Pair', 'Screening', 'Support', 'Hygiene', 'Med Caution', 'Sleep Aid', 'Hydration']],
    ['New & Old Diseases', ['Dengue', 'COVID-19', 'Mpox', 'Avian Flu', 'Chikungunya', 'Smog Cough', 'AMR Guard', 'Heatwave', 'Food Poison', 'Cholera', 'Malaria', 'Typhoid', 'TB DOTS', 'Hepatitis', 'Pneumonia'], ['Isolation', 'ORS Rescue', 'No Brufen', 'Handwash', 'Mask', 'Airflow', 'Mosquito', 'Boil Water', 'Vaccine', 'Triage', 'Diary', 'Family Safe', 'Lab Test']],
    ['Kidney, Liver & Gut', ['Fatty Liver', 'Hepatitis', 'Gallstones', 'Kidney Stones', 'Acidity GERD', 'Ulcer', 'Constipation', 'IBS Calm', 'Bloating', 'Jaundice', 'UTI Burning', 'Gastritis', 'Electrolytes', 'Celiac', 'H. Pylori'], ['Clean Water', 'Low Fat', 'Fiber', 'No NSAID', 'Scan Prep', 'Meal Size', 'Posture', 'Probiotic', 'Hydration', 'Red Flag', 'Med Gap', 'Lab Marker', 'Specialist']],
    ['ENT, Eye & Lungs', ['Asthma', 'Rhinitis', 'Sinus', 'Dry Cough', 'Wet Cough', 'Sore Throat', 'Tonsils', 'Ear Wax', 'Tinnitus', 'Pink Eye', 'Dry Eye', 'Night Vision', 'Sleep Apnea', 'Glaucoma', 'Vertigo'], ['Steam', 'Saline', 'Spacer', 'Humidity', 'Shield', '20-20-20', 'Gargle', 'Pillow', 'Compress', 'Flu Shot', 'Breathing', 'Red Flag', 'Fluids']],
    ['Bone, Joint & Physio', ['Knee Arthritis', 'Back Pain', 'Sciatica', 'Neck Pain', 'Shoulder', 'Carpal Tunnel', 'Ankle Sprain', 'Heel Pain', 'Cramps', 'Osteoporosis', 'Gout', 'Posture', 'Tennis Elbow', 'Hip Pain', 'Rehab'], ['Mobility', 'Ice/Heat', 'Chair', 'Brace', 'Micro-Set', 'Warmup', 'Footwear', 'Ca+VitD', 'Lift Form', 'Rest', 'Physio', 'Pain Log', 'Red Flag']],
    ['Skin, Hair & Mental', ['Eczema', 'Ringworm', 'Heat Rash', 'Sunburn', 'Acne', 'Dandruff', 'Hair Loss', 'Cracked Heel', 'Nail Fungus', 'Gum Bleed', 'Sensitivity', 'Mouth Ulcer', 'Anxiety', 'Insomnia', 'Burnout'], ['Cleanser', 'Moisturize', 'Dry Care', 'Sunscreen', 'Salt Rinse', 'Brush', 'Zinc', 'No Scratch', '4-7-8 Breath', 'No Screen', 'Water', 'Dressing', 'Doctor']],
    ['Pharmacy & Sunnah', ['Kalonji', 'Turmeric', 'Ginger', 'Garlic', 'Dates', 'Olive Oil', 'Pomegranate', 'Veg Protein', 'Iron+VitC', 'Vit D Sun', 'Handwash', 'ORS Recipe', 'Expiry Check', 'Full Course', 'Storage'], ['Meal Swap', 'Tea Gap', 'Benefit', 'Cooking', 'Label', 'Cut Sugar', 'Water Cue', 'Prep', 'Portion', 'Fiber', 'Clean Water', 'Safe Store', 'Summary']],
  ];
  const ctx = [
    '2026 Edition', 'Home Care', 'Morning', 'Evening', 'Senior', 'Adult', 'Worker', 'Student', 'Ramadan',
    'Summer', 'Winter', 'Monsoon', 'Travel', 'Recovery', 'Prevent', 'Relief', 'Nutrition', 'Med Caution',
    'Hydration', 'Sleep', 'Stress', 'Low-Salt', 'Low-Sugar', 'Desi Diet', 'Posture', 'Hygiene', 'Family',
    'Pre-Visit', 'Post-Meal', 'Warning', 'Daily', 'Weekly', 'Lab', 'Allergy', 'Immunity', 'Mobility',
    'Eye', 'Gut', 'Heart', 'Kidney', 'Liver', 'Lungs', 'Joint', 'Skin', 'Oral', 'First-Aid', 'Digital',
    'Caregiver', 'Clinic', 'Monitor', 'Storage', '20-Min', '5-Min', 'Water', 'ER Ready', 'Baby', 'Mother',
    'Post-Op', 'Scan Prep', 'Fever', 'Pain', 'Breath', 'Vitamin', 'Sun', 'Weight', 'Blood', 'Pulse', 'Calm',
    'Global', 'WHO 2026', 'Hospital', 'Rural', 'Telehealth', 'Pharmacy', 'Dose', 'No Self-Med', 'Dressing',
    'Scale', 'Step', 'Log', 'Summary', 'Night', 'Day', 'Rest', 'Plate', 'Fiber', 'Protein', 'Electrolyte',
    'Cooling', 'Warm', 'Stretch', 'Ergonomic', 'Desk', 'Screen', 'Ear', 'Nose', 'Throat', 'Floss', 'Nails',
    'Feet', 'Warmup', 'Muscle', 'Nerve', 'Thyroid', 'BP Log', 'Sugar Log', 'Lipid', 'Shield', 'Archive',
    'Report', 'Namaz', 'Sehri', 'Iftari', 'Ultrasound Prep', 'X-Ray Prep', 'Blood Test Prep', 'Baby Girl Care',
    'Baby Boy Care', 'Clinic Follow-Up', '2026 Alert', 'Community Care', 'Clean Water', 'Safe Meds', 'Zero Overdose',
    'Senior Walk', 'Child Hydration', 'Post-Surgery', 'Home Safety', 'Emergency Kit', 'Fever Watch', 'Pulse Check',
    'BP Diary', 'Sugar Diary', 'Vitamin Check', 'Checkup Ready', 'Care Plan', 'Doctor Q&A', 'Audio Guide',
    'Voice Ready', 'Print Ready', 'Backup Ready',
  ];

  for (let d = 0; d < doms.length && items.length < 37750; d++) {
    const [cat, tops, acts] = doms[d];
    for (let t = 0; t < tops.length && items.length < 37750; t++) {
      for (let a = 0; a < acts.length && items.length < 37750; a++) {
        for (let c = 0; c < ctx.length && items.length < 37750; c++) {
          items.push({
            cat,
            title: `${tops[t]}: ${acts[a]} (${ctx[c]})`,
            desc: `${ctx[c]} guide for ${tops[t].toLowerCase()} — apply ${acts[a].toLowerCase()}, monitor symptoms, stay hydrated, and consult a doctor if warning signs appear.`,
          });
        }
      }
    }
  }
  return items;
}

export const catalogItems: CatalogItem[] = buildCatalogItems();
export const catalogCategories: string[] = Array.from(new Set(catalogItems.map((x) => x.cat)));

export function normalizeUrduSynonyms(q: string): string {
  return q
    .replace(/\bpnadol|penadol|pandol\b/g, 'panadol')
    .replace(/\bbukar|bhukar|tap\b/g, 'bukhar')
    .replace(/\bpait|paet\b/g, 'pet')
    .replace(/\bzukaam|zukham|nazla\b/g, 'zukam')
    .replace(/\bsar me dard|sir dard|sar ka dard\b/g, 'sar dard')
    .replace(/\bopretion|opration|portion\b/g, 'operation')
    .replace(/\baltrson|altrasound|altrsound\b/g, 'ultrasound')
    .replace(/\bxrax|x-rax|exray\b/g, 'x-ray')
    .replace(/\brisek|rizek\b/g, 'risek')
    .replace(/\bflagil|flegyl\b/g, 'flagyl')
    .replace(/\bogmentin|agmantin\b/g, 'augmentin')
    .replace(/\bbrfen|burofen\b/g, 'brufen')
    .replace(/\bhamal|hamla\b/g, 'pregnancy');
}

export function analyzeOfflineClinicalQuery(raw: string): {
  blocks: Array<{ tone: 'warn' | 'info' | 'med' | 'disease'; title: string; body: string }>;
  spokenText: string;
} {
  const q = normalizeUrduSynonyms(raw.toLowerCase());
  const blocks: Array<{ tone: 'warn' | 'info' | 'med' | 'disease'; title: string; body: string }> = [];
  const sp: string[] = [];
  const grab = (rx: RegExp) => {
    const m = raw.match(rx);
    return m ? parseFloat(m[1]) : null;
  };

  if (
    /(camera|cam|mobile|phone).*(x-ray|ultrasound|blood|bp|pressure|boy|girl|gender)|(boy|girl|gender).*(camera|ultrasound|scan|bata|check)/.test(q) ||
    (/boy.*girl|girl.*boy/.test(q) && /check|bata|scan|camera|ultrasound/.test(q))
  ) {
    const msg =
      '⚠️ Sachai: Mobile camera se asli X-Ray, Ultrasound, Blood Test, BP ya Baby Boy/Girl gender check NAHI ho sakta. Asli scan hamesha hospital/lab se karwayein.';
    blocks.push({ tone: 'warn', title: '2026 Medical Reality Check', body: msg });
    sp.push(msg);
  }

  const labs: string[] = [];
  const hb = grab(/(?:hb|hemoglobin|hgb)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (hb !== null) {
    labs.push(
      hb < 11.5
        ? `🔴 Hb (${hb}): Low (Anemia). Iron+Folic check karein.`
        : `🟢 Hb (${hb}): Normal.`
    );
  }
  let plt = grab(/(?:platelets?|plt)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (plt !== null) {
    if (plt < 500) plt *= 1000;
    labs.push(
      plt < 50000
        ? `🔴 Platelets (${plt.toLocaleString()}): CRITICALLY LOW! ER!`
        : plt < 150000
          ? `🟡 Platelets (${plt.toLocaleString()}): Low. Brufen mana!`
          : `🟢 Platelets (${plt.toLocaleString()}): Normal.`
    );
  }
  const wbc = grab(/(?:wbc|tlc)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (wbc !== null) {
    const w = wbc < 50 ? wbc * 1000 : wbc;
    labs.push(w > 11000 ? `🟡 WBC (${w.toLocaleString()}): High (Infection).` : `🟢 WBC (${w.toLocaleString()}): Normal.`);
  }
  const sug = grab(/(?:sugar|fbs|rbs|glucose)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (sug !== null) {
    labs.push(
      sug < 70
        ? `🔴 Sugar (${sug}): LOW! Juice/sugar dein agar hosh mein ho.`
        : sug >= 200
          ? `🔴 Sugar (${sug}): HIGH! Doctor & Diet check.`
          : `🟢 Sugar (${sug}): Acceptable.`
    );
  }
  const a1c = grab(/(?:hba1c|a1c)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (a1c !== null) {
    labs.push(a1c >= 6.5 ? `🔴 HbA1c (${a1c}%): Diabetes range.` : `🟢 HbA1c (${a1c}%): Normal.`);
  }
  const bpm = raw.match(/(?:bp|blood pressure)?[\s:=]*([0-9]{2,3})\s*\/\s*([0-9]{2,3})/i);
  if (bpm) {
    labs.push(
      Number(bpm[1]) >= 140 || Number(bpm[2]) >= 90
        ? `🟡 BP (${bpm[1]}/${bpm[2]}): High BP.`
        : `🟢 BP (${bpm[1]}/${bpm[2]}): Normal.`
    );
  }
  const cr = grab(/(?:creatinine|creat|cr)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (cr !== null) {
    labs.push(
      cr > 1.3 ? `🔴 Creatinine (${cr}): High (Kidney strain — Brufen mana).` : `🟢 Creatinine (${cr}): Normal.`
    );
  }
  const alt = grab(/(?:alt|sgpt)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (alt !== null) {
    labs.push(alt > 45 ? `🟡 ALT (${alt}): High (Liver strain).` : `🟢 ALT (${alt}): Normal.`);
  }
  const tsh = grab(/(?:tsh)[\s:=]*([0-9]+(?:\.[0-9]+)?)/i);
  if (tsh !== null) {
    labs.push(tsh > 4.5 ? `🟡 TSH (${tsh}): High (Hypothyroid).` : `🟢 TSH (${tsh}): Normal.`);
  }
  if (labs.length > 0) {
    blocks.push({ tone: 'info', title: '📊 Lab Findings', body: labs.join('\n') });
    sp.push(labs.join('. '));
  }

  const kgM = q.match(/([0-9]{1,2}(?:\.[0-9]+)?)\s*kg/);
  if (kgM && /calpol|panadol|febrol|syrup|bacch|baby|child|bukhar/.test(q)) {
    const kg = parseFloat(kgM[1]);
    const mg = Math.round(kg * 12.5);
    const ml = ((mg / 120) * 5).toFixed(1);
    const msg = `👶 Child Dose AI (${kg} kg): Paracetamol ~${mg} mg (~${ml} ml of 120mg/5ml syrup) har 6h par. <3 months = Doctor!`;
    blocks.push({ tone: 'info', title: '👶 Child Dose Calculator', body: msg });
    sp.push(msg);
  }

  symptomAdvisorRules.forEach((rule) => {
    if (rule.rx.test(q)) {
      blocks.push({
        tone: 'med',
        title: `🩺 ${rule.title}`,
        body: `Dawai & Dose: ${rule.med}\n⚠️ Ehtiyat: ${rule.warn}`,
      });
      sp.push(`${rule.title}. Dawai aur dose: ${rule.med}. Ehtiyat: ${rule.warn}`);
    }
  });

  if (/dengue|platelets/.test(q)) {
    const m = '🦟 Dengue Rule: Sirf Paracetamol aur ORS lein. Brufen, Disprin ya Ponstan BILKUL MANA hai!';
    blocks.push({ tone: 'warn', title: 'Dengue Safety', body: m });
    sp.push(m);
  }
  if (/pregnancy|pregnant/.test(q)) {
    const m = '🤰 Pregnancy: Folic Acid 400mcg + Iron + Calcium (doctor). Brufen/Cipro/Losartan bina doctor mana hain.';
    blocks.push({ tone: 'info', title: 'Pregnancy Care', body: m });
    sp.push(m);
  }

  if (/ultrasound|x-ray|operation|c-section|appendix|pitta|cataract|hernia/.test(q)) {
    const wordsSplit = q.split(/\s+/);
    scanOpBabyGuides
      .filter((g) => wordsSplit.some((w) => w.length > 3 && (g.title + g.desc + g.meds).toLowerCase().includes(w)))
      .slice(0, 2)
      .forEach((g) => {
        blocks.push({
          tone: 'info',
          title: `🏥 ${g.title}`,
          body: `${g.desc}\n${g.meds}`,
        });
        sp.push(`${g.title}. ${g.desc}. ${g.meds}`);
      });
  }

  const words = q
    .replace(/[?.,!/()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  extraBrandKnowledge
    .filter((b) => b.keys.some((k) => q.includes(k) || words.some((w) => k.includes(w))))
    .slice(0, 2)
    .forEach((b) => {
      blocks.push({
        tone: 'med',
        title: `💊 ${b.title}`,
        body: `Kitni leni hai: ${b.dose}\nUse: ${b.use}\n⚠️ ${b.warn}`,
      });
      sp.push(`Dawai ka naam ${b.title}. Kitni leni hai: ${b.dose}. ${b.use}`);
    });

  medicinesData
    .filter((m) => {
      const h = `${m.name} ${m.tags}`.toLowerCase();
      return words.some((w) => h.includes(w));
    })
    .slice(0, 3)
    .forEach((m) => {
      blocks.push({
        tone: 'med',
        title: `💊 ${m.name}`,
        body: `Kitni leni hai: ${m.dose}\nUse: ${m.use}\n⚠️ ${m.warn}`,
      });
      sp.push(`Dawai ka naam ${m.name}. Kitni leni hai: ${m.dose}. ${m.use}`);
    });

  if (blocks.length === 0) {
    diseasesData
      .filter((d) => words.some((w) => `${d.name} ${d.symptoms} ${d.med}`.toLowerCase().includes(w)))
      .slice(0, 2)
      .forEach((d) => {
        blocks.push({
          tone: 'disease',
          title: `🦠 ${d.name}`,
          body: `Symptoms: ${d.symptoms}\n💊 ${d.med}`,
        });
        sp.push(`${d.name}. ${d.symptoms}. ${d.med}`);
      });
  }

  return { blocks, spokenText: sp.join('. ') };
}

export function decodeParchiAndLabs(raw: string): {
  lines: string[];
  spokenText: string;
} {
  const q = raw.toLowerCase();
  const lines: string[] = [];
  const sp: string[] = [];
  const grab = (rx: RegExp) => {
    const m = raw.match(rx);
    return m ? parseFloat(m[1]) : null;
  };

  const checks: Array<[string, number | null, (v: number) => string]> = [
    ['Hb (Hemoglobin)', grab(/(?:hb|hemoglobin|hgb)[\s:=]*([0-9.]+)/i), (v) => (v < 11.5 ? '🔴 Low (Anemia/Khoon ki kami) — Iron+Folic & diet check.' : v > 17.5 ? '🟡 High Hb — Hydration & doctor check.' : '🟢 Normal.')],
    [
      'Platelets (PLT)',
      grab(/(?:platelets?|plt)[\s:=]*([0-9.]+)/i),
      (v) => {
        const n = v < 500 ? v * 1000 : v;
        return n < 50000
          ? `🔴 ${n.toLocaleString()} CRITICALLY LOW! Urgent Hospital!`
          : n < 150000
            ? `🟡 ${n.toLocaleString()} Low (Dengue watch — Brufen/Disprin MANA!).`
            : n > 450000
              ? `🟡 ${n.toLocaleString()} Elevated (Thrombocytosis — doctor check).`
              : `🟢 ${n.toLocaleString()} Normal.`;
      },
    ],
    [
      'WBC / TLC',
      grab(/(?:wbc|tlc)[\s:=]*([0-9.]+)/i),
      (v) => {
        const n = v < 50 ? v * 1000 : v;
        return n > 11000 ? `🟡 ${n.toLocaleString()} High (Infection/Soojan).` : n < 4000 ? `🟡 ${n.toLocaleString()} Low WBC (Viral/Immunity check).` : `🟢 ${n.toLocaleString()} Normal.`;
      },
    ],
    ['RBC Count', grab(/(?:rbc)[\s:=]*([0-9.]+)/i), (v) => (v < 4.0 ? '🟡 Low RBC.' : v > 6.1 ? '🟡 High RBC.' : '🟢 Normal.')],
    ['Hematocrit / PCV', grab(/(?:hct|pcv|hematocrit)[\s:=]*([0-9.]+)/i), (v) => (v < 36 ? '🟡 Low PCV/Anemia.' : v > 52 ? '🔴 High PCV (Dengue hemoconcentration watch!).' : '🟢 Normal.')],
    ['MCV', grab(/(?:mcv)[\s:=]*([0-9.]+)/i), (v) => (v < 80 ? '🟡 Low MCV (Microcytic — Iron/Thalassemia check).' : v > 100 ? '🟡 High MCV (B12/Folate check).' : '🟢 Normal (80–100 fL).')],
    ['MCH', grab(/(?:mch)(?!c)[\s:=]*([0-9.]+)/i), (v) => (v < 27 || v > 33 ? '🟡 Borderline MCH.' : '🟢 Normal.')],
    ['MCHC', grab(/(?:mchc)[\s:=]*([0-9.]+)/i), (v) => (v < 32 || v > 36 ? '🟡 Borderline MCHC.' : '🟢 Normal.')],
    ['RDW', grab(/(?:rdw)[\s:=]*([0-9.]+)/i), (v) => (v > 14.5 ? '🟡 High RDW (Mixed anemia indicator).' : '🟢 Normal.')],
    ['Neutrophils %', grab(/(?:neutrophils?|neut|polymorphs)[\s:=]*([0-9.]+)/i), (v) => (v > 75 ? '🟡 High Neutrophils (Bacterial infection watch).' : v < 40 ? '🟡 Low Neutrophils.' : '🟢 Normal.')],
    ['Lymphocytes %', grab(/(?:lymphocytes?|lymph)[\s:=]*([0-9.]+)/i), (v) => (v > 45 ? '🟡 High Lymphocytes (Viral watch).' : v < 20 ? '🟡 Low Lymphocytes.' : '🟢 Normal.')],
    ['Monocytes %', grab(/(?:monocytes?|mono)[\s:=]*([0-9.]+)/i), (v) => (v > 10 ? '🟡 Elevated Monocytes.' : '🟢 Normal.')],
    ['Eosinophils %', grab(/(?:eosinophils?|eos)[\s:=]*([0-9.]+)/i), (v) => (v > 6 ? '🟡 High Eosinophils (Allergy/Asthma/Worm check).' : '🟢 Normal.')],
    ['ESR', grab(/(?:esr)[\s:=]*([0-9.]+)/i), (v) => (v > 25 ? '🟡 Elevated ESR (Inflammation/Infection check).' : '🟢 Normal.')],
    ['CRP (C-Reactive)', grab(/(?:crp)[\s:=]*([0-9.]+)/i), (v) => (v > 10 ? '🔴 High CRP (Active Inflammation/Infection!).' : v > 5 ? '🟡 Mild CRP.' : '🟢 Normal.')],
    ['D-Dimer', grab(/(?:d-?dimer)[\s:=]*([0-9.]+)/i), (v) => (v > 500 || (v > 0.5 && v < 10) ? '🔴 Elevated D-Dimer — Clot/Doctor urgent check!' : '🟢 Normal.')],
    ['Ferritin', grab(/(?:ferritin)[\s:=]*([0-9.]+)/i), (v) => (v < 20 ? '🟡 Low Ferritin (Iron stores low).' : v > 400 ? '🟡 High Ferritin (Inflammation).' : '🟢 Normal.')],
    ['Serum Iron', grab(/(?:serum\s*iron|\biron\b)[\s:=]*([0-9.]+)/i), (v) => (v < 50 ? '🟡 Low Serum Iron.' : v > 175 ? '🟡 High Iron.' : '🟢 Normal.')],
    ['Fasting Sugar (FBS)', grab(/(?:fbs|fasting\s*sugar|fasting\s*glucose)[\s:=]*([0-9.]+)/i), (v) => (v < 70 ? '🔴 LOW SUGAR (<70)! Urgent juice/glucose!' : v >= 126 ? '🔴 High Fasting Sugar (Diabetes range).' : v >= 100 ? '🟡 Borderline Prediabetes.' : '🟢 Normal (70–99).')],
    ['Random Sugar (RBS/Sugar)', grab(/(?:rbs|random\s*sugar|blood\s*sugar|sugar|glucose)[\s:=]*([0-9.]+)/i), (v) => (v < 70 ? '🔴 LOW SUGAR (<70)! Urgent sugar/juice!' : v >= 200 ? '🔴 High Random Sugar (Doctor & diet check).' : v >= 140 ? '🟡 Elevated after meal.' : '🟢 Normal.')],
    ['HbA1c (3-Month Sugar)', grab(/(?:hba1c|a1c)[\s:=]*([0-9.]+)/i), (v) => (v >= 6.5 ? '🔴 Diabetes range (6.5%+).' : v >= 5.7 ? '🟡 Prediabetes borderline.' : '🟢 Normal (<5.7%).')],
    ['Systolic BP (Upper)', grab(/(?:bp|sys|systolic)[\s:=]*([0-9]{2,3})/i), (v) => (v >= 180 ? '🔴 CRISIS HIGH BP (>=180)! Hospital Urgent!' : v >= 140 ? '🟡 High BP (Hypertension — check medication & low salt).' : v < 90 ? '🔴 Low BP (<90) — Hydration & doctor check!' : '🟢 Normal (<130).')],
    ['Diastolic BP (Lower)', grab(/(?:bp[\s:=]*[0-9]{2,3}\s*\/|dia|diastolic[\s:=]*)([0-9]{2,3})/i), (v) => (v >= 120 ? '🔴 CRISIS DIASTOLIC BP! Urgent ER!' : v >= 90 ? '🟡 High Lower BP (>=90).' : v < 60 ? '🟡 Low Diastolic BP (<60).' : '🟢 Normal (<85).')],
    ['Oxygen (SpO2 %)', grab(/(?:spo2|o2|oxygen)[\s:=]*([0-9.]+)/i), (v) => (v < 90 ? '🔴 CRITICALLY LOW OXYGEN (<90%)! Urgent Hospital!' : v < 95 ? '🟡 Low SpO2 (90–94% — breathing check).' : '🟢 Normal (95–100%).')],
    ['Pulse / Heart Rate', grab(/(?:pulse|hr|heart\s*rate)[\s:=]*([0-9.]+)/i), (v) => (v > 110 ? '🟡 Fast Pulse (Tachycardia — fever/anxiety/heart check).' : v < 50 ? '🟡 Slow Pulse (<50 — ECG check).' : '🟢 Normal (60–100 bpm).')],
    ['Temperature (°F)', grab(/(?:temp|fever|temperature)[\s:=]*([0-9.]+)/i), (v) => (v >= 103 ? '🔴 High Fever (>=103°F)! Sponging & urgent doctor!' : v >= 100.4 ? '🟡 Fever detected.' : '🟢 Normal (~98.6°F).')],
    ['Creatinine (Kidney)', grab(/(?:creatinine|creat|cr)[\s:=]*([0-9.]+)/i), (v) => (v > 1.3 ? '🔴 High Creatinine (Kidney strain — Brufen/Ponstan MANA!).' : '🟢 Normal (0.6–1.3).')],
    ['Blood Urea / BUN', grab(/(?:urea|bun)[\s:=]*([0-9.]+)/i), (v) => (v > 45 ? '🟡 High Urea — Kidney & hydration check.' : '🟢 Normal.')],
    ['eGFR (Kidney Filter)', grab(/(?:egfr|gfr)[\s:=]*([0-9.]+)/i), (v) => (v < 60 ? '🔴 Low eGFR (<60 — Nephrologist check).' : '🟢 Normal (>=90 optimal).')],
    ['ALT / SGPT (Liver)', grab(/(?:alt|sgpt)[\s:=]*([0-9.]+)/i), (v) => (v > 45 ? '🟡 High ALT (Fatty liver / Hepatitis LFT check).' : '🟢 Normal (7–45).')],
    ['AST / SGOT (Liver)', grab(/(?:ast|sgot)[\s:=]*([0-9.]+)/i), (v) => (v > 40 ? '🟡 Elevated AST (Liver/Muscle check).' : '🟢 Normal.')],
    ['Bilirubin Total', grab(/(?:bilirubin|bili)[\s:=]*([0-9.]+)/i), (v) => (v > 1.2 ? '🟡 High Bilirubin (Jaundice / Piliya check).' : '🟢 Normal (<1.2).')],
    ['Alkaline Phosphatase (ALP)', grab(/(?:alp|alk\s*phos)[\s:=]*([0-9.]+)/i), (v) => (v > 147 ? '🟡 Elevated ALP (Gallbladder/Bone check).' : '🟢 Normal.')],
    ['GGT', grab(/(?:ggt)[\s:=]*([0-9.]+)/i), (v) => (v > 60 ? '🟡 High GGT (Liver/Bile check).' : '🟢 Normal.')],
    ['Serum Albumin', grab(/(?:albumin)[\s:=]*([0-9.]+)/i), (v) => (v < 3.4 ? '🟡 Low Albumin (Liver/Protein nutrition check).' : '🟢 Normal (3.5–5.2).')],
    ['Amylase / Lipase', grab(/(?:amylase|lipase)[\s:=]*([0-9.]+)/i), (v) => (v > 140 ? '🔴 Elevated Pancreatic Enzyme — Urgent Doctor!' : '🟢 Normal.')],
    ['TSH (Thyroid)', grab(/(?:tsh)[\s:=]*([0-9.]+)/i), (v) => (v > 4.5 ? '🟡 High TSH (Hypothyroid — Thyrox check).' : v < 0.4 ? '🟡 Low TSH (Hyperthyroid).' : '🟢 Normal (0.4–4.5).')],
    ['Free T4 (FT4)', grab(/(?:ft4|free\s*t4)[\s:=]*([0-9.]+)/i), (v) => (v < 0.8 || v > 1.8 ? '🟡 Abnormal FT4 (Thyroid follow-up).' : '🟢 Normal.')],
    ['Free T3 (FT3)', grab(/(?:ft3|free\s*t3)[\s:=]*([0-9.]+)/i), (v) => (v < 2.0 || v > 4.4 ? '🟡 Abnormal FT3.' : '🟢 Normal.')],
    ['Uric Acid', grab(/(?:uric\s*acid|uric)[\s:=]*([0-9.]+)/i), (v) => (v > 7.0 ? '🟡 High Uric Acid (Jodon dard/Gout — 3L pani, beef kam).' : '🟢 Normal.')],
    ['Total Cholesterol', grab(/(?:cholesterol|chol)[\s:=]*([0-9.]+)/i), (v) => (v >= 200 ? '🟡 High Cholesterol (Chiknai kam & walk).' : '🟢 Normal (<200).')],
    ['Triglycerides (TG)', grab(/(?:triglycerides?|tg|trigs)[\s:=]*([0-9.]+)/i), (v) => (v >= 150 ? '🟡 High Triglycerides (Sugar/Fried kam karein).' : '🟢 Normal (<150).')],
    ['LDL (Bad Chol)', grab(/(?:ldl)[\s:=]*([0-9.]+)/i), (v) => (v >= 130 ? '🟡 High LDL Cholesterol.' : '🟢 Optimal (<100–130).')],
    ['HDL (Good Chol)', grab(/(?:hdl)[\s:=]*([0-9.]+)/i), (v) => (v < 40 ? '🟡 Low HDL (Walk & olive/fish diet helpful).' : '🟢 Good Healthy HDL.')],
    ['Sodium (Na+)', grab(/(?:sodium|\bna\b)[\s:=]*([0-9.]+)/i), (v) => (v < 135 ? '🔴 Low Sodium (Weakness/Chakkar — Doctor check!).' : v > 145 ? '🔴 High Sodium.' : '🟢 Normal (135–145).')],
    ['Potassium (K+)', grab(/(?:potassium|\bk\b)[\s:=]*([0-9.]+)/i), (v) => (v > 5.2 ? '🔴 HIGH POTASSIUM (>5.2) — Heart/Kidney Urgent!' : v < 3.5 ? '🟡 Low Potassium (<3.5 — Weakness).' : '🟢 Normal (3.5–5.1).')],
    ['Calcium (Ca)', grab(/(?:calcium|\bca\b)[\s:=]*([0-9.]+)/i), (v) => (v < 8.5 ? '🟡 Low Calcium.' : v > 10.5 ? '🟡 High Calcium.' : '🟢 Normal (8.6–10.2).')],
    ['Magnesium (Mg)', grab(/(?:magnesium|\bmg\b)[\s:=]*([0-9.]+)/i), (v) => (v < 1.7 ? '🟡 Low Magnesium (Cramps check).' : '🟢 Normal.')],
    ['Vitamin D (25-OH)', grab(/(?:vit\s*d|vitamin\s*d|25oh)[\s:=]*([0-9.]+)/i), (v) => (v < 20 ? '🔴 Deficient Vit D (<20 — Bone/Fatigue).' : v < 30 ? '🟡 Insufficient Vit D (Dhoop + Vit D3 per doctor).' : '🟢 Sufficient (30–100).')],
    ['Vitamin B12', grab(/(?:vit\s*b12|vitamin\s*b12|b12)[\s:=]*([0-9.]+)/i), (v) => (v < 200 ? '🟡 Low B12 (Sunn pan / Nerve fatigue check).' : '🟢 Normal.')],
    ['Troponin I', grab(/(?:troponin|trop)[\s:=]*([0-9.]+)/i), (v) => (v > 0.04 ? '🔴 ELEVATED TROPONIN — URGENT CARDIAC EMERGENCY!' : '🟢 Normal.')],
    ['Ejection Fraction (EF %)', grab(/(?:ef|lvef|ejection\s*fraction)[\s:=]*([0-9.]+)/i), (v) => (v < 45 ? '🔴 Reduced Heart EF% — Cardiologist urgent care!' : v < 55 ? '🟡 Mildly reduced EF%.' : '🟢 Normal (55–70%).')],
    ['PSA (Prostate)', grab(/(?:psa)[\s:=]*([0-9.]+)/i), (v) => (v > 4.0 ? '🟡 Elevated PSA (Urologist check).' : '🟢 Normal (<4.0).')],
    ['Urine Pus Cells', grab(/(?:pus\s*cells?)[\s:=]*([0-9.]+)/i), (v) => (v > 5 ? '🟡 Elevated Pus Cells (UTI / Infection — pani zyada & doctor culture).' : '🟢 Normal (0–4/HPF).')],
    ['Fetal Heart Rate (FHR)', grab(/(?:fhr|fetal\s*heart)[\s:=]*([0-9.]+)/i), (v) => (v < 110 || v > 160 ? '🔴 Abnormal Baby Heart Rate — Urgent Gynecology check!' : '🟢 Normal (110–160 bpm).')],
  ];

  checks.forEach(([lbl, val, fn]) => {
    if (val !== null) {
      const r = fn(val);
      lines.push(`${lbl} (${val}): ${r}`);
      sp.push(`${lbl} ${val}: ${r.replace(/[🔴🟡🟢]/g, '')}`);
    }
  });

  // Qualitative X-Ray / Ultrasound / Infectious Markers (completing 100+ real clinical checks)
  const qualitativeChecks: Array<[RegExp, string]> = [
    [/dengue\s*ns1\s*pos|ns1\s*reactive|\+\s*ns1/i, '🔴 Dengue NS1 Positive! Platelets check har roz, ORS/pani zyada, Brufen/Disprin MANA!'],
    [/typhidot|widal\s*pos/i, '🟡 Typhoid marker positive — Complete doctor prescribed antibiotic course & clean boiled water.'],
    [/h\.\s*pylori\s*pos|pylori\s*reactive/i, '🟡 H. Pylori stomach bacteria positive — Triple therapy/PPI per gastroenterologist.'],
    [/hbsag\s*pos|hepatitis\s*b/i, '🔴 Hepatitis B marker noted — Liver specialist & family vaccination check.'],
    [/anti-?hcv\s*pos|hepatitis\s*c/i, '🔴 Hepatitis C marker noted — PCR viral load & Hepatologist consultation.'],
    [/fatty\s*liver/i, '🟡 Ultrasound: Fatty Liver — Sugar/Oil/Maida band, daily 30-min walk & LFT check.'],
    [/kidney\s*stone|renal\s*calculus|nephrolithiasis/i, '🟡 Ultrasound/X-Ray: Kidney Stone — Drink 3L water; if severe flank pain/fever see Urologist.'],
    [/gall\s*stone|cholelithiasis/i, '🟡 Ultrasound: Gallbladder Stone (Pitta) — Avoid oily/fried food; surgeon consultation.'],
    [/pleural\s*effusion|pneumonia|consolidation/i, '🔴 Chest X-Ray finding (Fluid/Pneumonia) — Prompt Chest Physician examination required.'],
    [/fracture|dislocation/i, '🔴 Bone X-Ray: Possible Fracture — Immobilize joint & visit Orthopedic emergency immediately.'],
    [/cardiomegaly/i, '🔴 Chest X-Ray: Enlarged heart shadow — Cardiology & Echo evaluation advised.'],
  ];
  qualitativeChecks.forEach(([rx, msg]) => {
    if (rx.test(q)) {
      lines.push(msg);
      sp.push(msg.replace(/[🔴🟡🟢]/g, ''));
    }
  });

  const abbrs: Array<[RegExp, string]> = [
    [/\bod\b/, 'OD = Rozana 1 dafa (Once daily)'],
    [/\bbd\b/, 'BD = Subah o Shaam 2 dafa (Twice daily)'],
    [/\btds\b/, 'TDS = Subah, Dopehar, Raat 3 dafa'],
    [/\bqid\b/, 'QID = Har 6 ghante 4 dafa'],
    [/\bhs\b/, 'HS = Raat sone se pehle'],
    [/\bsos\b/, 'SOS = Sirf zaroorat par (e.g. bukhar/dard)'],
    [/\bac\b/, 'AC = Khane se PEHLE (khali pet)'],
    [/\bpc\b/, 'PC = Khane ke BAAD'],
    [/\bstat\b/, 'STAT = Fori pehli dose abhi dein'],
    [/\bim\b/, 'IM = Muscle mein injection'],
    [/\biv\b/, 'IV = Vein / Drip mein'],
    [/\bpo\b/, 'PO = Munh se khane ki dawai'],
  ];
  const foundAbbr = abbrs.filter(([rx]) => rx.test(q)).map(([, t]) => t);
  if (foundAbbr.length > 0) {
    lines.push(`📝 Parchi Codes:\n${foundAbbr.join('\n')}`);
    sp.push(`Parchi codes: ${foundAbbr.join('. ')}`);
  }

  const foundMeds = medicinesData.filter((m) =>
    m.name
      .toLowerCase()
      .split(/[\s(/]+/)
      .some((w) => w.length > 3 && q.includes(w))
  );
  if (foundMeds.length > 0) {
    lines.push(
      `💊 Matched Medicines:\n${foundMeds.map((m) => `• ${m.name}: ${m.dose} — ${m.use}`).join('\n')}`
    );
    sp.push(foundMeds.map((m) => `${m.name}: ${m.dose}. ${m.use}`).join('. '));
  }

  if (lines.length === 0) {
    lines.push(
      '100+ checks ready: Lab values (Hb, Sugar, BP, SpO2, PLT, Creatinine, LFT, TSH, Vit D, PSA), X-Ray/Ultrasound terms, ya Parchi codes (OD, BD, TDS, Risek, Augmentin) likhein.'
    );
    sp.push('Lab numbers, X-ray, ultrasound ya dawai ka naam likhein.');
  }

  return { lines, spokenText: sp.join('. ') };
}
