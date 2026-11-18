export type ProfileId = 'self' | 'ammi' | 'abbu' | 'baby';

export interface CrystalTheme {
  icon: string;
  name: string;
  c1: string;
  c2: string;
  bg: string;
  card: string;
  border: string;
  accent: string;
  orb1: string;
  orb2: string;
}

export interface BodyPartItem {
  id: string;
  zone: 'external' | 'internal';
  icon: string;
  color: string;
  name: string;
  diseases: string;
  meds: string;
  op: string;
  medIcon: string;
  medName: string;
  query: string;
}

export interface GuideItem {
  cat: 'operation' | 'scan' | 'baby';
  icon: string;
  color: string;
  title: string;
  desc: string;
  meds: string;
  query: string;
}

export interface DiseaseItem {
  type: 'new' | 'chronic' | 'common' | 'old';
  icon: string;
  color: string;
  name: string;
  symptoms: string;
  med: string;
  query: string;
}

export interface MedicineItem {
  name: string;
  icon: string;
  color: string;
  dose: string;
  use: string;
  warn: string;
  tags: string;
}

export interface CatalogItem {
  cat: string;
  title: string;
  desc: string;
}

export interface VitalRecord {
  time: string;
  summary: string;
}

export interface SmartAlarm {
  id: number;
  med: string;
  time: string;
  pr: string;
  lastRang: string;
}

export interface ExpiryMed {
  id: number;
  n: string;
  d: string;
}

export interface DoctorContact {
  id: number;
  n: string;
  p: string;
}

export interface ScheduleMed {
  id: number;
  name: string;
  time: string;
  dose: string;
  taken: boolean;
}

export interface SavedPhoto {
  id: number;
  url: string;
  date: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  html?: string;
  speakRaw?: string;
}

export interface VoiceState {
  active: boolean;
  engineLabel: string;
  caption: string;
  showTapPlay: boolean;
}

export interface GoogleDocSummary {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleDocContent {
  documentId: string;
  title: string;
  text: string;
  endIndex: number;
}
