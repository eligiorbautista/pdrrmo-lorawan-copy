import { create } from "zustand";
import type { AppMessage, EmergencyAlert } from "@/lib/types";

interface MessageState {
  messages: AppMessage[];
  alerts: EmergencyAlert[];

  addMessage: (msg: AppMessage) => void;
  addMessages: (msgs: AppMessage[]) => void;
  addAlert: (alert: EmergencyAlert) => void;
  updateAlert: (id: string, update: Partial<EmergencyAlert>) => void;
  clearMessages: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  alerts: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg].slice(-500), // keep last 500
    })),

  addMessages: (msgs) =>
    set((state) => ({
      messages: [...state.messages, ...msgs].slice(-500),
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, alert].slice(-200),
    })),

  updateAlert: (id, update) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, ...update } : a,
      ),
    })),

  clearMessages: () => set({ messages: [], alerts: [] }),
}));
