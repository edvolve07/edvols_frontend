import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Crown,
  Cpu,
  FileText,
  FilePlus2,
  LayoutDashboard,
  MessageSquareText,
  Mic2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  UserCog,
} from "lucide-react";


export const APP_NAME = "Edvols";  




export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student"], modules: ["both", "aptitude", "ai_interview"] },

  { href: "/interview", label: "Interview Prep", icon: Mic2, roles: ["student"], modules: ["both", "ai_interview"] },
  { href: "/aptitude", label: "Aptitude Practice", icon: BrainCircuit, roles: ["student"], modules: ["both", "aptitude"] },
  
  { href: "/programming/practice", label: "Coding Practice", icon: Code2, roles: ["student"], modules: ["both", "programming"] },
  // { href: "/programming", label: "AI Mock Interview", icon: Cpu, roles: ["student"], modules: ["both", "programming"] },
  { href: "/programming/assessments", label: "Contests", icon: ClipboardCheck, roles: ["student"], modules: ["both", "programming"] },
  { href: "/communication", label: "Interview Communication", icon: MessageSquareText, roles: ["student"], modules: ["both", "communication"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["student"], modules: ["both", "aptitude", "ai_interview"] },
  { href: "/resume-builder", label: "Resume Builder", icon: FilePlus2, roles: ["student"] },
  { href: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldCheck, roles: ["admin"] },
  { href: "/admin/analytics/aptitude", label: "Aptitude Analytics", icon: BrainCircuit, roles: ["admin"], modules: ["both", "aptitude"] },
  { href: "/admin/analytics/interviews", label: "Interview Analytics", icon: Mic2, roles: ["admin"], modules: ["both", "ai_interview"] },
  { href: "/admin/analytics/communication", label: "Interview Comm Analytics", icon: MessageSquareText, roles: ["admin"], modules: ["both", "communication"] },
  { href: "/master-admin/dashboard", label: "Master Admin", icon: Crown, roles: ["master_admin"] },
  { href: "/master-admin/institutions", label: "Institutions", icon: Building2, roles: ["master_admin"] },
  { href: "/master-admin/master-admins", label: "Master Admins", icon: Crown, roles: ["master_admin"] },
  { href: "/master-admin/programming", label: "Practice Problems", icon: Code2, roles: ["master_admin"] },
  { href: "/master-admin/programming/assessments", label: "Coding Assessments", icon: ClipboardCheck, roles: ["master_admin"] },
  { href: "/master-admin/ai-usage", label: "AI Usage", icon: Cpu, roles: ["master_admin"] },
  { href: "/admin/assessments/create", label: "New Aptitude Test", icon: FilePlus2, roles: ["admin"], modules: ["both", "aptitude"] },
  { href: "/admin/assessments", label: "Aptitude Assessments", icon: ClipboardList, roles: ["admin"], modules: ["both", "aptitude"] },
  { href: "/admin/programming/analytics/students", label: "Programming Analytics", icon: TrendingUp, roles: ["admin"], modules: ["both", "programming"] },
  { href: "/admin/programming/assessments", label: "Coding Assessments", icon: ClipboardCheck, roles: ["admin"], modules: ["both", "programming"] },
  { href: "/admin/programming/assessments/create", label: "New Coding Test", icon: FilePlus2, roles: ["admin"], modules: ["both", "programming"] },
  { href: "/profile", label: "Profile", icon: UserRound, roles: ["student", "admin", "master_admin"] },
];



export const DASHBOARD_STATS = [
  { label: "Interviews", value: "0", icon: Mic2, tone: "brand" },
  { label: "Average score", value: "--", icon: TrendingUp, tone: "green" },
  { label: "Aptitude attempts", value: "0", icon: BrainCircuit, tone: "amber" },
  { label: "Reports", value: "0", icon: BarChart3, tone: "purple" },
];

export const INTERVIEW_DOMAINS = [
  "Engineering",
  "Computer Science",
  "Business",
  "Finance",
  "Marketing",
  "Healthcare",
];

export const INTERVIEW_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Product Manager",
  "Business Analyst",
  "DevOps Engineer",
];

export const DOMAIN_ROLES = {
  Engineering: [
    "Mechanical Engineer",
    "Civil Engineer",
    "Electrical Engineer",
    "Industrial Engineer",
  ],
  "Computer Science": [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "DevOps Engineer",
  ],
  Business: [
    "Product Manager",
    "Business Analyst",
    "Management Consultant",
    "Operations Manager",
  ],
  Finance: [
    "Financial Analyst",
    "Investment Banker",
    "Accountant",
    "Auditor",
  ],
  Marketing: [
    "Marketing Manager",
    "Digital Marketing Specialist",
    "Brand Manager",
    "Content Strategist",
  ],
  Healthcare: [
    "Doctor",
    "Nurse",
    "Healthcare Administrator",
    "Medical Researcher",
  ],
};

export const APTITUDE_DOMAINS = {
  engineering: {
    label: "Engineering",
    description: "Maths, physics, circuits, mechanics",
  },
  bca: {
    label: "BCA / Computer Science",
    description: "Algorithms, OS, DBMS, networks",
  },
};

export const METRIC_LABELS = {
  confidence: "Confidence",
  body_language: "Body Language",
  knowledge: "Knowledge",
  fluency: "Fluency",
  skill_relevance: "Relevance",
};

export const METRIC_COLORS = {
  confidence: "#5f6bf3",
  body_language: "#06b6d4",
  knowledge: "#10b981",
  fluency: "#f59e0b",
  skill_relevance: "#8b5cf6",
};

export const COMMUNICATION_CATEGORIES = [
  'Tell Me About Yourself',
  'Behavioral Questions (STAR)',
  'Strengths & Weaknesses',
  'Why This Role / Company',
  'Technical Explanations',
  'Handling Difficult Questions',
  'Career Goals & Aspirations',
  'Salary & Negotiation Talk',
];

export const COMMUNICATION_METRICS = {
  clarity: { label: 'Clarity', color: '#5f6bf3' },
  structure: { label: 'Structure', color: '#06b6d4' },
  conciseness: { label: 'Conciseness', color: '#10b981' },
  relevance: { label: 'Relevance', color: '#f59e0b' },
  confidence_tone: { label: 'Confidence & Tone', color: '#8b5cf6' },
};

export const COMMUNICATION_WORKFLOW = [
  {
    title: 'Pick an interview topic',
    description: 'Choose a question type you want to practice answering.',
    icon: MessageSquareText,
  },
  {
    title: 'Practice your answer',
    description: 'Respond to realistic interview prompts with text answers.',
    icon: Sparkles,
  },
  {
    title: 'Get scored',
    description: 'See clarity, structure, conciseness, relevance, and confidence scores.',
    icon: TrendingUp,
  },
  {
    title: 'Improve faster',
    description: 'Use feedback and tips to ace your real interview.',
    icon: TrendingUp,
  },
];

export const WORKFLOW_STEPS = [
  {
    title: "Upload resume",
    description: "Start with a PDF resume and role context.",
    icon: FileText,
  },
  {
    title: "Practice live",
    description: "Answer timed AI questions with voice and camera.",
    icon: Mic2,
  },
  {
    title: "Review metrics",
    description: "See confidence, fluency, knowledge, and relevance.",
    icon: Sparkles,
  },
  {
    title: "Improve faster",
    description: "Use report tips before your real interview.",
    icon: TrendingUp,
  },
];
