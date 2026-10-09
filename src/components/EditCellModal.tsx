import React, { useState } from 'react';
import { Subject, TimetableCell } from '../types/timetable';
import { X, Check, Trash2, ArrowLeftRight } from 'lucide-react';

interface EditCellModalProps {
  cell: TimetableCell;
  subjects: Subject[];
  onSave: (updatedCell: TimetableCell) => void;
  onStartSwap: (cell: TimetableCell) => void;
  onClear: (cellId: string) => void;
  onClose: () => void;
}

export const EditCellModal: React.FC<EditCellModalProps> = ({
  cell,
  subjects,
  onSave,
  onStartSwap,
  onClear,
  onClose,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(cell.subjectId || '');
  const [facultyName, setFacultyName] = useState<string>(cell.facultyName || '');
  const [room, setRoom] = useState<string>(cell.room || '');

  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);
    if (!subId) {
      setFacultyName('');
      setRoom('');
      return;
    }
    const found = subjects.find((s) => s.id === subId);
    if (found) {
      setFacultyName(found.facultyName);
      setRoom(found.room);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      onClear(cell.id);
      onClose();
      return;
    }

    const found = subjects.find((s) => s.id === selectedSubjectId);
    if (found) {
      onSave({
        ...cell,
        subjectId: found.id,
        subjectName: found.name,
        subjectCode: found.code,
        facultyName: facultyName || found.facultyName,
        room: room || found.room,
        type: found.type,
        color: found.color,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Edit Slot: {cell.day} Period {cell.periodNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Change assigned subject or initiate a swap with another period
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assigned Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Free / Self Study Slot --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.facultyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Faculty Instructor
            </label>
            <input
              type="text"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              placeholder="e.g. Dr. Robert Vance"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Classroom / Laboratory Room
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Room 204 or Systems Lab"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onStartSwap(cell);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Swap with another slot</span>
              </button>

              {cell.type !== 'empty' && (
                <button
                  type="button"
                  onClick={() => {
                    onClear(cell.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
