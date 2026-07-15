import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  Code2,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/assessments/create', label: 'Create Assessment', icon: FilePlus2 },
  { to: '/admin/assessments', label: 'Assessments', icon: ClipboardList },
  { to: '/admin/programming', label: 'Programming Problems', icon: Code2 },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/assessments', label: 'Available Assessments', icon: BookOpenCheck },
  { to: '/student/results', label: 'Results', icon: BarChart3 },
  { to: '/student/profile', label: 'Profile', icon: UserRound },
];

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = role === 'admin' ? adminLinks : studentLinks;
  const home = role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (window.innerWidth < 1024) return 288;
    const stored = Number(window.localStorage.getItem("portal-sidebar-width"));
    return Number.isFinite(stored) ? Math.min(Math.max(stored, 88), 360) : 288;
  });
  const compact = sidebarWidth <= 136 && window.innerWidth >= 1024;

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      window.localStorage.setItem("portal-sidebar-width", String(sidebarWidth));
    }
  }, [sidebarWidth]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function renderLinks(compactMode = false) {
    return links.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setSidebarOpen(false)}
          title={compactMode ? item.label : undefined}
          className={({ isActive }) =>
            compactMode
              ? `inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold shadow-sm ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-emerald-100 bg-white text-emerald-900 hover:bg-emerald-50'
                }`
              : `group relative flex items-center rounded-2xl py-3.5 text-[15px] font-bold transition-all duration-150 ${
                  compact ? 'justify-center px-3' : 'gap-4 px-4'
                } ${
                  isActive
                    ? 'bg-emerald-600/80 text-white'
                    : 'text-emerald-50 hover:bg-white/10 hover:text-white'
                }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={20}
                className={compactMode ? 'h-4 w-4' : ''}
              />
              {!compactMode ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
            </>
          )}
        </NavLink>
      );
    });
  }

  return (
    <div className="flex min-h-screen bg-canvas" style={{ "--sidebar-width": `${sidebarWidth}px` }}>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]"
        />
      ) : null}

      <aside
        className="sidebar fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-72 flex-col border-r border-white/10 bg-[radial-gradient(circle_at_30%_0%,rgba(5,150,105,0.35),transparent_34%),linear-gradient(180deg,#064e3b_0%,#053f31_48%,#042f25_100%)] transition-transform duration-200 sm:w-72 lg:w-[var(--sidebar-width)] lg:max-w-none"
        style={sidebarOpen ? {} : { transform: 'none' }}
      >
        <div className={compact ? 'px-3 pb-7 pt-8' : 'px-6 pb-7 pt-8'}>
          <Link to={home} className={compact ? 'flex justify-center' : 'flex items-center gap-3'}>
            <img src="/edvols%20logo.png" alt="Edvols" className={compact ? 'h-10 w-auto' : 'h-10 w-auto'} />
            {!compact ? (
              <div className="min-w-0">
                <p className="text-[22px] font-bold leading-none tracking-tight text-white">Edvols</p>
                <p className="mt-1.5 text-[12px] font-medium text-emerald-200">Placement readiness</p>
              </div>
            ) : null}
          </Link>
        </div>

        <nav className={compact ? 'flex-1 space-y-2 overflow-y-auto px-2 pb-5' : 'flex-1 space-y-2 overflow-y-auto px-3 pb-5'}>
          {renderLinks(false)}
        </nav>

        <div className={compact ? 'space-y-4 px-2 pb-5' : 'space-y-4 px-5 pb-5'}>
          <button
            type="button"
            onClick={handleLogout}
            title={compact ? 'Logout' : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <LogOut size={16} />
            {!compact ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="eyebrow">{role === 'admin' ? 'Admin Console' : 'Student Portal'}</p>
            <h1 className="text-lg font-black text-slate-900">{user?.name}</h1>
          </div>

          <img src="/edvols%20logo.png" alt="Edvols" className="h-7 w-auto hidden md:block" />

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex shrink-0 items-center gap-3 rounded-xl px-1 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-2"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-800 text-sm font-bold text-white">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden max-w-36 truncate sm:inline">{user?.name || "User"}</span>
          </button>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2 lg:hidden">
          {renderLinks(true)}
        </nav>

        <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}