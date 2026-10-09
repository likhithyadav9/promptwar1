import React from 'react';
import { TimetableData, Subject } from '../types/timetable';
import { Printer, ArrowLeft } from 'lucide-react';
import { triggerPrintTimetable } from '../utils/exportUtils';

interface PrintViewProps {
  timetable: TimetableData;
  subjects: Subject[];
  onBack: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({
  timetable,
  subjects,
  onBack,
}) => {
  const { config, grid, slotTimings } = timetable;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6">
      {/* On-Screen Action Toolbar (Hidden in Print) */}
      <div className="max-w-6xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Generator</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Landscape print orientation recommended for best fit
          </span>
        </div>

        <button
          type="button"
          onClick={triggerPrintTimetable}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Academic Print Sheet */}
      <div className="max-w-6xl mx-auto bg-white p-8 md:p-10 border border-slate-300 rounded-xl shadow-lg print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Header Block */}
        <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
            {config.collegeName}
          </h1>
          <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider mt-1">
            Department of {config.department}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600 mt-2">
            <span><strong>Academic Year:</strong> {config.academicYear}</span>
            <span>•</span>
            <span><strong>Semester:</strong> {config.semester}</span>
            <span>•</span>
            <span><strong>Section:</strong> {config.section}</span>
            <span>•</span>
            <span><strong>Room:</strong> {config.defaultRoom}</span>
            <span>•</span>
            <span><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Timetable Matrix */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border-2 border-slate-900 text-xs text-slate-800">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900">
                <th className="border border-slate-800 p-2 font-bold uppercase text-[11px] text-center w-24">
                  Day / Period
                </th>
                {slotTimings.map((slot, idx) => {
                  if (slot.isBreak) {
                    return (
                      <th
                        key={`print-th-brk-${idx}`}
                        className="border border-slate-800 p-2 font-bold text-center text-[10px] uppercase bg-slate-200 text-slate-700 w-16"
                      >
                        <div>{slot.breakName}</div>
                        <div className="font-mono text-[9px] font-normal">
                          {slot.startTime}–{slot.endTime}
                        </div>
                      </th>
                    );
                  }

                  return (
                    <th
                      key={`print-th-p-${slot.periodNumber}`}
                      className="border border-slate-800 p-2 font-bold text-center text-[11px] bg-slate-50"
                    >
                      <div>Period {slot.periodNumber}</div>
                      <div className="font-mono text-[10px] font-normal text-slate-600">
                        {slot.startTime} – {slot.endTime}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {config.workingDays.map((day) => (
                <tr key={`print-row-${day}`} className="border-b border-slate-800">
                  <td className="border border-slate-800 p-2.5 font-bold uppercase text-center bg-slate-50 text-[11px]">
                    {day}
                  </td>

                  {slotTimings.map((slot, sIdx) => {
                    if (slot.isBreak) {
                      return (
                        <td
                          key={`print-brk-c-${day}-${sIdx}`}
                          className="border border-slate-800 p-1 text-center bg-slate-100 text-[10px] text-slate-500 font-bold"
                        >
                          <div className="rotate-180 [writing-mode:vertical-rl] mx-auto py-1 tracking-widest uppercase">
                            {slot.breakName}
                          </div>
                        </td>
                      );
                    }

                    const cell = grid[day]?.[slot.periodNumber];
                    if (!cell || cell.type === 'empty') {
                      return (
                        <td
                          key={`print-cell-free-${day}-${slot.periodNumber}`}
                          className="border border-slate-800 p-2 text-center text-slate-400 italic text-[10px]"
                        >
                          Free / Library
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`print-cell-${day}-${slot.periodNumber}`}
                        className="border border-slate-800 p-2 align-top text-center"
                      >
                        <div className="font-bold text-slate-900 text-xs">
                          {cell.subjectCode}
                        </div>
                        <div className="text-[10px] text-slate-700 font-medium line-clamp-2 leading-tight">
                          {cell.subjectName}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1 italic">
                          {cell.facultyName}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">
                          [{cell.room}]
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subjects & Faculty Legend */}
        <div className="mt-6 pt-4 border-t-2 border-slate-900">
          <h2 className="text-xs font-bold uppercase text-slate-900 tracking-wider mb-2">
            Subject &amp; Faculty Allocation Legend:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-2 border border-slate-300 rounded bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900 mr-1.5">
                    {sub.code}:
                  </span>
                  <span className="text-slate-800 font-medium">{sub.name}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                  <span>Faculty: <strong>{sub.facultyName}</strong></span>
                  <span className="font-mono">({sub.weeklyPeriods}p/wk)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Sign-off Block */}
        <div className="mt-12 pt-8 border-t border-slate-400 grid grid-cols-3 text-center text-xs font-semibold text-slate-800">
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mx-6 mb-2"></div>
            <p>Timetable In-Charge</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mx-6 mb-2"></div>
            <p>Head of Department (HOD)</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mx-6 mb-2"></div>
            <p>Principal / Dean of Academics</p>
          </div>
        </div>
      </div>
    </div>
  );
};
