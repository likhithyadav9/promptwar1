import React from 'react';
import {
  CalendarDays,
  Sparkles,
  Printer,
  Download,
  RotateCcw,
  Sliders,
  Layers,
  BookOpen,
} from 'lucide-react';
import { PRESETS, PresetData } from '../utils/presets';
import { CollegeConfig } from '../types/timetable';

interface HeaderProps {
  config: CollegeConfig;
  activePresetId: string;
  onSelectPreset: (preset: PresetData) => void;
  onGenerate: () => void;
  onPrint: () => void;
  onExportCSV: () => void;
  onReset: () => void;
  activeTab: 'config' | 'subjects' | 'timetable' | 'faculty' | 'multisection';
  setActiveTab: (tab: 'config' | 'subjects' | 'timetable' | 'faculty' | 'multisection') => void;
  isGenerating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activePresetId,
  onSelectPreset,
  onGenerate,
  onPrint,
  onExportCSV,
  onReset,
  activeTab,
  setActiveTab,
  isGenerating = false,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-lg sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: Branding, Preset switch, and Main Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Smart College Timetable Generator
                </h1>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium px-2 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {config.collegeName || 'College Schedule Planner'} • {config.department || 'Department'} ({config.semester || 'Semester'})
              </p>
            </div>
          </div>

          {/* Quick preset selector & primary action controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Preset selector */}
            <div className="relative">
              <label htmlFor="preset-select" className="sr-only">Choose College Template</label>
              <select
                id="preset-select"
                value={activePresetId}
                onChange={(e) => {
                  const found = PRESETS.find((p) => p.id === e.target.value);
                  if (found) onSelectPreset(found);
                }}
                className="bg-slate-800 hover:bg-slate-700/80 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none"
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    Template: {p.badge} ({p.name.split('(')[0].trim()})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Print button */}
            <button
              onClick={onPrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Print formatted timetable"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* CSV export */}
            <button
              onClick={onExportCSV}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Export timetable to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Reset Defaults */}
            <button
              onClick={onReset}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
              title="Reset to Template Defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Primary: Generate Button */}
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/30 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Generate Timetable</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1 py-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'timetable'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Timetable Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'config'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>College & Timings Config</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full font-mono">
                {config.periodsPerDay}p
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'subjects'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Subjects & Faculty</span>
            </button>

            <button
              onClick={() => setActiveTab('faculty')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'faculty'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Faculty Schedules</span>
            </button>

            <button
              onClick={() => setActiveTab('multisection')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'multisection'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Multi-Section & Clash Checker</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
