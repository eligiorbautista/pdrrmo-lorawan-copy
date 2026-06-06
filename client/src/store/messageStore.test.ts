import { describe, it, expect, beforeEach } from "vitest";
import { useMessageStore } from "./messageStore";
import type { AppMessage, EmergencyAlert } from "@/lib/types";

function makeMsg(overrides: Partial<AppMessage> = {}): AppMessage {
  return {
    id: "msg-1",
    text: "Test message",
    from: 0x1234,
    to: "broadcast",
    channel: 0,
    timestamp: new Date(),
    direction: "sent",
    acked: false,
    emergency: false,
    ...overrides,
  };
}

function makeAlert(overrides: Partial<EmergencyAlert> = {}): EmergencyAlert {
  return {
    id: "alert-1",
    payload: {
      type: "EMERGENCY",
      severity: "EMERGENCY",
      timestamp: Date.now(),
      nodeId: "N1",
      nodeName: "Test Node",
    },
    status: "sent",
    retryCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("messageStore", () => {
  beforeEach(() => {
    useMessageStore.setState({ messages: [], alerts: [] });
  });

  describe("addMessage", () => {
    it("adds a message to the store", () => {
      const msg = makeMsg();
      useMessageStore.getState().addMessage(msg);
      expect(useMessageStore.getState().messages).toHaveLength(1);
      expect(useMessageStore.getState().messages[0].text).toBe("Test message");
    });

    it("preserves insertion order", () => {
      useMessageStore.getState().addMessage(makeMsg({ id: "1", text: "First" }));
      useMessageStore.getState().addMessage(makeMsg({ id: "2", text: "Second" }));
      const texts = useMessageStore.getState().messages.map((m) => m.text);
      expect(texts).toEqual(["First", "Second"]);
    });

    it("caps at 500 messages", () => {
      for (let i = 0; i < 600; i++) {
        useMessageStore.getState().addMessage(makeMsg({ id: `msg-${i}` }));
      }
      expect(useMessageStore.getState().messages.length).toBeLessThanOrEqual(500);
    });
  });

  describe("addAlert", () => {
    it("adds an alert to the store", () => {
      useMessageStore.getState().addAlert(makeAlert());
      expect(useMessageStore.getState().alerts).toHaveLength(1);
      expect(useMessageStore.getState().alerts[0].status).toBe("sent");
    });
  });

  describe("updateAlert", () => {
    it("updates an existing alert status", () => {
      useMessageStore.getState().addAlert(makeAlert({ id: "alert-1" }));
      useMessageStore.getState().updateAlert("alert-1", { status: "acked" });
      expect(useMessageStore.getState().alerts[0].status).toBe("acked");
    });

    it("does not affect other alerts", () => {
      useMessageStore.getState().addAlert(makeAlert({ id: "alert-1" }));
      useMessageStore.getState().addAlert(makeAlert({ id: "alert-2" }));
      useMessageStore.getState().updateAlert("alert-1", { status: "failed" });
      expect(useMessageStore.getState().alerts[0].status).toBe("failed");
      expect(useMessageStore.getState().alerts[1].status).toBe("sent");
    });
  });

  describe("clearMessages", () => {
    it("clears all messages and alerts", () => {
      useMessageStore.getState().addMessage(makeMsg());
      useMessageStore.getState().addAlert(makeAlert());
      useMessageStore.getState().clearMessages();
      expect(useMessageStore.getState().messages).toHaveLength(0);
      expect(useMessageStore.getState().alerts).toHaveLength(0);
    });
  });
});
