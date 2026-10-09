import React from 'react';
import { TimetableConflict } from '../types/timetable';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConflictAlertProps {
  errors: string[];
  warnings: string[];
  conflicts: TimetableConflict[];
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({
  errors,
  warnings,
  conflicts,
}) => {
  const hasErrors = errors.length > 0 || conflicts.some((c) => c.severity === 'error');
  const hasWarnings = warnings.length > 0 || conflicts.some((c) => c.severity === 'warning');

  if (!hasErrors && !hasWarnings) {
    return (
      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            Optimal Schedule Generated • All hard constraints & faculty allocations satisfied without any clashes!
          </span>
        </div>
        <span className="font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">
          100% Feasible
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Error Banner */}
      {hasErrors && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-rose-800 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Feasibility & Conflict Issues Detected:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-2 text-rose-700">
            {errors.map((err, i) => (
              <li key={`err-${i}`}>{err}</li>
            ))}
            {conflicts
              .filter((c) => c.severity === 'error')
              .map((c, i) => (
                <li key={`conf-err-${i}`}>
                  <strong>{c.message}</strong>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Warning Banner */}
      {hasWarnings && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-amber-800 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Schedule Observations & Recommendations:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-700">
            {warnings.map((warn, i) => (
              <li key={`warn-${i}`}>{warn}</li>
            ))}
            {conflicts
              .filter((c) => c.severity === 'warning')
              .map((c, i) => (
                <li key={`conf-warn-${i}`}>{c.message}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};
