import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Map,
  LayoutDashboard,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { LogoIcon } from "@/components/LogoIcon";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useMessageStore } from "@/store/messageStore";

/* ================================================================
   NAVIGATION ARCHITECTURE
   ----------------------------------------------------------------
   Features are strictly separated into four dedicated views:

   1. PRIMARY WORKSPACE — Core active operations & real-time status
      - Field Ops      (/)
      - Node Map       (/map)

   2. MANAGEMENT PORTAL — Lists, records, data tables, configs
      - Command Dashboard  (/dashboard)
      - Alert Dispatch     (/dispatch)

   3. USER / PROFILE SETTINGS — Account, auth, security, prefs
      - Settings       (/settings)

   4. SYSTEM / ADMIN LOGS — Audit trails, history, system states
      - System Logs    (/system)
   ================================================================ */

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Primary Workspace",
    items: [
      { to: "/", label: "Field Ops", icon: Home },
      { to: "/map", label: "Node Map", icon: Map },
    ],
  },
  {
    title: "Management Portal",
    items: [
      { to: "/dashboard", label: "Command Dashboard", icon: LayoutDashboard },
      { to: "/dispatch", label: "Alert Dispatch", icon: Bell },
    ],
  },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});
  const location = useLocation();

  const activeAlerts = useMessageStore(
    (s) => s.alerts.filter((a) => a.status !== "resolved").length,
  );

  /* Lock body scroll when mobile sidebar is open */
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  /* Collapse Management Portal by default on very small screens */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 319px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setCollapsedGroups({ 1: true });
      }
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  const toggleGroup = useCallback((index: number) => {
    setCollapsedGroups((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const handleOverlayClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    },
    [],
  );

  return (
    <div className="h-dvh flex flex-col bg-surface-0 text-primary overflow-hidden">
      {/* ============================================================
          TOP BAR — Global header visible on all breakpoints.
          On micro-mobile we compress padding and hide non-essential text.
          ============================================================ */}
      <header className="flex-shrink-0 flex items-center justify-between gap-3 px-3 py-2.5 xs:px-4 xs:py-3 md:px-5 md:py-3.5 border-b border-default bg-surface-1/80 backdrop-glass z-30">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          {/* Mobile menu toggle — strictly 48x48 touch target */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            onKeyDown={handleMenuKeyDown}
            className="md:hidden touch-target inline-flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-surface-3 transition-colors"
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={sidebarOpen}
            aria-controls="primary-sidebar"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden xs:inline-flex items-center justify-center w-10 h-10 rounded-full bg-mesh/10 border border-mesh/20 text-mesh flex-shrink-0 overflow-hidden">
              <LogoIcon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base-fluid font-bold tracking-tight truncate">
                <span className="text-mesh">PDRRMO</span>{" "}
                <span className="text-primary hidden sm:inline">Mesh</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Connection Status — simplified on micro-mobile via CSS */}
        <div className="flex-shrink-0">
          <ConnectionStatus />
        </div>
      </header>

      {/* ============================================================
          MAIN SHELL — Sidebar + Content
          ============================================================ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* --------------------------------------------------------
            SIDEBAR — Responsive behavior:
            - < md (768px): Fixed overlay, slides in/out
            - >= md: Static relative sidebar
            - >= lg (1200px): Slightly wider, larger typography
            -------------------------------------------------------- */}
        <aside
          id="primary-sidebar"
          className={`
            fixed md:relative inset-y-0 left-0 z-40
            w-[16.5rem] xs:w-[17rem] md:w-[15rem] lg:w-[16.5rem] xl:w-[18rem]
            bg-surface-1 border-r border-default
            transform transition-transform duration-200 ease-out
            flex flex-col
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
          aria-label="Main navigation"
        >
          {/* Sidebar header (mobile only) */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-subtle">
            <span className="text-sm font-semibold text-secondary">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="touch-target-sm inline-flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-surface-3 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Scrollable nav area */}
          <nav className="flex-1 overflow-y-auto p-3 md:p-2.5 lg:p-3 space-y-5 md:space-y-4">
            {navGroups.map((group, groupIndex) => {
              const isCollapsed = collapsedGroups[groupIndex] ?? false;
              return (
                <div key={group.title}>
                  {/* Group header — collapsible on mobile */}
                  <button
                    onClick={() => toggleGroup(groupIndex)}
                    className="w-full flex items-center justify-between gap-2 mb-1.5 px-2.5 py-1.5 rounded-md text-xs-fluid font-semibold text-tertiary uppercase tracking-wider hover:bg-surface-3 transition-colors md:pointer-events-none md:cursor-default"
                    aria-expanded={!isCollapsed}
                    aria-controls={`nav-group-${groupIndex}`}
                  >
                    <span className="truncate">{group.title}</span>
                    <span className="md:hidden flex-shrink-0">
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </span>
                  </button>

                  <div
                    id={`nav-group-${groupIndex}`}
                    className={`space-y-0.5 ${isCollapsed ? "hidden md:block" : ""}`}
                  >
                    {group.items.map((item) => {
                      const isDispatch = item.to === "/dispatch";
                      const badgeCount = isDispatch ? activeAlerts : undefined;
                      const ItemIcon = item.icon;

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.to === "/"}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `group flex items-center gap-2.5 md:gap-2 px-2.5 py-2 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 rounded-lg text-sm-fluid font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-info/60 ${
                              isActive
                                ? "bg-surface-3 text-primary border border-default shadow-sm"
                                : "text-secondary hover:bg-surface-3/60 hover:text-primary border border-transparent"
                            }`
                          }
                        >
                          <ItemIcon
                            className={`w-[1.125rem] h-[1.125rem] flex-shrink-0 transition-colors ${
                              location.pathname === item.to ||
                              (item.to !== "/" && location.pathname.startsWith(item.to))
                                ? "text-mesh"
                                : "text-tertiary group-hover:text-secondary"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.label}</span>

                          {badgeCount !== undefined && (
                            <span
                              className={`ml-auto flex-shrink-0 text-[0.625rem] font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center ${
                                badgeCount > 0
                                  ? "bg-emergency/15 text-emergency border border-emergency/20 animate-pulse-slow"
                                  : "bg-surface-3 text-tertiary border border-subtle"
                              }`}
                              aria-label={`${badgeCount} active alerts`}
                            >
                              {badgeCount}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="hidden md:block p-3 lg:p-4 border-t border-subtle">
            <div className="rounded-lg bg-surface-2 border border-subtle px-3 py-2">
              <p className="text-[0.625rem] text-tertiary uppercase tracking-wider font-semibold mb-1">
                System
              </p>
              <div className="flex items-center gap-2 text-xs-fluid text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-mesh animate-pulse" aria-hidden="true" />
                Mesh Online
              </div>
            </div>
          </div>
        </aside>

        {/* --------------------------------------------------------
            MOBILE OVERLAY — Dims content when sidebar is open.
            Only rendered < md to keep DOM light on desktop.
            -------------------------------------------------------- */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] animate-fade-in"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        )}

        {/* --------------------------------------------------------
            MAIN CONTENT AREA
            - overflow-y-auto for independent scrolling
            - container-content caps width on 4K displays
            -------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-surface-0 relative">
          <Outlet />
        </main>
      </div>

      <InstallPrompt />
    </div>
  );
}
