import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { Trash2, Pencil } from "lucide-react";

function pickColor(seed) {
  const colors = ["#4F46E5", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function drawAll(ctx, w, h, strokes) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  for (const s of strokes) {
    const pts = s.points || [];
    if (pts.length < 2) continue;
    ctx.lineWidth = s.width || 2;
    ctx.strokeStyle = s.color || "#111827";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
    ctx.stroke();
  }
}

export default function CollaborativeCanvas({ serverUrl, room, me, clientId }) {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [status, setStatus] = useState("connecting");
  const [tool, setTool] = useState("pen");
  const [width, setWidth] = useState(3);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const providerRef = useRef(null);
  const strokesRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeIdRef = useRef(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const provider = new SocketIOProvider(serverUrl, room, ydoc, {
      auth: { token: localStorage.getItem("token") || "" },
    });
    providerRef.current = provider;
    strokesRef.current = ydoc.getArray("strokes");

    const onStatus = ({ status }) => setStatus(status);
    provider.on("status", onStatus);

    const name = me?.user?.name || "User";
    provider.awareness.setLocalStateField("user", {
      id: clientId,
      name,
      role: me?.role || "student",
      color: pickColor(`${clientId}-${name}`),
    });

    const strokes = strokesRef.current;
    const onChange = () => setVersion((v) => v + 1);
    strokes.observe(onChange);

    return () => {
      strokes.unobserve(onChange);
      provider.off("status", onStatus);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [clientId, me?.role, me?.user?.name, room, serverUrl, ydoc]);

  // Resize canvas to container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const c = canvasRef.current;
      if (!c) return;
      const rect = el.getBoundingClientRect();
      c.width = Math.max(1, Math.floor(rect.width));
      c.height = Math.max(1, Math.floor(rect.height));
      const ctx = c.getContext("2d");
      if (!ctx) return;
      drawAll(ctx, c.width, c.height, strokesRef.current?.toArray?.() || []);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Redraw when strokes change
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawAll(ctx, c.width, c.height, strokesRef.current?.toArray?.() || []);
  }, [version]);

  const begin = (e) => {
    if (tool !== "pen") return;
    const c = canvasRef.current;
    const strokes = strokesRef.current;
    if (!c || !strokes) return;

    drawingRef.current = true;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const name = me?.user?.name || "User";
    const stroke = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      by: { id: clientId, name, role: me?.role || "student" },
      color: pickColor(`${clientId}-${name}`),
      width,
      points: [[x, y]],
    };
    currentStrokeIdRef.current = stroke.id;
    ydoc.transact(() => strokes.push([stroke]));
  };

  const move = (e) => {
    if (!drawingRef.current || tool !== "pen") return;
    const c = canvasRef.current;
    const strokes = strokesRef.current;
    if (!c || !strokes) return;

    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const id = currentStrokeIdRef.current;
    if (!id) return;
    const arr = strokes.toArray();
    const idx = arr.findIndex((s) => s?.id === id);
    if (idx === -1) return;

    const s = { ...arr[idx] };
    const pts = Array.isArray(s.points) ? s.points.slice() : [];
    pts.push([x, y]);
    s.points = pts;

    // Replace the stroke object (CRDT-safe)
    ydoc.transact(() => {
      strokes.delete(idx, 1);
      strokes.insert(idx, [s]);
    });
  };

  const end = () => {
    drawingRef.current = false;
    currentStrokeIdRef.current = null;
  };

  const clear = () => {
    const strokes = strokesRef.current;
    if (!strokes) return;
    ydoc.transact(() => strokes.delete(0, strokes.length));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="text-sm font-extrabold text-slate-800">Collaborative canvas</div>
          <div className="text-[11px] text-slate-400 font-semibold">Room: {room}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool("pen")}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold border transition-colors ${
              tool === "pen"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Pencil className="w-4 h-4" />
            Pen
          </button>
          <label className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
            Width
            <input
              type="range"
              min={1}
              max={10}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </label>
          <button
            onClick={clear}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold border border-slate-200 bg-white hover:bg-red-50 text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
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
      </div>

      <div className="flex-1 mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div ref={containerRef} className="w-full h-full relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              begin(e);
            }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
          />
        </div>
      </div>
    </div>
  );
}

