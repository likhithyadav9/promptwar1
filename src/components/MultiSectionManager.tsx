import React from 'react';
import {
  CollegeConfig,
  TimetableData,
  DayOfWeek,
} from '../types/timetable';
import { Layers, ShieldCheck, AlertTriangle, Users, Sparkles } from 'lucide-react';

interface MultiSectionManagerProps {
  sectionAName: string;
  sectionBName: string;
  activeSection: 'A' | 'B';
  onSwitchSection: (sec: 'A' | 'B') => void;
  timetableA: TimetableData | null;
  timetableB: TimetableData | null;
  onGenerateSectionB: () => void;
  configA: CollegeConfig;
}

export const MultiSectionManager: React.FC<MultiSectionManagerProps> = ({
  sectionAName,
  sectionBName,
  activeSection,
  onSwitchSection,
  timetableA,
  timetableB,
  onGenerateSectionB,
  configA,
}) => {
  // Check cross-section faculty clashes
  const crossSectionClashes: {
    faculty: string;
    day: DayOfWeek;
    period: number;
    subjectA: string;
    subjectB: string;
  }[] = [];

  if (timetableA && timetableB) {
    for (const day of configA.workingDays) {
      for (let p = 1; p <= configA.periodsPerDay; p++) {
        const cellA = timetableA.grid[day]?.[p];
        const cellB = timetableB.grid[day]?.[p];

        if (
          cellA &&
          cellB &&
          cellA.type !== 'empty' &&
          cellB.type !== 'empty' &&
          cellA.facultyName &&
          cellB.facultyName &&
          cellA.facultyName.toLowerCase() === cellB.facultyName.toLowerCase()
        ) {
          crossSectionClashes.push({
            faculty: cellA.facultyName,
            day,
            period: p,
            subjectA: cellA.subjectName,
            subjectB: cellB.subjectName,
          });
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Multi-Class Faculty Clash Prevention Hub
              </h3>
              <p className="text-xs text-slate-500">
                Manage Section A &amp; Section B simultaneously to ensure no faculty is scheduled in two classrooms at the same time.
              </p>
            </div>
          </div>

          {/* Section Switcher Buttons */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => onSwitchSection('A')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeSection === 'A'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editing: {sectionAName}
            </button>
            <button
              type="button"
              onClick={() => onSwitchSection('B')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeSection === 'B'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editing: {sectionBName}
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Class Clash Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cross-Section Faculty Clash Verification</span>
        </h4>

        {crossSectionClashes.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">Zero Double-Booking Clashes</p>
                <p className="text-emerald-700">
                  Shared faculty members between {sectionAName} and {sectionBName} are safely scheduled in non-overlapping time slots.
                </p>
              </div>
            </div>
            <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px]">
              Verified Safe
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                {crossSectionClashes.length} Simultaneous Faculty Double-Booking Clash(es) Found!
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-2 text-rose-700">
              {crossSectionClashes.map((c, i) => (
                <li key={i}>
                  <strong>{c.faculty}</strong> is scheduled in both{' '}
                  <span className="font-semibold">{sectionAName}</span> ({c.subjectA}) and{' '}
                  <span className="font-semibold">{sectionBName}</span> ({c.subjectB}) on{' '}
                  <span className="font-semibold">{c.day} Period {c.period}</span>!
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Generate {sectionBName} with automatic clash avoidance based on {sectionAName}&apos;s schedule:
          </p>
          <button
            type="button"
            onClick={onGenerateSectionB}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Generate {sectionBName} (Clash-Free)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
