import {
  CollegeConfig,
  DayOfWeek,
  SlotTiming,
  Subject,
  TimetableCell,
  TimetableConflict,
  TimetableData,
} from '../types/timetable';
import { calculateSlotTimings } from './timeUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExternalClassAssignment {
  day: DayOfWeek;
  periodNumber: number;
  facultyName: string;
  className?: string;
}

/**
 * Validates whether the user's inputs allow a valid timetable to be generated.
 */
export function validateTimetableFeasibility(
  config: CollegeConfig,
  subjects: Subject[],
  externalAssignments: ExternalClassAssignment[] = []
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check working days
  if (!config.workingDays || config.workingDays.length === 0) {
    errors.push('No working days selected. Please select at least one working day (Monday - Saturday).');
  }

  // Check periods per day
  if (!config.periodsPerDay || config.periodsPerDay < 1) {
    errors.push('Number of periods per day must be at least 1.');
  }

  if (config.periodsPerDay > 14) {
    errors.push('Number of periods per day cannot exceed 14.');
  }

  // Check period duration
  if (!config.periodDuration || config.periodDuration < 20 || config.periodDuration > 120) {
    errors.push('Period duration must be between 20 and 120 minutes.');
  }

  // Check breaks validity
  for (const brk of config.breaks) {
    if (brk.afterPeriod < 1 || brk.afterPeriod >= config.periodsPerDay) {
      errors.push(
        `Break "${brk.name}" is scheduled after period ${brk.afterPeriod}, but periods per day is ${config.periodsPerDay}. Break must be between period 1 and ${config.periodsPerDay - 1}.`
      );
    }
  }

  // Calculate capacity
  const totalDays = config.workingDays.length;
  const totalWeeklySlots = totalDays * config.periodsPerDay;

  const totalRequiredPeriods = subjects.reduce((sum, s) => sum + (s.weeklyPeriods || 0), 0);

  if (subjects.length === 0) {
    errors.push('No subjects added. Please add at least one subject to generate a timetable.');
  }

  if (totalRequiredPeriods > totalWeeklySlots) {
    errors.push(
      `Insufficient timetable capacity: Total required periods (${totalRequiredPeriods}) exceeds total available weekly periods (${totalWeeklySlots} = ${totalDays} days × ${config.periodsPerDay} periods). Reduce subject periods or increase periods/working days.`
    );
  } else if (totalRequiredPeriods < totalWeeklySlots && subjects.length > 0) {
    warnings.push(
      `Timetable has ${totalWeeklySlots - totalRequiredPeriods} unassigned period(s). These will be marked as Free / Self-Study slots.`
    );
  }

  // Validate Labs consecutive block fit
  // Find continuous period segments between breaks
  const breakPoints = new Set(config.breaks.map((b) => b.afterPeriod));
  const segments: number[] = [];
  let currentSegmentLength = 0;
  for (let p = 1; p <= config.periodsPerDay; p++) {
    currentSegmentLength++;
    if (breakPoints.has(p) || p === config.periodsPerDay) {
      segments.push(currentSegmentLength);
      currentSegmentLength = 0;
    }
  }

  const maxConsecutiveSegment = Math.max(...segments, 0);

  const labSubjects = subjects.filter((s) => s.type === 'lab');
  for (const lab of labSubjects) {
    if (lab.labDuration > config.periodsPerDay) {
      errors.push(
        `Lab "${lab.name}" requires ${lab.labDuration} consecutive periods, which exceeds the daily maximum of ${config.periodsPerDay} periods.`
      );
    } else if (lab.labDuration > maxConsecutiveSegment) {
      errors.push(
        `Lab "${lab.name}" requires ${lab.labDuration} consecutive periods, but the longest unbroken block between breaks is only ${maxConsecutiveSegment} periods. Please adjust break positions or reduce lab duration.`
      );
    }

    if (lab.weeklyPeriods % lab.labDuration !== 0) {
      warnings.push(
        `Lab "${lab.name}" has ${lab.weeklyPeriods} weekly periods with session size of ${lab.labDuration}. The remaining ${lab.weeklyPeriods % lab.labDuration} period(s) cannot form a full lab session.`
      );
    }
  }

  // Check Faculty workload
  const facultyLoads: Record<string, number> = {};
  for (const s of subjects) {
    const fName = s.facultyName.trim() || 'Unassigned';
    facultyLoads[fName] = (facultyLoads[fName] || 0) + s.weeklyPeriods;
  }

  for (const [faculty, load] of Object.entries(facultyLoads)) {
    if (faculty !== 'Unassigned' && load > totalWeeklySlots) {
      errors.push(
        `Faculty "${faculty}" is assigned ${load} periods in this class, but total weekly capacity is only ${totalWeeklySlots}.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Returns available continuous period blocks for a given day that are not interrupted by breaks.
 * Example: If periods = 7, break after period 2, lunch after period 4:
 * Blocks are: [1, 2], [3, 4], [5, 6, 7]
 */
export function getContinuousPeriodBlocks(periodsPerDay: number, breaks: { afterPeriod: number }[]): number[][] {
  const breakSet = new Set(breaks.map((b) => b.afterPeriod));
  const blocks: number[][] = [];
  let currentBlock: number[] = [];

  for (let p = 1; p <= periodsPerDay; p++) {
    currentBlock.push(p);
    if (breakSet.has(p) || p === periodsPerDay) {
      blocks.push(currentBlock);
      currentBlock = [];
    }
  }

  return blocks;
}

/**
 * Shuffles an array randomly (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Core Dynamic Timetable Generator using Constraint Satisfaction and Heuristic Placement.
 */
export function generateTimetable(
  config: CollegeConfig,
  subjects: Subject[],
  externalAssignments: ExternalClassAssignment[] = []
): { timetable: TimetableData | null; error?: string } {
  const validation = validateTimetableFeasibility(config, subjects, externalAssignments);
  if (!validation.isValid) {
    return { timetable: null, error: validation.errors.join(' | ') };
  }

  const days = config.workingDays;
  const periods = config.periodsPerDay;
  const continuousBlocks = getContinuousPeriodBlocks(periods, config.breaks);

  // Initialize empty grid
  const grid: Record<DayOfWeek, Record<number, TimetableCell>> = {} as any;
  for (const day of days) {
    grid[day] = {};
    for (let p = 1; p <= periods; p++) {
      grid[day][p] = {
        id: `${day}-p${p}`,
        day,
        periodNumber: p,
        subjectId: null,
        subjectName: 'Free / Self Study',
        subjectCode: '',
        facultyName: '',
        room: config.defaultRoom || 'Classroom',
        type: 'empty',
        color: '#f1f5f9',
      };
    }
  }

  // Build external faculty occupancy lookup: `${facultyName}_${day}_${period}`
  const occupiedFaculty = new Set<string>();
  for (const ext of externalAssignments) {
    occupiedFaculty.add(`${ext.facultyName.toLowerCase()}_${ext.day}_${ext.periodNumber}`);
  }

  // Helper to check if faculty is available in a cell
  const isFacultyFree = (facultyName: string, day: DayOfWeek, pNum: number): boolean => {
    if (!facultyName || facultyName.trim() === '') return true;
    const key = `${facultyName.trim().toLowerCase()}_${day}_${pNum}`;
    return !occupiedFaculty.has(key);
  };

  // Helper to book faculty
  const bookFaculty = (facultyName: string, day: DayOfWeek, pNum: number) => {
    if (facultyName && facultyName.trim() !== '') {
      occupiedFaculty.add(`${facultyName.trim().toLowerCase()}_${day}_${pNum}`);
    }
  };

  // Track subject distribution per day to ensure even distribution
  const daySubjectCount: Record<string, number> = {}; // `${day}_${subjectId}` => count
  const dayFacultyCount: Record<string, number> = {}; // `${day}_${facultyName}` => count

  // 1. Separate Lab subjects and Theory/other subjects
  // Labs must be scheduled first because consecutive slots are heavily constrained!
  const labSubjects = subjects.filter((s) => s.type === 'lab' && s.weeklyPeriods > 0);
  const theorySubjects = subjects.filter((s) => s.type !== 'lab' && s.weeklyPeriods > 0);

  // Collect candidate consecutive windows for labs:
  // For each day, examine each continuous block and find sub-slices of length labDuration
  interface LabWindow {
    day: DayOfWeek;
    periods: number[];
  }

  const findLabWindows = (duration: number): LabWindow[] => {
    const windows: LabWindow[] = [];
    for (const day of days) {
      for (const block of continuousBlocks) {
        if (block.length >= duration) {
          for (let i = 0; i <= block.length - duration; i++) {
            const slice = block.slice(i, i + duration);
            windows.push({ day, periods: slice });
          }
        }
      }
    }
    return windows;
  };

  // Schedule Labs
  for (const lab of labSubjects) {
    const sessionCount = Math.floor(lab.weeklyPeriods / lab.labDuration);
    let sessionsPlaced = 0;

    // Get possible windows and shuffle them
    const possibleWindows = shuffleArray(findLabWindows(lab.labDuration));

    for (const win of possibleWindows) {
      if (sessionsPlaced >= sessionCount) break;

      // Check if all periods in this window are currently free
      const allFree = win.periods.every((p) => grid[win.day][p].type === 'empty');
      if (!allFree) continue;

      // Check if faculty is free for all periods in this window
      const facultyFree = win.periods.every((p) => isFacultyFree(lab.facultyName, win.day, p));
      if (!facultyFree) continue;

      // Don't place 2 lab sessions of the SAME subject on the same day if possible
      const alreadyOnThisDay = win.periods.some(
        (p) => grid[win.day][p].subjectId === lab.id
      );
      if (alreadyOnThisDay && days.length > sessionCount) continue;

      // Place the lab session!
      const startPeriod = win.periods[0];
      for (let i = 0; i < win.periods.length; i++) {
        const pNum = win.periods[i];
        grid[win.day][pNum] = {
          id: `${win.day}-p${pNum}`,
          day: win.day,
          periodNumber: pNum,
          subjectId: lab.id,
          subjectName: lab.name,
          subjectCode: lab.code,
          facultyName: lab.facultyName,
          room: lab.room || 'Lab Room',
          type: 'lab',
          color: lab.color,
          isLabContinuation: i > 0,
          labParentPeriod: startPeriod,
          labSpan: lab.labDuration,
        };
        bookFaculty(lab.facultyName, win.day, pNum);
        daySubjectCount[`${win.day}_${lab.id}`] = (daySubjectCount[`${win.day}_${lab.id}`] || 0) + 1;
        dayFacultyCount[`${win.day}_${lab.facultyName}`] = (dayFacultyCount[`${win.day}_${lab.facultyName}`] || 0) + 1;
      }

      sessionsPlaced++;
    }
  }

  // 2. Schedule Theory & Tutorial Subjects
  // Build a prioritized queue of individual period requirements
  // We want to distribute subjects evenly across days so a 4-period subject appears on 4 different days.
  interface TheoryNeed {
    subject: Subject;
    remaining: number;
  }

  const needs: TheoryNeed[] = theorySubjects.map((s) => ({
    subject: s,
    remaining: s.weeklyPeriods,
  }));

  // Sort by highest remaining first (most constrained)
  needs.sort((a, b) => b.remaining - a.remaining);

  // Available slots array
  interface EmptySlot {
    day: DayOfWeek;
    period: number;
  }

  const getEmptySlots = (): EmptySlot[] => {
    const free: EmptySlot[] = [];
    for (const day of days) {
      for (let p = 1; p <= periods; p++) {
        if (grid[day][p].type === 'empty') {
          free.push({ day, period: p });
        }
      }
    }
    return free;
  };

  // We assign period by period using heuristic scoring:
  // Penalty for:
  // - Same subject already on that day (strong penalty)
  // - Same subject in adjacent period (very strong penalty to avoid back-to-back same theory)
  // - Faculty already heavily loaded on that day
  let allPlaced = false;
  let iterations = 0;
  const maxIterations = 5000;

  while (!allPlaced && iterations < maxIterations) {
    iterations++;

    // Find the subject with the highest remaining periods > 0
    const activeNeed = needs.find((n) => n.remaining > 0);
    if (!activeNeed) {
      allPlaced = true;
      break;
    }

    const sub = activeNeed.subject;
    const emptySlots = getEmptySlots();
    if (emptySlots.length === 0) break;

    // Score all empty slots for this subject
    let bestSlot: EmptySlot | null = null;
    let lowestPenalty = Infinity;

    // Shuffle empty slots slightly for variety on regenerate
    const shuffledSlots = shuffleArray(emptySlots);

    for (const slot of shuffledSlots) {
      // Hard constraint: Faculty must be free
      if (!isFacultyFree(sub.facultyName, slot.day, slot.period)) {
        continue;
      }

      let penalty = 0;

      // Count of this subject already on this day
      const countToday = daySubjectCount[`${slot.day}_${sub.id}`] || 0;
      penalty += countToday * 100; // Prefer days without this subject

      // Check adjacent periods: avoid back-to-back same subject
      if (slot.period > 1 && grid[slot.day][slot.period - 1]?.subjectId === sub.id) {
        penalty += 300;
      }
      if (slot.period < periods && grid[slot.day][slot.period + 1]?.subjectId === sub.id) {
        penalty += 300;
      }

      // Faculty daily load penalty to balance faculty teaching hours across the week
      const facultyLoadToday = dayFacultyCount[`${slot.day}_${sub.facultyName}`] || 0;
      penalty += facultyLoadToday * 10;

      // Balance slot time: slight preference for morning/midday for core subjects
      if (slot.period === periods) {
        penalty += 5; // slight dislike for last period
      }

      if (penalty < lowestPenalty) {
        lowestPenalty = penalty;
        bestSlot = slot;
      }
    }

    if (bestSlot) {
      // Assign!
      grid[bestSlot.day][bestSlot.period] = {
        id: `${bestSlot.day}-p${bestSlot.period}`,
        day: bestSlot.day,
        periodNumber: bestSlot.period,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        facultyName: sub.facultyName,
        room: sub.room || config.defaultRoom || 'Room 101',
        type: sub.type,
        color: sub.color,
      };

      bookFaculty(sub.facultyName, bestSlot.day, bestSlot.period);
      daySubjectCount[`${bestSlot.day}_${sub.id}`] = (daySubjectCount[`${bestSlot.day}_${sub.id}`] || 0) + 1;
      dayFacultyCount[`${bestSlot.day}_${sub.facultyName}`] = (dayFacultyCount[`${bestSlot.day}_${sub.facultyName}`] || 0) + 1;
      activeNeed.remaining--;

      // Re-sort needs
      needs.sort((a, b) => b.remaining - a.remaining);
    } else {
      // If no valid slot could be found without clash, force break to avoid infinite loop
      break;
    }
  }

  // Count assigned slots
  let assignedCount = 0;
  let emptyCount = 0;
  const conflicts: TimetableConflict[] = [];

  for (const day of days) {
    for (let p = 1; p <= periods; p++) {
      if (grid[day][p].type !== 'empty') {
        assignedCount++;
      } else {
        emptyCount++;
      }
    }
  }

  // Check if any subject didn't get all periods assigned
  for (const need of needs) {
    if (need.remaining > 0) {
      conflicts.push({
        type: 'unassigned_periods',
        severity: 'warning',
        message: `Subject "${need.subject.name}" (${need.subject.code}) could only schedule ${
          need.subject.weeklyPeriods - need.remaining
        }/${need.subject.weeklyPeriods} periods due to slot constraints.`,
      });
    }
  }

  const slotTimings = calculateSlotTimings(
    config.startTime,
    config.periodDuration,
    config.periodsPerDay,
    config.breaks
  );

  const totalWeeklySlots = days.length * periods;
  const totalRequiredPeriods = subjects.reduce((sum, s) => sum + s.weeklyPeriods, 0);

  const timetableData: TimetableData = {
    id: `tt_${Date.now()}`,
    config: { ...config },
    grid,
    slotTimings,
    generatedAt: new Date().toLocaleString(),
    conflicts,
    stats: {
      totalWeeklySlots,
      requiredSlots: totalRequiredPeriods,
      assignedSlots: assignedCount,
      emptySlots: emptyCount,
      fitnessScore: Math.round((assignedCount / Math.max(totalRequiredPeriods, 1)) * 100),
    },
  };

  return { timetable: timetableData };
}

/**
 * Checks for any conflicts across the entire timetable
 */
export function detectAllTimetableConflicts(
  grid: Record<DayOfWeek, Record<number, TimetableCell>>,
  days: DayOfWeek[],
  periods: number,
  breaks: { afterPeriod: number }[],
  externalAssignments: ExternalClassAssignment[] = []
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];

  // Faculty clash in same period across external classes
  for (const day of days) {
    for (let p = 1; p <= periods; p++) {
      const cell = grid[day]?.[p];
      if (cell && cell.type !== 'empty' && cell.facultyName) {
        const extClash = externalAssignments.find(
          (ext) =>
            ext.facultyName.toLowerCase() === cell.facultyName.toLowerCase() &&
            ext.day === day &&
            ext.periodNumber === p
        );
        if (extClash) {
          conflicts.push({
            type: 'faculty_clash',
            severity: 'error',
            message: `Faculty Clash: ${cell.facultyName} is already assigned to ${extClash.className || 'another class'} on ${day} Period ${p}.`,
            day,
            period: p,
          });
        }
      }
    }
  }

  // Lab breaks crossing check
  const breakSet = new Set(breaks.map((b) => b.afterPeriod));
  for (const day of days) {
    for (let p = 1; p < periods; p++) {
      const current = grid[day]?.[p];
      const next = grid[day]?.[p + 1];
      if (
        current &&
        next &&
        current.type === 'lab' &&
        next.type === 'lab' &&
        current.subjectId === next.subjectId &&
        breakSet.has(p)
      ) {
        conflicts.push({
          type: 'lab_split',
          severity: 'error',
          message: `Lab Split: Lab ${current.subjectName} is split across a break between Period ${p} and ${p + 1} on ${day}.`,
          day,
          period: p,
        });
      }
    }
  }

  return conflicts;
}
