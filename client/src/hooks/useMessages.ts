import { useCallback, useEffect } from "react";
import { Types } from "@meshtastic/core";
import { useDeviceStore } from "@/store/deviceStore";
import { useMessageStore } from "@/store/messageStore";
import type { AppMessage } from "@/lib/types";

/**
 * Hook for sending and receiving text messages via the connected MeshDevice.
 *
 * Subscribes to incoming text messages and provides a `sendText` function.
 * All messages flow through the messageStore.
 */
export function useMessages() {
  const connection = useDeviceStore((s) => s.connection);
  const myNodeNum = useDeviceStore((s) => s.myNodeNum);
  const addMessage = useMessageStore((s) => s.addMessage);

  // Subscribe to incoming text messages
  useEffect(() => {
    if (!connection) return;

    const unsub = connection.events.onMessagePacket.subscribe(
      (packet: Types.PacketMetadata<string>) => {
        const msg: AppMessage = {
          id: `msg-${packet.id}-${Date.now()}`,
          text: packet.data,
          from: packet.from,
          to: packet.to === 0xffffffff ? "broadcast" : packet.to,
          channel: packet.channel,
          timestamp: packet.rxTime,
          direction: packet.from === (myNodeNum ?? 0) ? "sent" : "received",
          acked: true, // If we received it, it was delivered
          emergency: false,
        };
        addMessage(msg);
      },
    );

    return () => {
      unsub();
    };
  }, [connection, myNodeNum, addMessage]);

  const sendText = useCallback(
    async (
      text: string,
      destination?: number | "broadcast",
      wantAck = true,
    ) => {
      if (!connection) return;

      const id = await connection.sendText(
        text,
        destination ?? "broadcast",
        wantAck,
      );

      // Add sent message to store immediately (echoResponse is true by default)
      // The onMessagePacket handler above will also fire for echo'd messages
      const msg: AppMessage = {
        id: `msg-${id}-${Date.now()}`,
        text,
        from: myNodeNum ?? 0,
        to: destination ?? "broadcast",
        channel: 0,
        timestamp: new Date(),
        direction: "sent",
        acked: false,
        emergency: false,
      };
      addMessage(msg);
    },
    [connection, myNodeNum, addMessage],
  );

  return {
    sendText,
    isReady: connection !== null && myNodeNum !== null,
  };
}
