import React, { useId } from 'react';
import {
  CollegeConfig,
  DayOfWeek,
  ALL_DAYS,
  BreakConfig,
} from '../types/timetable';
import {
  calculateCalculatedEndTime,
  calculateSlotTimings,
} from '../utils/timeUtils';
import {
  Building2,
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Coffee,
  Utensils,
  CheckCircle2,
} from 'lucide-react';

interface ConfigFormProps {
  config: CollegeConfig;
  onChange: (updated: CollegeConfig) => void;
  onGenerate: () => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({
  config,
  onChange,
  onGenerate,
}) => {
  const collegeNameId = useId();
  const departmentId = useId();
  const semesterId = useId();
  const academicYearId = useId();
  const sectionId = useId();
  const defaultRoomId = useId();
  const startTimeId = useId();
  const targetEndTimeId = useId();
  const periodsPerDayId = useId();
  const periodDurationId = useId();

  // Calculated timings
  const { calculatedTime12, calculatedTime24, totalDurationMinutes } =
    calculateCalculatedEndTime(config);
  const slots = calculateSlotTimings(
    config.startTime,
    config.periodDuration,
    config.periodsPerDay,
    config.breaks
  );

  const toggleDay = (day: DayOfWeek) => {
    const isSelected = config.workingDays.includes(day);
    let updated: DayOfWeek[];
    if (isSelected) {
      if (config.workingDays.length <= 1) return; // Keep at least one day
      updated = config.workingDays.filter((d) => d !== day);
    } else {
      // Keep day order
      updated = ALL_DAYS.filter((d) => config.workingDays.includes(d) || d === day);
    }
    onChange({ ...config, workingDays: updated });
  };

  const handleBreakChange = (
    index: number,
    field: keyof BreakConfig,
    value: any
  ) => {
    const updatedBreaks = [...config.breaks];
    updatedBreaks[index] = {
      ...updatedBreaks[index],
      [field]: value,
    };
    onChange({ ...config, breaks: updatedBreaks });
  };

  const addBreak = (type: 'short' | 'lunch') => {
    const newBreak: BreakConfig = {
      id: `brk-${Date.now()}`,
      name: type === 'lunch' ? 'Lunch Break' : 'Short Break',
      afterPeriod: Math.min(
        type === 'lunch' ? Math.floor(config.periodsPerDay / 2) : 2,
        Math.max(1, config.periodsPerDay - 1)
      ),
      duration: type === 'lunch' ? 45 : 15,
      type,
    };
    onChange({ ...config, breaks: [...config.breaks, newBreak] });
  };

  const removeBreak = (index: number) => {
    const updatedBreaks = config.breaks.filter((_, i) => i !== index);
    onChange({ ...config, breaks: updatedBreaks });
  };

  const syncEndTime = () => {
    onChange({ ...config, targetEndTime: calculatedTime24 });
  };

  const timeDiffMinutes = (() => {
    const [th, tm] = config.targetEndTime.split(':').map(Number);
    const [ch, cm] = calculatedTime24.split(':').map(Number);
    const targetMin = th * 60 + tm;
    const calcMin = ch * 60 + cm;
    return targetMin - calcMin;
  })();

  return (
    <div className="space-y-6">
      {/* Overview Cards / Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            {config.periodsPerDay}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Periods Per Day
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {config.periodsPerDay} Periods / {config.periodDuration}m each
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            {config.workingDays.length}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Working Days
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {config.workingDays.length} Days ({config.workingDays.length * config.periodsPerDay} Slots/wk)
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Calculated Closing
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {calculatedTime12}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            {config.breaks.length}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Breaks Configured
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {config.breaks.filter((b) => b.type === 'lunch').length} Lunch,{' '}
              {config.breaks.filter((b) => b.type === 'short').length} Short
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: College & Academic Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-800">
                1. College & Class Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor={collegeNameId} className="block text-xs font-medium text-slate-700 mb-1">
                  College / Institution Name
                </label>
                <input
                  id={collegeNameId}
                  type="text"
                  value={config.collegeName}
                  onChange={(e) =>
                    onChange({ ...config, collegeName: e.target.value })
                  }
                  placeholder="e.g. Apex Institute of Technology & Engineering"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor={departmentId} className="block text-xs font-medium text-slate-700 mb-1">
                  Department
                </label>
                <input
                  id={departmentId}
                  type="text"
                  value={config.department}
                  onChange={(e) =>
                    onChange({ ...config, department: e.target.value })
                  }
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor={semesterId} className="block text-xs font-medium text-slate-700 mb-1">
                  Semester / Year
                </label>
                <input
                  id={semesterId}
                  type="text"
                  value={config.semester}
                  onChange={(e) =>
                    onChange({ ...config, semester: e.target.value })
                  }
                  placeholder="e.g. Semester 5"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor={sectionId} className="block text-xs font-medium text-slate-700 mb-1">
                  Section / Batch
                </label>
                <input
                  id={sectionId}
                  type="text"
                  value={config.section}
                  onChange={(e) =>
                    onChange({ ...config, section: e.target.value })
                  }
                  placeholder="e.g. Section A"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor={academicYearId} className="block text-xs font-medium text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  id={academicYearId}
                  type="text"
                  value={config.academicYear}
                  onChange={(e) =>
                    onChange({ ...config, academicYear: e.target.value })
                  }
                  placeholder="e.g. 2026-2027"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={defaultRoomId} className="block text-xs font-medium text-slate-700 mb-1">
                  Default Classroom / Lecture Hall
                </label>
                <input
                  id={defaultRoomId}
                  type="text"
                  value={config.defaultRoom}
                  onChange={(e) =>
                    onChange({ ...config, defaultRoom: e.target.value })
                  }
                  placeholder="e.g. Room LH-201 or Hall B"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Working Days */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-800">
                2. Working Days
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Select which days of the week classes are held:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = config.workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium border flex flex-col items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.slice(0, 3)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isSelected ? 'Active' : 'Off'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Daily Timing & Periods */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-800">
                3. Daily Hours & Dynamic Periods
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={startTimeId} className="block text-xs font-medium text-slate-700 mb-1">
                  College Start Time
                </label>
                <input
                  id={startTimeId}
                  type="time"
                  value={config.startTime}
                  onChange={(e) =>
                    onChange({ ...config, startTime: e.target.value })
                  }
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={targetEndTimeId} className="block text-xs font-medium text-slate-700">
                    College Closing Time
                  </label>
                  {timeDiffMinutes !== 0 && (
                    <button
                      type="button"
                      onClick={syncEndTime}
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sync with calculated ({calculatedTime24})</span>
                    </button>
                  )}
                </div>
                <input
                  id={targetEndTimeId}
                  type="time"
                  value={config.targetEndTime}
                  onChange={(e) =>
                    onChange({ ...config, targetEndTime: e.target.value })
                  }
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Number of periods */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={periodsPerDayId} className="block text-xs font-medium text-slate-700">
                    Number of Periods Per Day
                  </label>
                  <span className="text-xs font-bold text-indigo-600">
                    {config.periodsPerDay} Periods
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={periodsPerDayId}
                    type="number"
                    min={4}
                    max={12}
                    value={config.periodsPerDay}
                    onChange={(e) => {
                      const val = Math.max(4, Math.min(12, parseInt(e.target.value) || 4));
                      onChange({ ...config, periodsPerDay: val });
                    }}
                    className="w-20 text-sm font-semibold text-center rounded-lg border border-slate-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Quick period buttons: 6, 7, 8, 9 */}
                  <div className="flex gap-1 flex-1">
                    {[6, 7, 8, 9].map((pNum) => (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => onChange({ ...config, periodsPerDay: pNum })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition ${
                          config.periodsPerDay === pNum
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {pNum}p
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Period duration */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={periodDurationId} className="block text-xs font-medium text-slate-700">
                    Duration of Each Period
                  </label>
                  <span className="text-xs font-bold text-indigo-600">
                    {config.periodDuration} Minutes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={periodDurationId}
                    type="number"
                    min={20}
                    max={120}
                    step={5}
                    value={config.periodDuration}
                    onChange={(e) => {
                      const val = Math.max(20, Math.min(120, parseInt(e.target.value) || 45));
                      onChange({ ...config, periodDuration: val });
                    }}
                    className="w-24 text-sm font-semibold text-center rounded-lg border border-slate-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Quick duration buttons: 45m, 50m, 55m, 60m */}
                  <div className="flex gap-1 flex-1">
                    {[45, 50, 55, 60].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => onChange({ ...config, periodDuration: dur })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition ${
                          config.periodDuration === dur
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {dur}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Time mismatch note */}
            {timeDiffMinutes !== 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Closing Time Adjustment Note:</p>
                  <p>
                    With {config.periodsPerDay} periods ({config.periodDuration}m) + breaks, your college day calculated end time is <strong>{calculatedTime12}</strong> ({calculatedTime24}).
                    Your entered closing time is <strong>{config.targetEndTime}</strong> ({Math.abs(timeDiffMinutes)} minutes {timeDiffMinutes > 0 ? 'later' : 'earlier'}).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Breaks Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-800">
                  4. Lunch & Short Breaks
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addBreak('short')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>+ Short Break</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBreak('lunch')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Lunch Break</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {config.breaks.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">
                  No breaks added yet. Add a short break or lunch break above.
                </p>
              ) : (
                config.breaks.map((brk, idx) => (
                  <div
                    key={brk.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/70"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center ${
                          brk.type === 'lunch'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {brk.type === 'lunch' ? (
                          <Utensils className="w-4 h-4" />
                        ) : (
                          <Coffee className="w-4 h-4" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={brk.name}
                        onChange={(e) =>
                          handleBreakChange(idx, 'name', e.target.value)
                        }
                        placeholder="Break Name"
                        className="text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-1">
                      <span>After Period</span>
                      <select
                        aria-label={`After period for ${brk.name || 'break'}`}
                        value={brk.afterPeriod}
                        onChange={(e) =>
                          handleBreakChange(idx, 'afterPeriod', parseInt(e.target.value) || 1)
                        }
                        className="bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {Array.from({ length: config.periodsPerDay - 1 }, (_, i) => i + 1).map((p) => (
                          <option key={p} value={p}>
                            Period {p}
                          </option>
                        ))}
                      </select>

                      <span className="ml-2">Duration:</span>
                      <input
                        aria-label={`Duration for ${brk.name || 'break'}`}
                        type="number"
                        min={5}
                        max={120}
                        step={5}
                        value={brk.duration}
                        onChange={(e) =>
                          handleBreakChange(idx, 'duration', parseInt(e.target.value) || 15)
                        }
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-semibold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span>mins</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBreak(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition self-end sm:self-center"
                      title="Delete break"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Timeline of Period Timings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Daily Period Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated automatically from your settings
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {Math.floor(totalDurationMinutes / 60)}h {totalDurationMinutes % 60}m total
              </span>
            </div>

            {/* List of Periods & Breaks */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {slots.map((slot, idx) => {
                if (slot.isBreak) {
                  return (
                    <div
                      key={`break-${idx}`}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition ${
                        slot.breakType === 'lunch'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900 font-semibold'
                          : 'bg-blue-50/80 border-blue-200 text-blue-900 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {slot.breakType === 'lunch' ? (
                          <Utensils className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Coffee className="w-4 h-4 text-blue-600" />
                        )}
                        <span>{slot.breakName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-white/80 px-2 py-0.5 rounded border border-amber-200/50">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({slot.breakDuration}m)
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`p-${slot.periodNumber}`}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/20 transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {slot.periodNumber}
                      </span>
                      <span className="font-medium text-slate-700">
                        Period {slot.periodNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({config.periodDuration}m)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Ready to generate with these timings?
              </div>
              <button
                type="button"
                onClick={onGenerate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Generate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
