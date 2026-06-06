import { Radio, Mail, Users } from "lucide-react";
import { NodeList } from "@/components/NodeList";
import { MessageThread } from "@/components/MessageThread";
import { EmergencyButton } from "@/components/EmergencyButton";
import { PageWrapper, ContentPanel } from "@/components/PageWrapper";
import { useDeviceStore } from "@/store/deviceStore";

export function FieldOps() {
  const isConnected = useDeviceStore((s) => s.phase === "configured");
  const myNodeNum = useDeviceStore((s) => s.myNodeNum);

  return (
    <PageWrapper
      title="Field Operations"
      subtitle={
        isConnected
          ? `Connected as node ${myNodeNum?.toString(16).toUpperCase() ?? "—"}`
          : "Connect to a Meshtastic device to begin"
      }
      icon={Radio}
    >
      <div className="space-y-4 md:space-y-5">
        {/* Emergency button */}
        <EmergencyButton />

        {/* Nodes section */}
        <ContentPanel title="Nearby Nodes" icon={Users}>
          <NodeList />
        </ContentPanel>

        {/* Messages section */}
        <ContentPanel title="Messages" icon={Mail}>
          <MessageThread />
        </ContentPanel>
      </div>
    </PageWrapper>
  );
}
