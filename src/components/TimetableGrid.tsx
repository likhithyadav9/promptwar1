import React, { useState } from 'react';
import {
  DayOfWeek,
  TimetableCell,
  TimetableData,
  Subject,
} from '../types/timetable';
import { EditCellModal } from './EditCellModal';
import {
  RotateCcw,
  Sparkles,
  Printer,
  Download,
  ArrowLeftRight,
  Utensils,
  Coffee,
  FlaskConical,
  BookOpen,
  Sparkles as SparkleIcon,
  GraduationCap,
  Calendar,
} from 'lucide-react';

interface TimetableGridProps {
  timetable: TimetableData;
  subjects: Subject[];
  onUpdateGrid: (newGrid: Record<DayOfWeek, Record<number, TimetableCell>>) => void;
  onRegenerate: () => void;
  onPrint: () => void;
  onExportCSV: () => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  subjects,
  onUpdateGrid,
  onRegenerate,
  onPrint,
  onExportCSV,
}) => {
  const { config, grid, slotTimings } = timetable;

  const [selectedCellForEdit, setSelectedCellForEdit] = useState<TimetableCell | null>(null);
  const [swapSourceCell, setSwapSourceCell] = useState<TimetableCell | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // Handle cell click
  const handleCellClick = (cell: TimetableCell) => {
    if (swapSourceCell) {
      if (swapSourceCell.id === cell.id) {
        // Cancel swap
        setSwapSourceCell(null);
        return;
      }
      // Execute Swap!
      executeSwap(swapSourceCell, cell);
      setSwapSourceCell(null);
    } else {
      setSelectedCellForEdit(cell);
    }
  };

  const executeSwap = (cellA: TimetableCell, cellB: TimetableCell) => {
    const newGrid = JSON.parse(JSON.stringify(grid)) as Record<DayOfWeek, Record<number, TimetableCell>>;

    // Swap content while preserving day & periodNumber & id
    const tempSubjectId = cellA.subjectId;
    const tempSubjectName = cellA.subjectName;
    const tempSubjectCode = cellA.subjectCode;
    const tempFacultyName = cellA.facultyName;
    const tempRoom = cellA.room;
    const tempType = cellA.type;
    const tempColor = cellA.color;

    newGrid[cellA.day][cellA.periodNumber] = {
      ...cellA,
      subjectId: cellB.subjectId,
      subjectName: cellB.subjectName,
      subjectCode: cellB.subjectCode,
      facultyName: cellB.facultyName,
      room: cellB.room,
      type: cellB.type,
      color: cellB.color,
    };

    newGrid[cellB.day][cellB.periodNumber] = {
      ...cellB,
      subjectId: tempSubjectId,
      subjectName: tempSubjectName,
      subjectCode: tempSubjectCode,
      facultyName: tempFacultyName,
      room: tempRoom,
      type: tempType,
      color: tempColor,
    };

    onUpdateGrid(newGrid);
  };

  const handleSaveCell = (updatedCell: TimetableCell) => {
    const newGrid = { ...grid };
    newGrid[updatedCell.day] = {
      ...newGrid[updatedCell.day],
      [updatedCell.periodNumber]: updatedCell,
    };
    onUpdateGrid(newGrid);
  };

  const handleClearCell = (cellId: string) => {
    const [day, pStr] = cellId.split('-p');
    const pNum = parseInt(pStr);
    const dayTyped = day as DayOfWeek;

    const newGrid = { ...grid };
    newGrid[dayTyped] = {
      ...newGrid[dayTyped],
      [pNum]: {
        id: cellId,
        day: dayTyped,
        periodNumber: pNum,
        subjectId: null,
        subjectName: 'Free / Self Study',
        subjectCode: '',
        facultyName: '',
        room: config.defaultRoom || 'Classroom',
        type: 'empty',
        color: '#f8fafc',
      },
    };
    onUpdateGrid(newGrid);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {config.collegeName}
            </h2>
            <p className="text-xs text-slate-500">
              {config.department} • {config.semester} • {config.section} ({config.academicYear})
            </p>
          </div>
        </div>

        {/* Action Buttons & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter by Subject highlight */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Highlight:</span>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            title="Re-run scheduling engine for an alternative valid permutation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Shuffle & Regenerate</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print View</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Swap Mode Notification Bar */}
      {swapSourceCell && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-200 animate-pulse" />
            <span>
              <strong>Swap Mode Active:</strong> Selected{' '}
              <span className="underline font-semibold">
                {swapSourceCell.day} Period {swapSourceCell.periodNumber} ({swapSourceCell.subjectName})
              </span>
              . Now click any other period slot in the grid to swap positions!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSwapSourceCell(null)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-semibold transition cursor-pointer"
          >
            Cancel Swap
          </button>
        </div>
      )}

      {/* Main Timetable Grid Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <table className="w-full border-collapse min-w-[900px] text-xs">
            {/* Header: Periods & Breaks */}
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-4 text-left font-bold text-slate-200 uppercase tracking-wider text-[11px] w-28 sticky left-0 bg-slate-900 z-10 border-r border-slate-800 shadow-xs">
                  Day / Time
                </th>
                {slotTimings.map((slot, sIdx) => {
                  if (slot.isBreak) {
                    return (
                      <th
                        key={`th-break-${sIdx}`}
                        className={`py-3 px-2 text-center font-bold text-[10px] uppercase tracking-wider w-20 border-r border-slate-800 ${
                          slot.breakType === 'lunch'
                            ? 'bg-amber-950/80 text-amber-200'
                            : 'bg-blue-950/80 text-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {slot.breakType === 'lunch' ? (
                            <Utensils className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Coffee className="w-3 h-3 text-blue-400" />
                          )}
                          <span>{slot.breakName}</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-300 font-normal">
                          {slot.startTime}–{slot.endTime}
                        </div>
                      </th>
                    );
                  }

                  return (
                    <th
                      key={`th-period-${slot.periodNumber}`}
                      className="py-3 px-2 text-center font-bold text-[11px] border-r border-slate-800 min-w-[125px]"
                    >
                      <div className="text-white font-semibold">
                        Period {slot.periodNumber}
                      </div>
                      <div className="font-mono text-[10px] text-indigo-300 font-normal">
                        {slot.startTime} – {slot.endTime}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Timetable Rows: Working Days */}
            <tbody className="divide-y divide-slate-200">
              {config.workingDays.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 transition">
                  {/* Sticky Day Column */}
                  <td className="py-4 px-4 font-bold text-slate-800 bg-slate-50/90 sticky left-0 z-10 border-r border-slate-200 shadow-xs">
                    <div className="text-xs uppercase tracking-wide text-indigo-900">
                      {day}
                    </div>
                    <div className="text-[10px] font-normal text-slate-500">
                      {config.periodsPerDay} periods
                    </div>
                  </td>

                  {/* Period Cells & Breaks */}
                  {slotTimings.map((slot, sIdx) => {
                    if (slot.isBreak) {
                      return (
                        <td
                          key={`cell-break-${day}-${sIdx}`}
                          className={`text-center align-middle border-r border-slate-200 px-1 py-2 ${
                            slot.breakType === 'lunch'
                              ? 'bg-amber-50/60 text-amber-800'
                              : 'bg-blue-50/60 text-blue-800'
                          }`}
                        >
                          <div className="rotate-180 [writing-mode:vertical-rl] mx-auto text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1.5 py-2">
                            <span>{slot.breakName}</span>
                          </div>
                        </td>
                      );
                    }

                    const cell = grid[day]?.[slot.periodNumber];
                    if (!cell) {
                      return (
                        <td
                          key={`cell-empty-${day}-${slot.periodNumber}`}
                          className="border-r border-slate-200 p-2 text-center text-slate-400"
                        >
                          -
                        </td>
                      );
                    }

                    const isHighlighted =
                      filterSubjectId === 'all' || cell.subjectId === filterSubjectId;
                    const isSelectedForSwap = swapSourceCell?.id === cell.id;

                    const isEmpty = cell.type === 'empty';

                    return (
                      <td
                        key={cell.id}
                        onClick={() => handleCellClick(cell)}
                        className={`p-1.5 border-r border-slate-200 align-top transition cursor-pointer select-none ${
                          isSelectedForSwap
                            ? 'ring-2 ring-indigo-600 bg-indigo-50'
                            : !isHighlighted
                            ? 'opacity-35 grayscale'
                            : 'hover:bg-indigo-50/30'
                        }`}
                      >
                        {isEmpty ? (
                          <div className="h-24 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition group">
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 transition">
                              + Assign Slot
                            </span>
                            <span className="text-[9px] text-slate-400">
                              Free / Self Study
                            </span>
                          </div>
                        ) : (
                          <div
                            className="h-24 rounded-lg p-2.5 flex flex-col justify-between border shadow-2xs transition hover:shadow-xs relative overflow-hidden"
                            style={{
                              backgroundColor: `${cell.color}14`, // subtle background tint
                              borderColor: `${cell.color}45`,
                            }}
                          >
                            {/* Left vertical color accent strip */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                              style={{ backgroundColor: cell.color }}
                            />

                            {/* Top row: Subject Code & Type badge */}
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-mono font-bold text-[11px] text-slate-800 truncate">
                                  {cell.subjectCode}
                                </span>
                                {cell.type === 'lab' && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                                    <FlaskConical className="w-2.5 h-2.5" />
                                    LAB {cell.labSpan ? `(${cell.labSpan}p)` : ''}
                                  </span>
                                )}
                                {cell.type === 'seminar' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                                    SEM
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-slate-900 line-clamp-1 leading-tight" title={cell.subjectName}>
                                {cell.subjectName}
                              </p>
                            </div>

                            {/* Bottom row: Faculty & Room */}
                            <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-600">
                              <span className="truncate max-w-[85px] font-medium" title={cell.facultyName}>
                                {cell.facultyName || 'Staff'}
                              </span>
                              <span className="font-mono text-[9px] bg-white/80 px-1 py-0.2 rounded border border-slate-200 text-slate-500">
                                {cell.room || 'LH'}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timetable Footer Stats */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Assigned Slots: <strong>{timetable.stats.assignedSlots}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Free / Self-Study Slots: <strong>{timetable.stats.emptySlots}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Total Available: <strong>{timetable.stats.totalWeeklySlots}</strong></span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Tip: Click any cell to customize, edit faculty/room, or swap with another period.
          </div>
        </div>
      </div>

      {/* Edit Cell Modal */}
      {selectedCellForEdit && (
        <EditCellModal
          cell={selectedCellForEdit}
          subjects={subjects}
          onSave={handleSaveCell}
          onStartSwap={(c) => setSwapSourceCell(c)}
          onClear={handleClearCell}
          onClose={() => setSelectedCellForEdit(null)}
        />
      )}
    </div>
  );
};
