import { useMemo } from "react";

/** Any icon-like component that accepts className and aria-hidden. */
type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: IconComponent;
  action?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * PageWrapper — Uniform page layout wrapper
 *
 * Provides consistent header, title, subtitle, and constrained content
 * across all application views. Implements strict max-width constraints
 * for large displays and TVs to prevent awkward stretching.
 */
export function PageWrapper({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  fullWidth = false,
}: PageWrapperProps) {
  const headerId = useMemo(
    () => `page-header-${title.toLowerCase().replace(/\s+/g, "-")}`,
    [title],
  );

  return (
    <section
      aria-labelledby={headerId}
      className="flex flex-col min-h-full animate-fade-in"
    >
      {/* Page Header */}
      <header className="border-b border-default bg-surface-1/60 backdrop-glass sticky top-0 z-10">
        <div
          className={`container-content py-4 md:py-5 ${fullWidth ? "" : ""}`}
        >
          <div className="flex items-start md:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                {Icon && (
                  <span className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-3 border border-default text-secondary overflow-hidden">
                    <Icon className="w-full h-full" aria-hidden="true" />
                  </span>
                )}
                <h1
                  id={headerId}
                  className="text-xl-fluid font-bold text-primary tracking-tight truncate"
                >
                  {title}
                </h1>
              </div>
              {subtitle && (
                <p className="text-sm-fluid text-secondary max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <div className="flex-shrink-0 mt-0.5 md:mt-0">{action}</div>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="flex-1">
        {fullWidth ? (
          <div className="animate-slide-up">{children}</div>
        ) : (
          <div className="container-content py-4 md:py-6 animate-slide-up">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * ContentPanel — Standardized panel for grouped content.
 * Used inside PageWrapper for cards, lists, and tables.
 */
interface ContentPanelProps {
  children: React.ReactNode;
  title?: string;
  icon?: IconComponent;
  action?: React.ReactNode;
  className?: string;
}

export function ContentPanel({
  children,
  title,
  icon: Icon,
  action,
  className = "",
}: ContentPanelProps) {
  return (
    <div
      className={`panel-default overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4 border-b border-subtle">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 overflow-hidden">
                <Icon className="w-full h-full text-tertiary" aria-hidden="true" />
              </span>
            )}
            {title && (
              <h2 className="text-sm-fluid font-semibold text-secondary uppercase tracking-wider truncate">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

/**
 * StatCard — Metric card for dashboards and management views.
 */
interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: IconComponent;
  tone?: "neutral" | "mesh" | "emergency" | "warn" | "info" | "command";
}

const toneMap = {
  neutral: {
    border: "border-default",
    bg: "bg-surface-2",
    text: "text-primary",
    icon: "text-tertiary",
    glow: "",
  },
  mesh: {
    border: "border-mesh/20",
    bg: "bg-mesh/5",
    text: "text-mesh",
    icon: "text-mesh",
    glow: "shadow-glow-mesh",
  },
  emergency: {
    border: "border-emergency/20",
    bg: "bg-emergency/5",
    text: "text-emergency",
    icon: "text-emergency",
    glow: "shadow-glow-emergency",
  },
  warn: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    icon: "text-amber-400",
    glow: "",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    icon: "text-blue-400",
    glow: "",
  },
  command: {
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    icon: "text-violet-400",
    glow: "",
  },
};

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: StatCardProps) {
  const style = toneMap[tone];
  return (
    <div
      className={`rounded-xl border p-4 md:p-5 transition-all duration-200 hover:border-strong ${style.bg} ${style.border} ${style.glow}`}
    >
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-xs-fluid font-medium text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
          <Icon className={`w-full h-full ${style.icon}`} aria-hidden="true" />
        </span>
      </div>
      <p className={`text-2xl-fluid font-bold ${style.text}`}>{value}</p>
      {detail && (
        <p className="text-xs-fluid text-tertiary mt-1">{detail}</p>
      )}
    </div>
  );
}
