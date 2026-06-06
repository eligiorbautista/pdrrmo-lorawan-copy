import { describe, it, expect } from "vitest";
import {
  formatEmergencyMessage,
  parseEmergencyMessage,
  createAlert,
} from "./emergency";
import type { EmergencyPayload } from "./types";

const samplePayload: EmergencyPayload = {
  type: "EMERGENCY",
  severity: "EMERGENCY",
  timestamp: 1717632000000,
  nodeId: "ABC123",
  nodeName: "Firetruck 1",
  gps: { lat: 14.5995, lng: 120.9842 },
  message: "Fire at Barangay 5, need water tankers",
};

describe("formatEmergencyMessage", () => {
  it("formats a full emergency payload with GPS and message", () => {
    const result = formatEmergencyMessage(samplePayload);
    expect(result).toContain("🚨EMERGENCY");
    expect(result).toContain("EMERGENCY");
    expect(result).toContain("ABC123");
    expect(result).toContain("Firetruck 1");
    expect(result).toContain("14.5995,120.9842");
    expect(result).toContain("Fire at Barangay 5");
  });

  it("formats a minimal payload without GPS or message", () => {
    const result = formatEmergencyMessage({
      type: "EMERGENCY",
      severity: "URGENT",
      timestamp: 1,
      nodeId: "N1",
      nodeName: "Node 1",
    });
    expect(result).toBe("🚨EMERGENCY|URGENT|N1|Node 1");
  });
});

describe("parseEmergencyMessage", () => {
  it("parses a valid emergency message with all fields", () => {
    const text = formatEmergencyMessage(samplePayload);
    const parsed = parseEmergencyMessage(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe("EMERGENCY");
    expect(parsed!.severity).toBe("EMERGENCY");
    expect(parsed!.nodeId).toBe("ABC123");
    expect(parsed!.nodeName).toBe("Firetruck 1");
    expect(parsed!.gps).toEqual({ lat: 14.5995, lng: 120.9842 });
    expect(parsed!.message).toBe("Fire at Barangay 5, need water tankers");
  });

  it("parses a minimal emergency message", () => {
    const text = "🚨EMERGENCY|INFO|N2|Sensor 3";
    const parsed = parseEmergencyMessage(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.severity).toBe("INFO");
    expect(parsed!.nodeId).toBe("N2");
    expect(parsed!.nodeName).toBe("Sensor 3");
    expect(parsed!.gps).toBeUndefined();
    expect(parsed!.message).toBeUndefined();
  });

  it("returns null for non-emergency messages", () => {
    expect(parseEmergencyMessage("Hello world")).toBeNull();
    expect(parseEmergencyMessage("")).toBeNull();
  });

  it("returns null for malformed emergency messages", () => {
    expect(parseEmergencyMessage("🚨EMERGENCY")).toBeNull();
    expect(parseEmergencyMessage("🚨EMERGENCY|BAD")).toBeNull();
    expect(parseEmergencyMessage("🚨EMERGENCY|INVALID_TYPE|N1|Name")).toBeNull();
  });

  it("handles messages with pipe characters in the message field", () => {
    const text = "🚨EMERGENCY|EMERGENCY|N3|Ops|14.5,121.0|msg|with|pipes";
    const parsed = parseEmergencyMessage(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.message).toBe("msg|with|pipes");
  });
});

describe("createAlert", () => {
  it("creates an alert record from a payload", () => {
    const alert = createAlert(samplePayload);
    expect(alert.status).toBe("sent");
    expect(alert.retryCount).toBe(0);
    expect(alert.payload).toEqual(samplePayload);
    expect(alert.id).toContain("alert-");
    expect(alert.createdAt).toBeInstanceOf(Date);
  });

  it("generates unique IDs for different alerts", () => {
    const a1 = createAlert(samplePayload);
    const a2 = createAlert({ ...samplePayload, nodeId: "OTHER" });
    expect(a1.id).not.toBe(a2.id);
  });
});
