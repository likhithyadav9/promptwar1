export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export const ALL_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type SubjectType = 'theory' | 'lab' | 'tutorial' | 'seminar';

export interface BreakConfig {
  id: string;
  name: string;
  afterPeriod: number; // e.g. after period 2 or after period 4
  duration: number; // in minutes
  type: 'short' | 'lunch';
}

export interface CollegeConfig {
  collegeName: string;
  department: string;
  semester: string;
  academicYear: string;
  section: string;
  workingDays: DayOfWeek[];
  startTime: string; // e.g. "09:00"
  targetEndTime: string; // e.g. "16:30"
  periodsPerDay: number; // dynamic: 4 to 12
  periodDuration: number; // in minutes, e.g. 50
  breaks: BreakConfig[];
  defaultRoom: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  facultyName: string;
  weeklyPeriods: number;
  type: SubjectType;
  labDuration: number; // 1 for theory, 2 or 3 for lab
  room: string;
  color: string;
}

export interface SlotTiming {
  periodNumber: number; // 1-based, or -1 for break
  isBreak: boolean;
  breakType?: 'short' | 'lunch';
  breakName?: string;
  breakDuration?: number;
  startTime: string; // "09:00 AM"
  endTime: string; // "09:50 AM"
  startMinutes: number;
  endMinutes: number;
}

export interface TimetableCell {
  id: string;
  day: DayOfWeek;
  periodNumber: number;
  subjectId: string | null;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  room: string;
  type: SubjectType | 'empty';
  color: string;
  isLabContinuation?: boolean;
  labParentPeriod?: number;
  labSpan?: number;
}

export interface TimetableConflict {
  type: 'faculty_clash' | 'room_clash' | 'capacity_overflow' | 'lab_split' | 'unassigned_periods';
  severity: 'error' | 'warning';
  message: string;
  day?: DayOfWeek;
  period?: number;
  details?: string;
}

export interface TimetableData {
  id: string;
  config: CollegeConfig;
  grid: Record<DayOfWeek, Record<number, TimetableCell>>;
  slotTimings: SlotTiming[];
  generatedAt: string;
  conflicts: TimetableConflict[];
  stats: {
    totalWeeklySlots: number;
    requiredSlots: number;
    assignedSlots: number;
    emptySlots: number;
    fitnessScore: number;
  };
}

export interface MultiSectionData {
  activeSectionId: string;
  sections: {
    id: string;
    name: string;
    config: CollegeConfig;
    subjects: Subject[];
    timetable: TimetableData | null;
  }[];
}
