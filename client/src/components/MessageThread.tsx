import { useState, useRef, useEffect } from "react";
import { Megaphone, Check, Loader, Send } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useMessageStore } from "@/store/messageStore";
import { useDeviceStore } from "@/store/deviceStore";
import type { AppMessage } from "@/lib/types";

export function MessageThread() {
  const messages = useMessageStore((s) => s.messages);
  const myNodeNum = useDeviceStore((s) => s.myNodeNum);
  const isConnected = useDeviceStore((s) => s.phase === "configured");
  const { sendText, isReady } = useMessages();

  const [input, setInput] = useState("");
  const [destination, setDestination] = useState<"broadcast" | number>(
    "broadcast",
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !isReady) return;
    setInput("");
    await sendText(
      text,
      destination === "broadcast" ? "broadcast" : destination,
      true,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-xl bg-surface-2 border border-default p-6 text-center text-tertiary text-sm">
        Connect to a Meshtastic device to send and receive messages.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl bg-surface-2 border border-default overflow-hidden">
      {/* Destination selector */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-subtle bg-surface-1/50">
        <label htmlFor="msg-dest" className="text-xs text-tertiary font-medium">
          To:
        </label>
        <select
          id="msg-dest"
          value={
            destination === "broadcast" ? "broadcast" : destination.toString()
          }
          onChange={(e) =>
            setDestination(
              e.target.value === "broadcast"
                ? "broadcast"
                : Number(e.target.value),
            )
          }
          className="bg-surface-1 text-primary text-xs rounded-lg px-2.5 py-1.5 border border-default focus:outline-none focus:border-info focus:ring-1 focus:ring-info/30"
        >
          <option value="broadcast">Broadcast (All Nodes)</option>
          {Array.from(useDeviceStore.getState().nodes.values()).map((node) => (
            <option key={node.nodeNum} value={node.nodeNum.toString()}>
              {node.longName || node.shortName}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[60vh]"
      >
        {messages.length === 0 && (
          <div className="text-center text-tertiary text-sm py-8">
            No messages yet. Send your first message below.
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.from === myNodeNum}
          />
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-subtle p-3 bg-surface-1/50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={2}
            className="flex-1 bg-surface-1 text-primary text-sm rounded-lg px-3 py-2.5 border border-default resize-none focus:outline-none focus:border-info focus:ring-1 focus:ring-info/30 placeholder:text-tertiary transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="touch-target-sm px-4 py-2 bg-mesh hover:bg-mesh/90 disabled:opacity-30 disabled:cursor-not-allowed text-surface-0 text-sm font-medium rounded-lg transition-colors self-end inline-flex items-center gap-1.5"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: AppMessage;
  isOwn: boolean;
}) {
  const isBroadcast = message.to === "broadcast";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[85%] rounded-xl px-4 py-2.5 text-sm
          ${isOwn
            ? "bg-info/10 text-primary rounded-br-sm border border-info/20"
            : "bg-surface-1 text-primary rounded-bl-sm border border-default"}
        `}
      >
        {!isOwn && (
          <div className="text-xs text-tertiary mb-1">
            From: {nodeLabel(message.from)}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-tertiary">
          <span>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isBroadcast && (
            <span className="inline-flex items-center gap-1">
              <Megaphone className="w-3 h-3" aria-hidden="true" />
              Broadcast
            </span>
          )}
          {isOwn && (
            <span className="inline-flex items-center gap-1">
              {message.acked ? (
                <>
                  <Check className="w-3 h-3 text-mesh" aria-hidden="true" />
                  <span className="text-mesh">Delivered</span>
                </>
              ) : (
                <>
                  <Loader className="w-3 h-3 animate-spin" aria-hidden="true" />
                  Sending
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function nodeLabel(nodeNum: number): string {
  const nodes = useDeviceStore.getState().nodes;
  const node = nodes.get(nodeNum);
  return node?.shortName ?? nodeNum.toString(16).toUpperCase().slice(-4);
}
