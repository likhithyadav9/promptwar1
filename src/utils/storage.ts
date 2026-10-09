import { CollegeConfig, Subject, TimetableData } from '../types/timetable';
import { PRESETS } from './presets';

const STORAGE_KEYS = {
  CONFIG: 'smart_timetable_config_v1',
  SUBJECTS: 'smart_timetable_subjects_v1',
  TIMETABLE: 'smart_timetable_data_v1',
  ACTIVE_PRESET: 'smart_timetable_active_preset_v1',
};

export function loadSavedConfig(): CollegeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading config from localStorage', err);
  }
  return PRESETS[0].config;
}

export function saveConfig(config: CollegeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving config to localStorage', err);
  }
}

export function loadSavedSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading subjects from localStorage', err);
  }
  return PRESETS[0].subjects;
}

export function saveSubjects(subjects: Subject[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (err) {
    console.error('Error saving subjects to localStorage', err);
  }
}

export function loadSavedTimetable(): TimetableData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading timetable from localStorage', err);
  }
  return null;
}

export function saveTimetable(timetable: TimetableData | null): void {
  try {
    if (timetable) {
      localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
    } else {
      localStorage.removeItem(STORAGE_KEYS.TIMETABLE);
    }
  } catch (err) {
    console.error('Error saving timetable to localStorage', err);
  }
}

export function loadActivePresetId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET) || PRESETS[0].id;
  } catch {
    return PRESETS[0].id;
  }
}

export function saveActivePresetId(presetId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET, presetId);
  } catch {
    // ignore
  }
}

export function clearAllSavedData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.TIMETABLE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PRESET);
  } catch {
    // ignore
  }
}
