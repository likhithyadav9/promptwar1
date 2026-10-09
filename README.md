# Smart College Timetable Generator 🎓⏱️

An intelligent, responsive web application and algorithmic scheduling engine designed for colleges and universities. It dynamically generates conflict-free academic timetables with customizable daily periods (6, 7, 8, 9, or custom), automatic break placement, consecutive laboratory sessions, and multi-section faculty clash prevention.

Repository: [https://github.com/likhithyadav9/promptwar-1](https://github.com/likhithyadav9/promptwar-1)

---

## 🚀 1. Push Code Essentials (Git & Deployment Guide)

Follow these exact steps to push this codebase to your GitHub repository:

### Step 1: Initialize Git & Configure Remote
```bash
# Navigate to the project root directory
cd <project-folder>

# Initialize git repository (if not already done)
git init

# Configure your git identity (if not already configured)
git config user.name "Your Name"
git config user.email "your-email@example.com"

# Set remote origin
git remote add origin https://github.com/likhithyadav9/promptwar-1.git
# (Or if already added, update it: git remote set-url origin https://github.com/likhithyadav9/promptwar-1.git)
```

### Step 2: Stage & Commit All Essentials
```bash
# Stage all files (.gitignore ensures node_modules and builds are excluded)
git add .

# Create initial commit
git commit -m "feat: complete Smart College Timetable Generator with dynamic CSP scheduler, lab chunking, and clash prevention"
```

### Step 3: Push to GitHub
```bash
# Rename active branch to main
git branch -M main

# Push to your remote repository
git push -u origin main
# (If the remote repository already contains a README/License, use --force or pull first: git push -u origin main --force)
```

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher (or pnpm / yarn / bun)

### Available Scripts
```bash
npm install      # Install dependencies
npm run dev      # Launch Vite dev server on http://localhost:3000
npm run build    # Compile production bundle to /dist
npm run lint     # Run TypeScript typechecks
npm run preview  # Preview production build locally
```

---

## 🏗️ 2. System Architecture

The application is architected around a reactive, unidirectional data flow with a decoupled deterministic scheduling engine:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACE LAYER                            │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────────────┐  │
│  │ College Config │  │ Subject & Labs   │  │ Interactive Weekly Grid     │  │
│  │ Form & Timings │  │ Management View  │  │ (Click-to-Edit / Drag-Swap) │  │
│  └───────┬────────┘  └────────┬─────────┘  └──────────────┬──────────────┘  │
│          │                    │                           │                 │
│  ┌───────┴────────┐  ┌────────┴─────────┐  ┌──────────────┴──────────────┐  │
│  │ Faculty Schedule│ │ Multi-Section    │  │ Print & PDF / CSV Export    │  │
│  │ Inspector      │  │ Clash Hub        │  │ Document Formatter          │  │
│  └────────────────┘  └──────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ State Updates & User Actions
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                       STATE & PERSISTENCE CONTROLLER                        │
│  • React 19 State Machine (useTransition, hooks, memoized lookups)          │
│  • LocalStorage Synchronizer (Versioned JSON cache & recovery)              │
│  • Preset Repository (7-period Eng, 8-period Poly, 6-period Arts, 9-period) │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Normalized Data Payload
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                        ALGORITHMIC SCHEDULING ENGINE                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ Time Utilities Engine │  │ Constraint Satisfaction Problem (CSP) Core │  │
│  │ • 24h/12h Math        │  │ • Strict Lab Segment Chunking (Unbroken)   │  │
│  │ • Interleaved Breaks  │  │ • Multi-Class Faculty Collision Detector   │  │
│  │ • Closing Sync        │  │ • Heuristic Day-Dispersion Optimizer       │  │
│  └───────────────────────┘  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Breakdown
* `src/types/timetable.ts`: Strongly typed domain entities (`CollegeConfig`, `Subject`, `SlotTiming`, `TimetableCell`, `TimetableConflict`).
* `src/utils/timeUtils.ts`: Pure mathematical functions calculating chronological slot ranges and break interleaving.
* `src/utils/scheduler.ts`: Constraint Satisfaction Problem (CSP) solver utilizing heuristic backtrack placement and clash prevention.
* `src/utils/presets.ts`: Industry-standard college templates (7-period, 8-period, 6-period, 9-period).
* `src/utils/storage.ts`: Resilient LocalStorage persistence layer preventing data loss on browser refresh.
* `src/utils/exportUtils.ts`: Formatted CSV exporter and browser print trigger.
* `src/components/*`: Specialized components for configuration, subject management, interactive grid, faculty view, and academic printouts.

---

## ⚡ 3. The Scheduling Pipeline (Step-by-Step)

The timetable generation pipeline operates in 7 sequential phases:

```
[ Stage 1: Input Ingestion & Normalization ]
                     │
[ Stage 2: Feasibility & Hard Constraints Audit ]
                     │
[ Stage 3: Day-Block Segmentation & Break Masking ]
                     │
[ Stage 4: High-Constraint Lab Block Placement ]
                     │
[ Stage 5: Theory & Tutorial Dispersion Placement ]
                     │
[ Stage 6: Cross-Section Collision Detection & Audit ]
                     │
[ Stage 7: Interactive Render, Swap Engine & Export ]
```

### Phase 1: Input Ingestion & Normalization
* Ingests college hours, start time (`HH:MM`), period duration ($D_{\text{period}}$ minutes), periods per day ($N$), and break specifications.
* Normalizes time into absolute minutes from midnight $[0, 1439]$ for exact arithmetic.

### Phase 2: Feasibility & Hard Constraints Audit
Before any scheduling begins, mathematical solvability is verified:
1. **Capacity Equation**:
   $$\text{Total Slots} = |\text{Working Days}| \times N_{\text{periods}}$$
   If $\sum \text{Weekly Subject Periods} > \text{Total Slots}$, an immediate capacity overflow error is raised.
2. **Break Boundary & Lab Fit Check**:
   Finds the maximum unbroken period block between breaks. If a lab requires $K$ periods and no block has size $\ge K$, an impossibility error is flagged before generating.
3. **Faculty Overload Check**:
   Ensures no single instructor is assigned more hours than the total weekly operating capacity.

### Phase 3: Day-Block Segmentation & Break Masking
* Identifies continuous period windows on each day that are **not** interrupted by breaks.
* For example, if a college has 7 periods with a break after period 2 and lunch after period 4:
  $$\text{Blocks} = [1, 2], [3, 4], [5, 6, 7]$$

### Phase 4: High-Constraint Lab Block Placement
* Labs represent the highest mathematical constraint density because they require contiguous periods ($K = 2, 3, 4$).
* The engine searches for valid continuous sub-slices within unbroken blocks.
* Ensures lab faculty is available and prevents placing duplicate lab sessions of the same subject on the same day.

### Phase 5: Theory & Tutorial Dispersion Placement
* Remaining periods are allocated using heuristic penalty minimization:
  $$\text{Penalty}(s, \text{day}, p) = 100 \cdot C_{\text{day}}(s) + 300 \cdot \text{Adjacent}(s, p) + 10 \cdot F_{\text{load}}(\text{faculty}, \text{day})$$
  * Penalizes placing the same subject multiple times on the same day ($C_{\text{day}}$).
  * Penalizes scheduling the same subject in adjacent back-to-back periods ($\text{Adjacent}$).
  * Balances faculty teaching workload evenly across the work week ($F_{\text{load}}$).

### Phase 6: Cross-Section Collision Detection
* When generating Section B, the engine references Section A's occupancy matrix:
  $$\text{Occupied}(f, d, p) = \text{true if faculty } f \text{ teaches in Section A on day } d \text{ at period } p$$
* Hard-rejects any assignment that would double-book an instructor at the same time slot across sections.

### Phase 7: Interactive Rendering & Export
* Generates the weekly matrix and allows manual drag-and-drop or click-to-swap reassignments with real-time clash re-auditing.

---

## 🌟 4. How This Is Different From Other Timetable Generators

| Feature / Dimension | Typical Timetable Generators | Smart College Timetable Generator |
| :--- | :--- | :--- |
| **Number of Periods** | Hardcoded to 6 or 7 periods; crashes or breaks layout if modified. | **Fully Dynamic**: Supports 6, 7, 8, 9, or any custom value from 4 to 12 periods per day without hardcoding. |
| **Period Timings** | Static text labels (e.g. "Period 1", "Period 2"). | **Dynamic Time Math**: Computes exact start and end timestamps (e.g., 09:00–09:50 AM) based on duration and breaks. |
| **Break Placement** | Rigid or non-existent; breaks often split across classes randomly. | **Configurable Interleaving**: Supports multiple short breaks + lunch after any designated period with visual column dividers. |
| **Lab Scheduling** | Treats labs as single periods or allows breaks to cut through labs. | **Strict Continuous Chunking**: Guarantees labs are placed only in unbroken blocks without break interruptions. |
| **Cross-Class Faculty Clashes** | Isolated single-class generation; teachers get double-booked across sections. | **Multi-Section Clash Engine**: Enforces cross-section instructor availability lookups to eliminate simultaneous bookings. |
| **Infrastructure / Costs** | Requires Python backends, heavy database servers, or paid OpenAI/LLM API keys. | **Zero External Cost & Zero API Dependencies**: Deterministic client-side CSP engine running 100% in-browser with LocalStorage. |
| **Manual Adjustments** | Static display; regenerating destroys all custom tweaks. | **Click-to-Swap & Edit**: In-place slot swapping and manual overrides with instant clash warnings. |
| **Export Quality** | Raw JSON dumps or basic unformatted HTML tables. | **Institutional Print Standard**: Includes official college headers, semester info, legend, and HOD/Dean signature blocks. |

---

## 🛠️ 5. Technology Stack

* **Framework**: React 19 SPA (Functional components, custom hooks, `useTransition`)
* **Build Tool**: Vite 8 with ESNext compilation
* **Language**: TypeScript 7 (Strict type validation)
* **Styling**: Tailwind CSS v4 with custom print stylesheets (`@media print`)
* **Icons**: Lucide React
* **Persistence**: Browser LocalStorage with automatic JSON serialization

---

## 📄 License

MIT License. Free for academic and institutional use.
