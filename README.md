<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router"/>
  <img src="https://img.shields.io/badge/Recharts-FF6B6B?style=for-the-badge&logo=recharts&logoColor=white" alt="Recharts"/>
  <img src="https://img.shields.io/badge/Lucide_Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide"/>
</p>

<h1 align="center">Edvols Frontend</h1>
<p align="center">
  <strong>React + Vite frontend for the Edvols AI-driven placement readiness platform</strong>
  <br/>
  Mock interviews · Aptitude tests · Dashboards · Analytics · Reports
</p>

---

## Architecture Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px', 'primaryColor': '#ffffff', 'edgeLabelBackground':'#ffffff'}}}%%
graph LR
    subgraph Layer1["Provider Layer"]
        A["BrowserRouter"]
        B["AuthContext"]
        C["ToastContext"]
    end

    subgraph Layer2["Gate Layer"]
        D["RequireSession"]
        E["RequireRole"]
        F["RoleGuard"]
    end

    subgraph Layer3["Layout Layer"]
        G["AppShell"]
        H["Sidebar"]
        I["Header"]
    end

    subgraph Layer4["Page Layer"]
        J["Student Pages"]
        K["Admin Pages"]
        L["Master Admin Pages"]
        M["Auth Pages"]
    end

    subgraph Layer5["API Layer"]
        N["api.js fetch wrapper"]
    end

    A --> B --> C
    C --> D --> E --> F
    F --> G --> H
    G --> I
    G --> Layer4
    Layer4 --> N
```

---

## Route Hierarchy

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px'}}}%%
graph TD
    Auth["/login /signup /forgot-password /reset-password /access-revoked"]
    Student["/dashboard /interview /aptitude/* /reports/* /student/*"]
    Admin["/admin-dashboard /admin/assessments /admin/analytics/*"]
    Master["/master-admin-dashboard /master-admin/students /master-admin/admins /master-admin/create-admin /master-admin/create-user /master-admin/ai-usage"]

    Auth -->|Login| Student
    Auth -->|Login| Admin
    Auth -->|Login| Master
```

---

## Authentication Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px'}}}%%
sequenceDiagram
    actor User
    participant Client as "Frontend"
    participant API as "Backend API"

    User->>Client: Enter email + password
    Client->>API: POST /auth/login
    API-->>Client: { token, user }
    Client-->>User: Redirect to dashboard

    Note over Client,API: On page refresh

    Client->>API: GET /auth/me (with token)
    API-->>Client: { user }
    Client-->>User: Restore session

    Note over Client,API: 401 = redirect to /login
    Note over Client,API: 423 = redirect to /access-revoked
```

---

## Role-Based Access

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px'}}}%%
graph TD
    SA["Super Admin"] --> SA_P["Create/Revoke Admins<br/>Create/Revoke Users<br/>View All Students & Admins<br/>Manage API Keys<br/>AI Usage Dashboard"]
    AD["Admin"] --> AD_P["Create Assessments<br/>View Analytics<br/>Manage Questions<br/>View Student Results<br/>Extend Attempt Timers"]
    ST["Student"] --> ST_P["Take Interviews<br/>Take Aptitude Tests<br/>View Reports<br/>Download PDFs"]
```

---

## Mock AI Interview Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px'}}}%%
sequenceDiagram
    actor Student
    participant FE as Frontend
    participant BE as Backend
    participant AI as Groq AI

    Student->>FE: Upload Resume + Select Domain
    FE->>BE: POST /api/start
    BE->>AI: ATS Analysis
    AI-->>BE: Score + Skills
    BE->>AI: Generate Question
    AI-->>BE: Question
    BE-->>FE: ATS Result + Question
    FE-->>Student: Display

    Note over Student,FE: Repeat for 10 questions

    Student->>FE: Record Answer
    FE->>BE: POST /api/answer_video
    BE->>AI: Transcribe (Whisper) + Evaluate
    AI-->>BE: 5 Metrics + Feedback + Next Question
    BE-->>FE: Evaluation + Next Question

    Student->>FE: End Interview
    FE->>BE: POST /api/end
    BE->>AI: Generate Full Report
    AI-->>BE: Report
    BE-->>FE: Full Report + PDF
