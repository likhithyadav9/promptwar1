import React, { useState } from 'react';
import { Subject, SubjectType, CollegeConfig } from '../types/timetable';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  FlaskConical,
  GraduationCap,
  Sparkles,
  Users,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#64748b', // slate
];

interface SubjectManagerProps {
  subjects: Subject[];
  config: CollegeConfig;
  onChange: (updatedSubjects: Subject[]) => void;
  onGenerate: () => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  config,
  onChange,
  onGenerate,
}) => {
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [weeklyPeriods, setWeeklyPeriods] = useState<number>(4);
  const [type, setType] = useState<SubjectType>('theory');
  const [labDuration, setLabDuration] = useState<number>(3);
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Capacity calculation
  const totalWeeklySlots = config.workingDays.length * config.periodsPerDay;
  const totalRequiredPeriods = subjects.reduce((sum, s) => sum + (s.weeklyPeriods || 0), 0);
  const capacityDelta = totalWeeklySlots - totalRequiredPeriods;

  const openAddModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setFacultyName('');
    setWeeklyPeriods(4);
    setType('theory');
    setLabDuration(2);
    setRoom(config.defaultRoom || 'Room LH-101');
    setColor(PRESET_COLORS[subjects.length % PRESET_COLORS.length]);
    setIsEditingModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setCode(sub.code);
    setName(sub.name);
    setFacultyName(sub.facultyName);
    setWeeklyPeriods(sub.weeklyPeriods);
    setType(sub.type);
    setLabDuration(sub.labDuration || 2);
    setRoom(sub.room);
    setColor(sub.color || PRESET_COLORS[0]);
    setIsEditingModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSub: Subject = {
      id: editingSubject ? editingSubject.id : `sub_${Date.now()}`,
      code: code.trim().toUpperCase() || `SUB${subjects.length + 1}`,
      name: name.trim(),
      facultyName: facultyName.trim() || 'Unassigned Faculty',
      weeklyPeriods: Number(weeklyPeriods) || 1,
      type,
      labDuration: type === 'lab' ? Number(labDuration) || 2 : 1,
      room: room.trim() || config.defaultRoom || 'Lecture Hall',
      color,
    };

    if (editingSubject) {
      onChange(subjects.map((s) => (s.id === editingSubject.id ? newSub : s)));
    } else {
      onChange([...subjects, newSub]);
    }

    setIsEditingModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(subjects.filter((s) => s.id !== id));
  };

  // Group faculty workloads
  const facultyWorkload: Record<string, { totalPeriods: number; subjects: string[] }> = {};
  for (const s of subjects) {
    const f = s.facultyName || 'Unassigned';
    if (!facultyWorkload[f]) {
      facultyWorkload[f] = { totalPeriods: 0, subjects: [] };
    }
    facultyWorkload[f].totalPeriods += s.weeklyPeriods;
    facultyWorkload[f].subjects.push(s.code || s.name);
  }

  return (
    <div className="space-y-6">
      {/* Capacity & Quota Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Weekly Timetable Capacity Tracker</span>
            </h3>
            <p className="text-xs text-slate-500">
              {config.workingDays.length} working days × {config.periodsPerDay} periods/day = <strong>{totalWeeklySlots} total slots available</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                capacityDelta === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : capacityDelta > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {capacityDelta === 0
                ? '✓ 100% Perfectly Balanced'
                : capacityDelta > 0
                ? `${capacityDelta} Free Slots Remaining`
                : `⚠ Over Capacity by ${Math.abs(capacityDelta)} Periods`}
            </span>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Visual progress bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-300 ${
              totalRequiredPeriods > totalWeeklySlots ? 'bg-rose-500' : 'bg-indigo-600'
            }`}
            style={{
              width: `${Math.min(100, (totalRequiredPeriods / Math.max(1, totalWeeklySlots)) * 100)}%`,
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Required by subjects: <strong>{totalRequiredPeriods} periods</strong></span>
          <span>Max weekly capacity: <strong>{totalWeeklySlots} periods</strong></span>
        </div>

        {capacityDelta < 0 && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              <strong>Warning:</strong> You have assigned {totalRequiredPeriods} periods, but the timetable only has {totalWeeklySlots} slots. The generator cannot fit all subjects. Please reduce periods or add working days/periods.
            </span>
          </div>
        )}
      </div>

      {/* Main Subjects Table & Faculty Workload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subjects List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span>Configured Subjects & Labs</span>
                <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full">
                  {subjects.length} subjects
                </span>
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Subject / Code</th>
                    <th className="px-3 py-3">Faculty</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3 text-center">Periods/Wk</th>
                    <th className="px-3 py-3">Room</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No subjects added yet. Click &quot;Add Subject&quot; above to create one.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: sub.color }}
                            />
                            <div>
                              <div className="font-semibold text-slate-800 text-xs">
                                {sub.name}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {sub.code}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.facultyName}</span>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              sub.type === 'lab'
                                ? 'bg-purple-100 text-purple-700'
                                : sub.type === 'seminar'
                                ? 'bg-amber-100 text-amber-800'
                                : sub.type === 'tutorial'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sub.type === 'lab' && <FlaskConical className="w-3 h-3" />}
                            {sub.type === 'theory' && <BookOpen className="w-3 h-3" />}
                            {sub.type === 'seminar' && <Sparkles className="w-3 h-3" />}
                            {sub.type === 'tutorial' && <GraduationCap className="w-3 h-3" />}
                            <span className="capitalize">{sub.type}</span>
                            {sub.type === 'lab' && ` (${sub.labDuration}p block)`}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {sub.weeklyPeriods}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="text-slate-500 font-mono text-[11px]">
                            {sub.room || 'General'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(sub)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition"
                              title="Edit Subject"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sub.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Faculty Workload Breakdown */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Faculty Workload Allocation</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Total weekly periods assigned per instructor in this class:
            </p>

            <div className="space-y-3">
              {Object.entries(facultyWorkload).map(([name, data]) => {
                const percentage = Math.round((data.totalPeriods / totalWeeklySlots) * 100);
                return (
                  <div key={name} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800">{name}</span>
                      <span className="font-mono font-bold text-indigo-600">
                        {data.totalPeriods} periods/wk
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, percentage * 2)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      Assigned: {data.subjects.join(', ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Subject Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                {editingSubject ? 'Edit Subject Details' : 'Add New Subject / Laboratory'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CS501"
                    className="w-full text-xs font-mono uppercase rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Database Management Systems"
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assigned Faculty Name
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
                    Subject Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as SubjectType;
                      setType(newType);
                      if (newType === 'lab') {
                        setRoom('Computing Lab');
                      }
                    }}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="theory">Theory Lecture</option>
                    <option value="lab">Laboratory / Practical</option>
                    <option value="tutorial">Tutorial / Problem Solving</option>
                    <option value="seminar">Seminar / Workshop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Weekly Periods Required
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={weeklyPeriods}
                    onChange={(e) => setWeeklyPeriods(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {type === 'lab' ? (
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">
                      Consecutive Lab Duration
                    </label>
                    <select
                      value={labDuration}
                      onChange={(e) => setLabDuration(parseInt(e.target.value) || 2)}
                      className="w-full text-xs rounded-lg border border-purple-300 bg-purple-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={2}>2 Consecutive Periods</option>
                      <option value={3}>3 Consecutive Periods</option>
                      <option value={4}>4 Consecutive Periods</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Assigned Room / Hall
                    </label>
                    <input
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. Room 204"
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {type === 'lab' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Laboratory Room
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Systems & Database Lab 2"
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Color swatch selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Highlight Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        color === c ? 'ring-2 ring-indigo-600 scale-110 shadow-sm' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
                >
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
