import { useEffect, useRef, useState, useCallback } from "react";
import { Send } from "lucide-react";

export default function ClassroomChat({ classroomId, me, storageKey, socket }) {
  const [messages, setMessages] = useState(() => {
    // ── Rehydrate from localStorage on first render ──
    if (!storageKey) return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // ── Persist to localStorage whenever messages change ──────────────────────
  useEffect(() => {
    if (!storageKey) return;
    try {
      // Keep last 300 messages to avoid quota issues
      const toSave = messages.slice(-300);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // Quota exceeded — trim and retry
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
      } catch {}
    }
  }, [messages, storageKey]);

  // ── Chat socket setup using the shared ClassroomPage socket ──────────────
  useEffect(() => {
    if (!socket) return;

    socket.emit("chat:join", { classroomId });

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleHistory = (history) => {
      setMessages((prev) => {
        const serverIds = new Set(history.map((m) => m.id || m._id));
        const localOnly = prev.filter((m) => !(m.id || m._id) || !serverIds.has(m.id || m._id));
        return [...history, ...localOnly];
      });
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:history", handleHistory);

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:history", handleHistory);
    };
  }, [classroomId, socket]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = useCallback(() => {
    const text = input.trim();
    if (!text || !socket) return;

    const msg = {
      id: `local-${Date.now()}`,
      classroomId,
      senderId: me?.user?._id,
      senderName: me?.user?.name || "You",
      role: me?.role || "student",
      text,
      ts: new Date().toISOString(),
    };

    // Optimistic add
    setMessages((prev) => [...prev, msg]);
    socket.emit("chat:message", msg);
    setInput("");
  }, [input, classroomId, me, socket]);

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const myId = me?.user?._id;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Message list */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "8px 4px", display: "flex", flexDirection: "column", gap: 6 }}
        className="custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-12">
            No messages yet. Say hello! 👋
          </div>
        )}
        {messages.map((m, i) => {
          const isMine = m.senderId && myId && String(m.senderId) === String(myId);
          return (
            <div
              key={m.id || m._id || i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
              }}
            >
              {/* Sender label */}
              {!isMine && (
                <div className="text-[11px] text-slate-400 font-bold px-2 mb-0.5">
                  {m.senderName}
                  {m.role === "teacher" && (
                    <span className="ml-1 text-indigo-500">(teacher)</span>
                  )}
                </div>
              )}
              <div
                style={{
                  maxWidth: "75%",
                  padding: "8px 12px",
                  borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isMine ? "#4f46e5" : "#f1f5f9",
                  color: isMine ? "#fff" : "#1e293b",
                  fontSize: 13,
                  fontWeight: 500,
                  wordBreak: "break-word",
                }}
              >
                {m.text}
              </div>
              <div className="text-[10px] text-slate-300 px-2 mt-0.5">
                {m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: 8,
          paddingTop: 10,
          borderTop: "1px solid #e2e8f0",
          marginTop: 4,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1.5px solid #e2e8f0",
            fontSize: 13,
            outline: "none",
            fontWeight: 500,
            background: "#f8fafc",
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            cursor: input.trim() ? "pointer" : "not-allowed",
            opacity: input.trim() ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 700,
            fontSize: 13,
            transition: "opacity 0.15s",
          }}
        >
          <Send style={{ width: 14, height: 14 }} />
          Send
        </button>
      </div>
    </div>
  );
}