```

---

## Aptitude Assessment Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px'}}}%%
sequenceDiagram
    actor Student
    participant FE as Frontend
    participant BE as Backend

    Student->>FE: Browse Assessments
    FE->>BE: GET /api/student/assessments
    BE-->>FE: Published Assessments
    FE-->>Student: Assessment List

    alt Already Submitted (403)
        Student->>FE: Click Start on submitted assessment
        FE->>BE: POST /api/student/assessments/:id/start
        BE-->>FE: 403 Already submitted
        FE-->>Student: Modal popup "already submitted"
    else Fresh Attempt
        Student->>FE: Start Assessment
        FE->>BE: POST /api/student/assessments/:id/start
        BE-->>FE: Questions + Timer
        FE-->>Student: MCQ Interface

        Student->>FE: Answer Questions
        FE->>BE: PUT /api/student/attempts/:id/answers
        BE-->>FE: Saved

        alt Tab Switch (Cheat Detection)
            Student->>FE: Switch tab/window
            FE->>BE: Auto-submit attempt immediately
            BE-->>FE: Score + Results
            FE->>FE: exitFullscreen()
            FE-->>Student: Result Summary
        else Manual Submit
            Student->>FE: Submit
            FE->>BE: POST /api/student/attempts/:id/submit
            BE-->>FE: Score + Results
            FE-->>Student: Result Summary
        end
    end
```

---

## Admin Assessment Creation

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px'}}}%%
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend
    participant AI as AI Provider

    Admin->>FE: Configure + Upload Source
    FE->>BE: POST /api/admin/assessments/generate
    BE->>AI: Generate Questions
    AI-->>BE: Questions
    BE-->>FE: Assessment + Questions
    FE-->>Admin: Review

    Admin->>FE: Edit / Approve
    FE->>BE: PUT /api/admin/assessments/:id/questions
    BE-->>FE: Updated

    Admin->>FE: Publish
    FE->>BE: PATCH /api/admin/assessments/:id/status
    BE-->>FE: Published
```

---

## User Management

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '28px'}}}%%
graph LR
    C["Create Forms<br/>(Single + CSV Import)"] --> U["MongoDB Users"]
    U --> A["Revoke / Restore / Delete"]
    A --> U
```

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | React 18 |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **Routing** | React Router 7 |
| **Charts** | Recharts 2 |
| **Icons** | Lucide React |
| **State Management** | React Context (Auth + Toast) |
| **HTTP Client** | Native fetch |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- Backend server running

### Installation

```bash
git clone <repo-url>
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The app starts at **http://localhost:5173**.

### Production Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:8000` | Backend API base URL |
| `VITE_API_KEY` | No | — | Optional API secret key |

The Vite dev server proxies `/api` requests to the configured backend URL.

---

## Pages by Role

### Authentication

| Route | Purpose |
|---|---|
| `/` | Role-based redirect or login |
| `/login` | Email + password sign in |
| `/signup` | Registration with auto role assignment |
| `/forgot-password` | Request reset email |
| `/reset-password` | Reset with token |
| `/access-revoked` | Account on hold notice |

### Student

| Route | Purpose |
|---|---|
| `/dashboard` | Overview with stats and topic performance |
| `/interview` | Full AI mock interview flow |
| `/aptitude` | Browse and take assessments |
| `/aptitude/:id/start` | Timed MCQ test interface |
| `/aptitude/results` | Assessment results list |
| `/aptitude/results/:id` | Per-question result detail |
| `/report` | Interview report viewer with charts |
| `/reports` | Combined reports and results |

### Admin

| Route | Purpose |
|---|---|
| `/admin-dashboard` | Overview with stats and quick actions |
| `/admin/assessments` | List and manage assessments |
| `/admin/assessments/create` | AI-powered question generation |
| `/admin/assessments/:id/questions` | Review and edit questions |
| `/admin/assessments/:id/results` | Student attempt monitoring |
| `/admin/analytics/aptitude` | Per-student aptitude analytics |
| `/admin/analytics/interviews` | Interview report analytics |

### Master Admin

