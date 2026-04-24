import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { SocketIOProvider } from "y-socket.io";

function pickColor(seed) {
  const colors = ["#4F46E5", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

export default function CollaborativeEditor({ serverUrl, room, me, clientId }) {
  const [status, setStatus] = useState("connecting");
  const ydoc = useMemo(() => new Y.Doc(), []);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    const provider = new SocketIOProvider(serverUrl, room, ydoc, {
      auth: { token: localStorage.getItem("token") || "" },
    });
    providerRef.current = provider;

    const onStatus = ({ status }) => setStatus(status);
    provider.on("status", onStatus);

    const name = me?.user?.name || "User";
    provider.awareness.setLocalStateField("user", {
      id: clientId,
      name,
      role: me?.role || "student",
      color: pickColor(`${clientId}-${name}`),
    });

    return () => {
      try {
        bindingRef.current?.destroy?.();
      } catch (_) {
        // ignore
      }
      provider.off("status", onStatus);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [clientId, me?.role, me?.user?.name, room, serverUrl, ydoc]);

  const handleMount = (editor, monaco) => {
    const ytext = ydoc.getText("monaco");
    const model = editor.getModel();
    if (!model) return;

    // A nice default for new rooms
    if (ytext.length === 0) {
      ydoc.transact(() => {
        ytext.insert(
          0,
          `// Welcome to Devio Classroom\n// This editor is live-collaborative using CRDTs (Yjs)\n\nfunction hello(name) {\n  return "Hello, " + name;\n}\n\nconsole.log(hello("${me?.user?.name?.split(" ")?.[0] || "world"}"));\n`
        );
      });
    }

    // Ensure model uses a language
    try {
      monaco.editor.setModelLanguage(model, "javascript");
    } catch (_) {
      // ignore
    }

    const provider = providerRef.current;
    if (!provider) return;

    bindingRef.current = new MonacoBinding(
      ytext,
      model,
      new Set([editor]),
      provider.awareness
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="text-sm font-extrabold text-slate-800">Collaborative editor</div>
          <div className="text-[11px] text-slate-400 font-semibold">Room: {room}</div>
        </div>
        <div
          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
            status === "connected"
              ? "bg-emerald-50 text-emerald-600"
              : status === "connecting"
              ? "bg-amber-50 text-amber-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {status}
        </div>
      </div>

      <div className="flex-1 mt-3 overflow-hidden rounded-2xl border border-slate-100">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-light"
          options={{
            fontFamily: "JetBrains Mono, Consolas, monospace",
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: "on",
            smoothScrolling: true,
            scrollBeyondLastLine: false,
          }}
          onMount={handleMount}
        />
      </div>
    </div>
  );
}

