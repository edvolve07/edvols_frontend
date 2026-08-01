import { Link, usePathname } from "@/src/navigation";
import { ChevronRight, Headphones, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import clsx from "clsx";
import { APP_NAME, NAV_ITEMS } from "@/src/constants";
import { useAuth } from "@/src/portal/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/src/animations";

const MIN_SIDEBAR_WIDTH = 88;
const DEFAULT_SIDEBAR_WIDTH = 256;
const MAX_SIDEBAR_WIDTH = 320;
const COMPACT_THRESHOLD = 136;

function clampSidebarWidth(value) {
  return Math.min(Math.max(value, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
}

export default function Sidebar({ open = false, onClose = () => {}, width = DEFAULT_SIDEBAR_WIDTH, onWidthChange = () => {} }) {
  const path = usePathname();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  const navRef = useRef(null);
  const bottomRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const items = navRef.current?.querySelectorAll(":scope > a");
      if (items?.length) {
        gsap.fromTo(items, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: "power2.out", delay: 0.1 });
      }
      const bottomEls = bottomRef.current?.children;
      if (bottomEls?.length) {
        gsap.fromTo(bottomEls, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out", delay: 0.25 });
      }
    });
    return () => ctx.revert();
  }, [visibleItems, reduced]);

  function handleLogout() {
    logout();
    onClose();
    navigate("/login");
  }

  function updateWidth(nextWidth) {
    onWidthChange(clampSidebarWidth(nextWidth));
  }

  function toggleCompact() {
    updateWidth(compact ? DEFAULT_SIDEBAR_WIDTH : MIN_SIDEBAR_WIDTH);
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
          <img src="/edvols_logo_white_transparent.png" alt="Edvols" className="h-10 w-auto" />
          <div className={clsx("min-w-0", compact && "hidden")}>
            <p className="text-[22px] font-bold leading-none tracking-tight text-white">
              {APP_NAME}
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-emerald-200">Placement readiness</p>
          </div>
        </div>
      </div>

      <nav ref={navRef} className={clsx("flex-1 space-y-2 overflow-y-auto pb-5", compact ? "px-2" : "px-3")}>
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

      <div ref={bottomRef} className={clsx("space-y-4 pb-5", compact ? "px-2" : "px-5")}>
        <Link
          href="/help"
          onClick={onClose}
          title={compact ? "Need Help?" : undefined}
          className={clsx(
            "flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15",
            compact ? "justify-center" : ""
          )}
        >
          <Headphones size={16} />
          {!compact && <span>Need Help?</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          title={compact ? "Logout" : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <LogOut size={16} />
          <span className={clsx(compact && "hidden")}>Logout</span>
        </button>

        <button
          type="button"
          onClick={toggleCompact}
          title={compact ? "Expand sidebar" : "Shrink sidebar"}
          aria-label={compact ? "Expand sidebar" : "Shrink sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-emerald-200/70 transition hover:bg-white/10 hover:text-emerald-100"
        >
          {compact ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          <span className={clsx(compact && "hidden")}>{compact ? "Expand" : "Shrink"}</span>
        </button>
      </div>
    </aside>
  );
}
