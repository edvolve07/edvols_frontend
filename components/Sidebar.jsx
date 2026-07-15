import { Link, usePathname } from "@/src/navigation";
import { ChevronRight, Headphones, LogOut, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import clsx from "clsx";
import { APP_NAME, NAV_ITEMS } from "@/src/constants";
import { useAuth } from "@/src/portal/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const MIN_SIDEBAR_WIDTH = 88;
const DEFAULT_SIDEBAR_WIDTH = 288;
const MAX_SIDEBAR_WIDTH = 360;
const COMPACT_THRESHOLD = 136;

function clampSidebarWidth(value) {
  return Math.min(Math.max(value, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
}

export default function Sidebar({ open = false, onClose = () => {}, width = DEFAULT_SIDEBAR_WIDTH, onWidthChange = () => {} }) {
  const path = usePathname();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const resizingRef = useRef(false);
  const compact = width <= COMPACT_THRESHOLD && window.innerWidth >= 1024;
  const userModules = user?.modules_access || ["both"];
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(user?.role)) return false;
    if (item.modules && !item.modules.some((m) => userModules.includes(m))) return false;
    return true;
  });
  const activeHref = visibleItems
    .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  function handleLogout() {
    logout();
    onClose();
    navigate("/login");
  }

  function updateWidth(nextWidth) {
    onWidthChange(clampSidebarWidth(nextWidth));
  }

  function handleResizeStart(event) {
    if (window.innerWidth < 1024) return;
    resizingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handleResizeMove(event) {
    if (!resizingRef.current) return;
    updateWidth(event.clientX);
  }

  function handleResizeEnd(event) {
    if (!resizingRef.current) return;
    resizingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function toggleCompact() {
    updateWidth(compact ? DEFAULT_SIDEBAR_WIDTH : MIN_SIDEBAR_WIDTH);
  }

  function handleResizeKeyDown(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateWidth(width - 16);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateWidth(width + 16);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCompact();
    }
  }

  return (
    <aside
      style={{ "--sidebar-current-width": `${width}px` }}
      className={clsx(
        "sidebar fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-72 flex-col border-r border-white/10 bg-[radial-gradient(circle_at_30%_0%,rgba(5,150,105,0.35),transparent_34%),linear-gradient(180deg,#064e3b_0%,#053f31_48%,#042f25_100%)] transition-transform duration-200 sm:w-72 lg:w-[var(--sidebar-current-width)] lg:max-w-none",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className={clsx("pb-7 pt-8", compact ? "px-3" : "px-6")}>
        <div className={clsx("flex items-center gap-3", compact && "justify-center")}>
          <img src="/edvols%20logo.png" alt="Edvols" className="h-10 w-auto" />
          <div className={clsx("min-w-0", compact && "hidden")}>
            <p className="text-[22px] font-bold leading-none tracking-tight text-white">
              {APP_NAME}
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-emerald-200">Placement readiness</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleCompact}
          title={compact ? "Expand sidebar" : "Shrink sidebar"}
          aria-label={compact ? "Expand sidebar" : "Shrink sidebar"}
          className={clsx(
            "mt-3 hidden h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/15 lg:flex",
            compact ? "mx-auto" : "ml-[52px]",
          )}
        >
          {compact ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      <nav className={clsx("flex-1 space-y-2 overflow-y-auto pb-5", compact ? "px-2" : "px-3")}>
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const active = activeHref === href;
          return (
            <Link key={href} href={href} onClick={onClose}
              title={compact ? label : undefined}
              className={clsx(
                "group relative flex items-center rounded-2xl py-3.5 text-[15px] font-bold transition-all duration-150",
                compact ? "justify-center px-3" : "gap-4 px-4",
                active ? "bg-emerald-600/80 text-white" : "text-emerald-50 hover:bg-white/10 hover:text-white",
              )}>
              <Icon size={20} className={clsx("transition-colors", active ? "text-white" : "text-emerald-100/80 group-hover:text-white")} />
              <span className={clsx("min-w-0 flex-1 truncate", compact && "hidden")}>{label}</span>
              {active && !compact ? <ChevronRight size={15} className="text-emerald-100" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className={clsx("space-y-4 pb-5", compact ? "px-2" : "px-5")}>
        

        <div className={clsx("rounded-xl border border-white/15 bg-white/[0.05]", compact ? "p-3" : "p-4")}>
          <div className={clsx("flex items-center", compact ? "justify-center" : "gap-3")}>
            <Headphones size={20} className="text-emerald-100" />
            <div className={clsx(compact && "hidden")}>
              <p className="text-sm font-semibold text-white">Need Help?</p>
              <p className="text-xs text-emerald-200">Contact Support</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title={compact ? "Logout" : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <LogOut size={16} />
          <span className={clsx(compact && "hidden")}>Logout</span>
        </button>
      </div>

      <div
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
        onKeyDown={handleResizeKeyDown}
        className="group absolute inset-y-0 right-0 hidden w-3 cursor-col-resize touch-none items-center justify-center outline-none lg:flex"
      >
        <span className="h-14 w-1 rounded-full bg-white/10 transition group-hover:bg-white/30 group-focus:bg-white/40" />
      </div>
    </aside>
  );
}
