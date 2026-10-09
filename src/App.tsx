import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  CollegeConfig,
  Subject,
  TimetableData,
  TimetableCell,
  DayOfWeek,
} from './types/timetable';
import { PRESETS, PresetData } from './utils/presets';
import {
  loadSavedConfig,
  saveConfig,
  loadSavedSubjects,
  saveSubjects,
  loadSavedTimetable,
  saveTimetable,
  loadActivePresetId,
  saveActivePresetId,
} from './utils/storage';
import {
  generateTimetable,
  validateTimetableFeasibility,
  detectAllTimetableConflicts,
  ExternalClassAssignment,
} from './utils/scheduler';
import { exportTimetableToCSV } from './utils/exportUtils';
import { Header } from './components/Header';
import { ConfigForm } from './components/ConfigForm';
import { SubjectManager } from './components/SubjectManager';
import { TimetableGrid } from './components/TimetableGrid';
import { FacultyScheduleView } from './components/FacultyScheduleView';
import { MultiSectionManager } from './components/MultiSectionManager';
import { ConflictAlert } from './components/ConflictAlert';
import { PrintView } from './components/PrintView';
import {
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';

export default function App() {
  const [activePresetId, setActivePresetId] = useState<string>(() => loadActivePresetId());
  const [config, setConfig] = useState<CollegeConfig>(() => loadSavedConfig());
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSavedSubjects());
  const [timetable, setTimetable] = useState<TimetableData | null>(() => loadSavedTimetable());

  // Multi-section support (Section A and Section B)
  const [activeSection, setActiveSection] = useState<'A' | 'B'>('A');
  const [timetableSectionB, setTimetableSectionB] = useState<TimetableData | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'timetable' | 'config' | 'subjects' | 'faculty' | 'multisection'>('timetable');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isGenerating, startTransition] = useTransition();

  // Helper to get external assignments for Section B (from Section A)
  const getExternalAssignmentsForSectionB = useCallback((): ExternalClassAssignment[] => {
    if (!timetable) return [];
    const assignments: ExternalClassAssignment[] = [];
    for (const day of config.workingDays) {
      for (let p = 1; p <= config.periodsPerDay; p++) {
        const cell = timetable.grid[day]?.[p];
        if (cell && cell.type !== 'empty' && cell.facultyName) {
          assignments.push({
            day,
            periodNumber: p,
            facultyName: cell.facultyName,
            className: `${config.section || 'Section A'}`,
          });
        }
      }
    }
    return assignments;
  }, [timetable, config]);

  // Main Generator Function
  const handleGenerate = useCallback(
    (customConfig = config, customSubjects = subjects) => {
      startTransition(() => {
        const validation = validateTimetableFeasibility(customConfig, customSubjects);
        setValidationErrors(validation.errors);
        setValidationWarnings(validation.warnings);

        if (!validation.isValid) {
          setActiveTab('timetable');
          return;
        }

        const result = generateTimetable(customConfig, customSubjects);
        if (result.timetable) {
          setTimetable(result.timetable);
          saveTimetable(result.timetable);
          saveConfig(customConfig);
          saveSubjects(customSubjects);
          setActiveTab('timetable');
        }
      });
    },
    [config, subjects]
  );

  // Generate on initial load if no timetable is present
  useEffect(() => {
    if (!timetable) {
      handleGenerate(config, subjects);
    }
  }, [timetable, config, subjects, handleGenerate]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetData) => {
    setActivePresetId(preset.id);
    saveActivePresetId(preset.id);
    setConfig(preset.config);
    setSubjects(preset.subjects);
    saveConfig(preset.config);
    saveSubjects(preset.subjects);

    // Auto-generate for the new preset
    handleGenerate(preset.config, preset.subjects);
  };

  // Handle Reset to Default Template
  const handleReset = () => {
    const currentPreset = PRESETS.find((p) => p.id === activePresetId) || PRESETS[0];
    handleSelectPreset(currentPreset);
  };

  // Update Grid (Manual edit / swap)
  const handleUpdateGrid = (newGrid: Record<DayOfWeek, Record<number, TimetableCell>>) => {
    if (!timetable) return;

    // Detect if any new conflicts were introduced by manual edit
    const detectedConflicts = detectAllTimetableConflicts(
      newGrid,
      config.workingDays,
      config.periodsPerDay,
      config.breaks
    );

    // Recalculate stats
    let assigned = 0;
    let empty = 0;
    for (const d of config.workingDays) {
      for (let p = 1; p <= config.periodsPerDay; p++) {
        if (newGrid[d]?.[p]?.type !== 'empty') assigned++;
        else empty++;
      }
    }

    const updatedTimetable: TimetableData = {
      ...timetable,
      grid: newGrid,
      conflicts: detectedConflicts,
      stats: {
        ...timetable.stats,
        assignedSlots: assigned,
        emptySlots: empty,
      },
    };

    setTimetable(updatedTimetable);
    saveTimetable(updatedTimetable);
  };

  // Generate Section B with automatic shared faculty clash avoidance
  const handleGenerateSectionB = () => {
    const sectionBConfig: CollegeConfig = {
      ...config,
      section: 'Section B',
    };

    const externalAssignments = getExternalAssignmentsForSectionB();
    const result = generateTimetable(sectionBConfig, subjects, externalAssignments);
    if (result.timetable) {
      setTimetableSectionB(result.timetable);
      setActiveTab('multisection');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const activeTimetable = activeSection === 'A' ? timetable : timetableSectionB || timetable;
    if (activeTimetable) {
      exportTimetableToCSV(activeTimetable);
    }
  };

  // Print Mode
  const handleOpenPrint = () => {
    setIsPrintMode(true);
  };

  // If in dedicated full print view mode
  if (isPrintMode && timetable) {
    return (
      <PrintView
        timetable={activeSection === 'A' ? timetable : timetableSectionB || timetable}
        subjects={subjects}
        onBack={() => setIsPrintMode(false)}
      />
    );
  }

  const activeTimetable = activeSection === 'A' ? timetable : timetableSectionB || timetable;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        config={config}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onGenerate={() => handleGenerate(config, subjects)}
        onPrint={handleOpenPrint}
        onExportCSV={handleExportCSV}
        onReset={handleReset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isGenerating={isGenerating}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Conflict / Feasibility Alert Banner */}
        <ConflictAlert
          errors={validationErrors}
          warnings={validationWarnings}
          conflicts={timetable?.conflicts || []}
        />

        {/* Tab 1: Timetable Grid View */}
        {activeTab === 'timetable' && (
          <div>
            {activeTimetable ? (
              <TimetableGrid
                timetable={activeTimetable}
                subjects={subjects}
                onUpdateGrid={handleUpdateGrid}
                onRegenerate={() => handleGenerate(config, subjects)}
                onPrint={handleOpenPrint}
                onExportCSV={handleExportCSV}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                <Calendar className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Ready to Generate Your Timetable
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                  Configure college hours, periods, breaks, and subjects to build an automated, clash-free schedule.
                </p>
                <button
                  type="button"
                  onClick={() => handleGenerate(config, subjects)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Timetable Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: College & Timings Configuration */}
        {activeTab === 'config' && (
          <ConfigForm
            config={config}
            onChange={(updated) => {
              setConfig(updated);
              saveConfig(updated);
            }}
            onGenerate={() => handleGenerate(config, subjects)}
          />
        )}

        {/* Tab 3: Subjects & Faculty Management */}
        {activeTab === 'subjects' && (
          <SubjectManager
            subjects={subjects}
            config={config}
            onChange={(updated) => {
              setSubjects(updated);
              saveSubjects(updated);
            }}
            onGenerate={() => handleGenerate(config, subjects)}
          />
        )}

        {/* Tab 4: Faculty-Centric View */}
        {activeTab === 'faculty' && activeTimetable && (
          <FacultyScheduleView
            timetable={activeTimetable}
            subjects={subjects}
          />
        )}

        {/* Tab 5: Multi-Section & Cross-Class Clash Prevention */}
        {activeTab === 'multisection' && (
          <MultiSectionManager
            sectionAName={config.section || 'Section A'}
            sectionBName="Section B"
            activeSection={activeSection}
            onSwitchSection={(sec) => setActiveSection(sec)}
            timetableA={timetable}
            timetableB={timetableSectionB}
            onGenerateSectionB={handleGenerateSectionB}
            configA={config}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong>Smart College Timetable Generator</strong> • Dynamic periods, automated break calculation, lab blocks &amp; conflict-free scheduling.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Client-side Engine</span>
            <span>•</span>
            <span>Saved in LocalStorage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
