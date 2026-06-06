import { useState } from "react";
import {
  User,
  Monitor,
  Shield,
  Bell,
  Save,
  Check,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react";
import { PageWrapper, ContentPanel } from "@/components/PageWrapper";

export function Settings() {
  const [activeTab, setActiveTab] = useState<"profile" | "display" | "security" | "notifications">("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { key: "profile" as const, label: "Profile", icon: User },
    { key: "display" as const, label: "Display", icon: Monitor },
    { key: "security" as const, label: "Security", icon: Shield },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  return (
    <PageWrapper
      title="User Settings"
      subtitle="Manage your account, preferences, and security configuration"
      icon={User}
      action={
        <button
          onClick={handleSave}
          className="touch-target-sm inline-flex items-center gap-2 px-4 py-2 bg-mesh hover:bg-mesh/90 text-surface-0 text-sm font-semibold rounded-lg transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              Save Changes
            </>
          )}
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-4 md:gap-6">
        {/* Settings navigation — stacked on mobile, sidebar on desktop */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 touch-target-sm ${
                  isActive
                    ? "bg-surface-3 text-primary border border-default"
                    : "text-secondary hover:bg-surface-2 hover:text-primary border border-transparent"
                }`}
              >
                <TabIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Settings panels */}
        <div className="space-y-4 md:space-y-5">
          {activeTab === "profile" && (
            <ContentPanel title="Account Profile" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <FormField label="Display Name" id="display-name">
                  <input
                    id="display-name"
                    type="text"
                    defaultValue="Field Operator"
                    className="w-full bg-surface-1 border border-default rounded-lg px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-info focus:ring-1 focus:ring-info/30 transition-all"
                    placeholder="Enter display name"
                  />
                </FormField>
                <FormField label="Role / Callsign" id="callsign">
                  <input
                    id="callsign"
                    type="text"
                    defaultValue="OP-1"
                    className="w-full bg-surface-1 border border-default rounded-lg px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-info focus:ring-1 focus:ring-info/30 transition-all"
                    placeholder="Enter callsign"
                  />
                </FormField>
                <FormField label="Email Address" id="email">
                  <input
                    id="email"
                    type="email"
                    defaultValue="operator@pdrrmo.local"
                    className="w-full bg-surface-1 border border-default rounded-lg px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-info focus:ring-1 focus:ring-info/30 transition-all"
                    placeholder="operator@example.com"
                  />
                </FormField>
                <FormField label="Node ID" id="node-id">
                  <input
                    id="node-id"
                    type="text"
                    defaultValue="0xAB12"
                    disabled
                    className="w-full bg-surface-1 border border-subtle rounded-lg px-3 py-2.5 text-sm text-tertiary cursor-not-allowed"
                  />
                </FormField>
              </div>
            </ContentPanel>
          )}

          {activeTab === "display" && (
            <ContentPanel title="Display Preferences" icon={Monitor}>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-1 border border-subtle">
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-warn" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-primary">High Contrast Mode</p>
                      <p className="text-xs text-tertiary">Increase contrast for visibility in sunlight</p>
                    </div>
                  </div>
                  <ToggleSwitch id="high-contrast" defaultChecked={false} />
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-1 border border-subtle">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-info" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-primary">Dim Mode</p>
                      <p className="text-xs text-tertiary">Reduce brightness for night operations</p>
                    </div>
                  </div>
                  <ToggleSwitch id="dim-mode" defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-1 border border-subtle">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-mesh" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-primary">Compact Density</p>
                      <p className="text-xs text-tertiary">Show more data per screen on small devices</p>
                    </div>
                  </div>
                  <ToggleSwitch id="compact-mode" defaultChecked={false} />
                </div>
              </div>
            </ContentPanel>
          )}

          {activeTab === "security" && (
            <ContentPanel title="Security Settings" icon={Shield}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <FormField label="Current Password" id="current-password">
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-surface-1 border border-default rounded-lg px-3 py-2.5 pr-10 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-info focus:ring-1 focus:ring-info/30 transition-all"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-secondary transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormField>
                <FormField label="New Password" id="new-password">
                  <input
                    id="new-password"
                    type="password"
                    className="w-full bg-surface-1 border border-default rounded-lg px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-info focus:ring-1 focus:ring-info/30 transition-all"
                    placeholder="Enter new password"
                  />
                </FormField>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-warn/5 border border-warn/10">
                <p className="text-xs text-warn">
                  Changing your password will require you to reconnect all linked devices.
                </p>
              </div>
            </ContentPanel>
          )}

          {activeTab === "notifications" && (
            <ContentPanel title="Notification Preferences" icon={Bell}>
              <div className="space-y-3">
                {[
                  { id: "notify-emergency", label: "Emergency Alerts", desc: "Immediate notifications for EMERGENCY severity" },
                  { id: "notify-urgent", label: "Urgent Alerts", desc: "Notifications for URGENT severity items" },
                  { id: "notify-node", label: "Node Status Changes", desc: "When nodes go online or offline" },
                  { id: "notify-message", label: "New Messages", desc: "Incoming mesh messages directed to you" },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-1 border border-subtle"
                  >
                    <div>
                      <p className="text-sm font-medium text-primary">{item.label}</p>
                      <p className="text-xs text-tertiary">{item.desc}</p>
                    </div>
                    <ToggleSwitch id={item.id} defaultChecked={item.id !== "notify-message"} />
                  </div>
                ))}
              </div>
            </ContentPanel>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

/* ================================================================
   FORM PRIMITIVES — Accessible, touch-friendly inputs
   ================================================================ */

function FormField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-secondary uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleSwitch({
  id,
  defaultChecked = false,
}: {
  id: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => setChecked((c) => !c)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-info/60 ${
        checked ? "bg-mesh" : "bg-surface-4"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