| Route | Purpose |
|---|---|
| `/master-admin-dashboard` | Platform overview and usage stats |
| `/master-admin/students` | View all students with admin filter |
| `/master-admin/admins` | View all admin accounts |
| `/master-admin/master-admins` | View super admin accounts |
| `/master-admin/create-admin` | Create admins with module access |
| `/master-admin/create-user` | Create users with admin assignment |
| `/master-admin/ai-usage` | AI usage stats + API key management |

---

---

## Anti-Cheating

### Tab-Switch Detection

Both assessment interfaces (`/aptitude/:id/start` and `/student/assessments/:id/start`) detect tab switches via the `visibilitychange` event. On the **first** switch, the attempt is auto-submitted immediately (no 3-warning grace period), and the browser exits fullscreen.

| Behavior | Detail |
|---|---|
| Trigger | `visibilitychange` → `hidden` |
| Strikes | 0 — submits on first switch |
| Action | `submit()` called via `autoSubmitted` ref guard |
| Fullscreen | `document.exitFullscreen?.()` called after submit |

### Duplicate Attempt Prevention

The backend rejects `POST /api/student/assessments/:id/start` with **403 Forbidden** if the student already has a submitted attempt. On the frontend, this is caught in `StudentAssessments.jsx` and displayed as a modal popup on the listing page — no page navigation occurs.

---

## Real-Time Analytics Polling

Dashboards and analytics pages across all roles poll the backend every **30 seconds** to keep data fresh. Polling runs silently — no loading indicators on background refresh.

| Page | Interval |
|---|---|
| Student Dashboard (`/dashboard`) | 30s |
| Admin Dashboard (`/admin-dashboard`) | 30s |
| Master Admin Dashboard (`/master-admin-dashboard`) | 30s |
| Student Assessment Results (`/aptitude/results`) | 30s |
| Admin AI Usage (`/admin/analytics/ai-usage`) | 30s |
| Master Admin AI Usage (`/master-admin/ai-usage`) | 30s |
| Institution Detail (`/master-admin/institutions/:id`) | 30s |
| Programming Practice Topics | 30s |

---

## Security

A security audit identified the following issues that require attention:

| Severity | Issue | Location |
|---|---|---|
| **Critical** | Live API keys (Groq, SMTP) committed to git history | Backend `.env` file |
| **Critical** | `JWT_SECRET` set to placeholder value | Backend `.env` |
| **High** | CORS allows any origin (`origin: true`) | Backend server config |
| **High** | Signup endpoint assigns `master_admin` role by default | Backend signup route |
| **High** | Login has no rate limiter | Backend auth routes |

The frontend does not store secrets — all API calls go through the backend which holds credentials.

---

## Components

| Component | Purpose |
|---|---|
| `Sidebar` | Role-filtered navigation |
| `VoiceRecorder` | Mic/video recording with waveform |
| `RoleGuard` | Role-based route protection |
| `Timer` | Countdown with expiry callback |
| `StatCard` | Color-coded statistics card |
| `AssessmentCard` | Assessment display card |
| `QuestionList` | Editable question list |
| `QuestionEditorCard` | Individual question editor |
| `ResultSummary` | Score and pass/fail summary |
| `ManualGenerationForm` | AI assessment generation form |
| `LoadingSkeleton` | Animated loading placeholder |

---

## Project Structure

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── components/
│   ├── Sidebar.jsx
│   └── VoiceRecorder.jsx
├── lib/
│   └── api.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── constants.js
    ├── globals.css
    ├── navigation.jsx
    ├── portal/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ToastContext.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── RoleGuard.jsx
    │   │   ├── Timer.jsx
    │   │   ├── AssessmentCard.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── QuestionList.jsx
    │   │   ├── QuestionEditorCard.jsx
    │   │   ├── ManualGenerationForm.jsx
    │   │   ├── ResultSummary.jsx
    │   │   └── LoadingSkeleton.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── ForgotPassword.jsx
    │       ├── ResetPassword.jsx
    │       ├── student/
    │       └── admin/
    └── pages/
        ├── DashboardPage.jsx
        ├── InterviewPage.jsx
        ├── AptitudePage.jsx
        ├── ReportPage.jsx
        ├── ReportsResultsPage.jsx
        ├── AccessRevoked.jsx
        ├── aptitude/
        └── admin/
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## License

MIT
