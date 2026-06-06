import { NodeList } from "@/components/NodeList";
import { MessageThread } from "@/components/MessageThread";
import { EmergencyButton } from "@/components/EmergencyButton";
import { useDeviceStore } from "@/store/deviceStore";
export function FieldOps() {
  const isConnected = useDeviceStore((s) => s.phase === "configured");
  const myNodeNum = useDeviceStore((s) => s.myNodeNum);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Field Operations</h2>
        <p className="text-sm text-white/50 mt-1">
          {isConnected
            ? `Connected as node ${myNodeNum?.toString(16).toUpperCase() ?? "—"}`
            : "Connect to a Meshtastic device to begin"}
        </p>
      </div>

      {/* Emergency button */}
      <EmergencyButton />
      {/* Nodes section */}
      <section>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Nearby Nodes
        </h3>
        <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
          <NodeList />
        </div>
      </section>

      {/* Messages section */}
      <section>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Messages
        </h3>
        <MessageThread />
      </section>
    </div>
  );
}
