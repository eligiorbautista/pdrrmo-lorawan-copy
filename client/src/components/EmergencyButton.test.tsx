import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmergencyButton } from "./EmergencyButton";
import { useDeviceStore } from "@/store/deviceStore";
import { useMessageStore } from "@/store/messageStore";

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};
Object.defineProperty(global.navigator, "geolocation", {
  value: mockGeolocation,
  writable: true,
});

// Mock AudioContext
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};
const mockGain = { connect: vi.fn() };
const mockCtx = {
  createOscillator: () => mockOscillator,
  createGain: () => mockGain,
  close: vi.fn(),
  destination: {},
};
(global as unknown as { AudioContext: unknown }).AudioContext = vi.fn(
  () => mockCtx,
);

function setupConnected() {
  useDeviceStore.setState({
    connection: {
      sendText: vi.fn().mockResolvedValue(42),
      events: {},
    } as unknown as ReturnType<typeof useDeviceStore.getState>["connection"],
    phase: "configured",
    myNodeNum: 0x1234,
    bluetoothDevice: null,
  });
  useMessageStore.setState({ alerts: [] });
  mockGeolocation.getCurrentPosition.mockReset();
}

function setupDisconnected() {
  useDeviceStore.setState({
    connection: null,
    phase: "idle",
    myNodeNum: null,
    bluetoothDevice: null,
  });
  useMessageStore.setState({ alerts: [] });
}

describe("EmergencyButton", () => {
  describe("when connected", () => {
    beforeEach(() => {
      setupConnected();
    });

    it("renders the initial emergency button", () => {
      render(<EmergencyButton />);
      expect(screen.getByText("EMERGENCY")).toBeDefined();
      expect(screen.getByText("Press to send alert")).toBeDefined();
    });

    it("shows confirmation screen on first press", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback) => {
          // Never resolve — we just test the confirmation UI
        },
      );

      render(<EmergencyButton />);
      fireEvent.click(screen.getByRole("button"));

      // Should now show confirmation
      expect(screen.getByText("Confirm Emergency Alert")).toBeDefined();
      expect(screen.getByText("SEND EMERGENCY ALERT")).toBeDefined();
    });

    it("returns to initial state on cancel", () => {
      render(<EmergencyButton />);
      fireEvent.click(screen.getByRole("button")); // initial press
      fireEvent.click(screen.getByText("Cancel")); // cancel
      expect(screen.getByText("EMERGENCY")).toBeDefined();
      expect(screen.getByText("Press to send alert")).toBeDefined();
    });

    it("transitions to sending state when confirmed", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          success({ coords: { latitude: 14, longitude: 121 } } as GeolocationPosition);
        },
      );

      render(<EmergencyButton />);
      fireEvent.click(screen.getByRole("button")); // initial press
      fireEvent.click(screen.getByText("SEND EMERGENCY ALERT")); // confirm

      // Should show sending state
      expect(
        screen.getByText("Sending Emergency Alert…"),
      ).toBeDefined();
    });
  });

  describe("when disconnected", () => {
    beforeEach(() => {
      setupDisconnected();
    });

    it("renders disabled button", () => {
      render(<EmergencyButton />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });
});
