import React, { useState } from 'react';
import { TimetableData, Subject, DayOfWeek } from '../types/timetable';
import { Users, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface FacultyScheduleViewProps {
  timetable: TimetableData;
  subjects: Subject[];
}

export const FacultyScheduleView: React.FC<FacultyScheduleViewProps> = ({
  timetable,
  subjects,
}) => {
  const { config, grid, slotTimings } = timetable;

  // Extract unique faculty names
  const allFaculties = Array.from(
    new Set(subjects.map((s) => s.facultyName.trim()).filter((f) => f && f !== 'Unassigned Faculty'))
  ).sort();

  const [selectedFaculty, setSelectedFaculty] = useState<string>(
    allFaculties[0] || ''
  );

  if (allFaculties.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm">No faculty members found in the current subject list.</p>
      </div>
    );
  }

  // Calculate statistics for the selected faculty
  let totalPeriodsTaught = 0;
  const dayLoads: Record<DayOfWeek, number> = {} as any;
  for (const day of config.workingDays) {
    dayLoads[day] = 0;
    for (let p = 1; p <= config.periodsPerDay; p++) {
      const cell = grid[day]?.[p];
      if (cell && cell.facultyName.toLowerCase() === selectedFaculty.toLowerCase()) {
        totalPeriodsTaught++;
        dayLoads[day]++;
      }
    }
  }

  const totalTeachingMinutes = totalPeriodsTaught * config.periodDuration;
  const totalHours = (totalTeachingMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Faculty Selector & Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {selectedFaculty
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <label htmlFor="faculty-select" className="text-xs font-medium text-slate-500 block mb-1">
                Select Instructor / Faculty Member:
              </label>
              <select
                id="faculty-select"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {allFaculties.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900">
              <span className="text-[10px] uppercase font-bold text-indigo-500 block">
                Total Teaching Periods
              </span>
              <span className="text-base font-bold font-mono">
                {totalPeriodsTaught} Periods / week
              </span>
            </div>

            <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                Total Teaching Hours
              </span>
              <span className="text-base font-bold font-mono">
                {totalHours} Hours / week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Faculty Weekly Timetable */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Weekly Schedule: {selectedFaculty}</span>
          </h4>
          <span className="text-xs text-slate-400">
            {config.department} • {config.collegeName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[850px] text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-4 text-left font-bold text-slate-200 uppercase tracking-wider text-[11px] w-28 sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                  Day
                </th>
                {slotTimings.map((slot, sIdx) => {
                  if (slot.isBreak) {
                    return (
                      <th
                        key={`f-break-${sIdx}`}
                        className="py-3 px-2 text-center text-[10px] font-bold uppercase tracking-wider w-16 bg-slate-800/80 text-slate-300 border-r border-slate-700"
                      >
                        {slot.breakName}
                      </th>
                    );
                  }
                  return (
                    <th
                      key={`f-p-${slot.periodNumber}`}
                      className="py-3 px-2 text-center font-bold text-[11px] border-r border-slate-800"
                    >
                      <div>Period {slot.periodNumber}</div>
                      <div className="font-mono text-[9px] text-indigo-300 font-normal">
                        {slot.startTime}–{slot.endTime}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {config.workingDays.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800 bg-slate-50 sticky left-0 z-10 border-r border-slate-200">
                    <div>{day}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {dayLoads[day]} period(s)
                    </div>
                  </td>

                  {slotTimings.map((slot, sIdx) => {
                    if (slot.isBreak) {
                      return (
                        <td
                          key={`f-break-c-${day}-${sIdx}`}
                          className="text-center align-middle bg-slate-100/60 text-slate-400 border-r border-slate-200 text-[10px]"
                        >
                          -
                        </td>
                      );
                    }

                    const cell = grid[day]?.[slot.periodNumber];
                    const isTeaching =
                      cell &&
                      cell.facultyName.toLowerCase() === selectedFaculty.toLowerCase();

                    if (!isTeaching) {
                      return (
                        <td
                          key={`f-cell-free-${day}-${slot.periodNumber}`}
                          className="border-r border-slate-200 p-2 text-center text-slate-300 bg-white"
                        >
                          <span className="text-[11px] text-slate-400 italic">Free</span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`f-cell-${day}-${slot.periodNumber}`}
                        className="p-1.5 border-r border-slate-200 align-top bg-indigo-50/40"
                      >
                        <div
                          className="rounded-lg p-2 border shadow-2xs"
                          style={{
                            backgroundColor: `${cell.color}18`,
                            borderColor: `${cell.color}55`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-[11px] text-slate-800">
                              {cell.subjectCode}
                            </span>
                            <span className="text-[9px] font-mono bg-white px-1 py-0.2 rounded border text-slate-500">
                              {cell.room}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-800 line-clamp-1">
                            {cell.subjectName}
                          </p>
                          <div className="mt-1 text-[9px] font-medium text-indigo-700 capitalize">
                            Class: {config.section} ({cell.type})
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
