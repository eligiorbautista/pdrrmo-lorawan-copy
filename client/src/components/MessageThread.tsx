import { useState, useRef, useEffect } from "react";
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
      <div className="rounded-xl bg-gray-900 border border-white/10 p-6 text-center text-white/40 text-sm">
        Connect to a Meshtastic device to send and receive messages.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
      {/* Destination selector */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-gray-800/50">
        <label className="text-xs text-white/50">To:</label>
        <select
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
          className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-mesh-blue/50"
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
          <div className="text-center text-white/30 text-sm py-8">
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
      <div className="border-t border-white/10 p-3 bg-gray-800/50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={2}
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-white/10 resize-none focus:outline-none focus:border-mesh-blue/50 placeholder-white/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 bg-mesh-green hover:bg-mesh-green/80 disabled:opacity-30 text-white text-sm font-medium rounded-lg transition-colors self-end"
          >
            Send
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
          max-w-[85%] rounded-xl px-4 py-2 text-sm
          ${isOwn
            ? "bg-mesh-blue/20 text-white rounded-br-sm"
            : "bg-white/5 text-white rounded-bl-sm border border-white/5"}
        `}
      >
        {!isOwn && (
          <div className="text-xs text-white/50 mb-1">
            From: {nodeLabel(message.from)}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-white/30">
          <span>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isBroadcast && <span>📢 Broadcast</span>}
          {isOwn && (
            <span>{message.acked ? "✓ Delivered" : "⏳ Sending"}</span>
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
