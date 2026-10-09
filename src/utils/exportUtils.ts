import { DayOfWeek, TimetableData } from '../types/timetable';

/**
 * Generates and downloads a clean CSV file representing the timetable
 */
export function exportTimetableToCSV(timetable: TimetableData): void {
  const { config, grid, slotTimings } = timetable;

  // Header row: College and Class info
  const lines: string[] = [];
  lines.push(`"${config.collegeName.replace(/"/g, '""')}"`);
  lines.push(`"Department: ${config.department.replace(/"/g, '""')} | Semester: ${config.semester} | Section: ${config.section}"`);
  lines.push(`"Generated On: ${timetable.generatedAt}"`);
  lines.push(''); // blank line

  // Column Headers: Day, Period 1 (Time), Period 2 (Time), [Break (Time)], ...
  const headers = ['Day'];
  for (const slot of slotTimings) {
    if (slot.isBreak) {
      headers.push(`[${slot.breakName} (${slot.startTime}-${slot.endTime})]`);
    } else {
      headers.push(`Period ${slot.periodNumber} (${slot.startTime}-${slot.endTime})`);
    }
  }
  lines.push(headers.map((h) => `"${h}"`).join(','));

  // Data rows for each working day
  for (const day of config.workingDays) {
    const rowValues: string[] = [day];

    for (const slot of slotTimings) {
      if (slot.isBreak) {
        rowValues.push(slot.breakName || 'Break');
      } else {
        const cell = grid[day]?.[slot.periodNumber];
        if (cell && cell.type !== 'empty') {
          const detail = `${cell.subjectName} (${cell.subjectCode}) | ${cell.facultyName || 'Staff'} | ${cell.room || 'Room'}`;
          rowValues.push(detail);
        } else {
          rowValues.push('Free / Self Study');
        }
      }
    }

    lines.push(rowValues.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(','));
  }

  // Create downloadable blob
  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = `${config.collegeName.replace(/[^a-zA-Z0-9]/g, '_')}_${config.semester}_Timetable.csv`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all configuration and generated timetable as a JSON file
 */
export function exportTimetableToJSON(timetable: TimetableData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(timetable, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  const safeFilename = `${timetable.config.collegeName.replace(/[^a-zA-Z0-9]/g, '_')}_timetable_backup.json`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers standard browser window.print()
 */
export function triggerPrintTimetable(): void {
  window.print();
}
