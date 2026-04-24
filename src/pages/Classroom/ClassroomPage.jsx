import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Code2, MessageSquare, Paintbrush, ArrowLeft,
  LogOut, UserX, StopCircle, Users, Bell, X,
  CheckCircle, Copy, RefreshCw,
} from "lucide-react";
import CollaborativeEditor from "./components/CollaborativeEditor.jsx";
import CollaborativeCanvas from "./components/CollaborativeCanvas.jsx";
import ClassroomChat from "./components/ClassroomChat.jsx";

const API = "http://localhost:5000";

async function fetchAnyUser(token) {
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const r = await axios.get(`${API}/dashboard/student`, { headers });
    return { user: r.data.user, role: "student" };
  } catch (_) {}
  const r2 = await axios.get(`${API}/dashboard/teacher`, { headers });
  return { user: r2.data.teacher || r2.data.user, role: "teacher" };
}

function NotificationToast({ note, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const icons = {
    join:     <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
    leave:    <LogOut      className="w-4 h-4 text-amber-400 shrink-0" />,
    kick:     <UserX       className="w-4 h-4 text-red-400 shrink-0" />,
    end:      <StopCircle  className="w-4 h-4 text-red-400 shrink-0" />,
    activity: <Bell        className="w-4 h-4 text-indigo-400 shrink-0" />,
    default:  <Bell        className="w-4 h-4 text-slate-400 shrink-0" />,
  };

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border border-slate-200/60 bg-white/95 backdrop-blur text-sm text-slate-700 font-medium animate-slide-in"
      style={{ maxWidth: 340 }}
    >
      {icons[note.type] || icons.default}
      <span className="flex-1">{note.message}</span>
      <button onClick={onDismiss} className="ml-1 text-slate-400 hover:text-slate-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function JoinRequestModal({ request, onApprove, onDeny }) {
  if (!request) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[20px] p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-100 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-1">
          {request.name} wants to join
        </h3>
        <p className="text-sm font-medium text-slate-500 mb-5 leading-relaxed">
          Allow this student to enter the classroom? You can process multiple requests one-by-one.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Deny
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200 transition-colors"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

function MembersPanel({ members, role, onKick }) {
  const students = members.filter((m) => m.role === "student");
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Online ({students.length})
      </div>
      {students.map((m) => (
        <div
          key={m.userId}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 group"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-sm text-slate-700 font-medium flex-1 truncate">
            {m.name}
          </span>
          {role === "teacher" && (
            <button
              onClick={() => onKick(m.userId, m.name)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-red-400 hover:bg-red-50"
              title="Kick student"
            >
              <UserX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      {students.length === 0 && (
        <div className="text-xs text-slate-400 px-2">No students online</div>
      )}
    </div>
  );
}

function PendingLobby({ onRetry, onCancel, retryCount }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-10 rounded-2xl bg-white shadow-xl border border-indigo-100 max-w-sm w-full mx-4">
        <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-800 mb-2">
          Waiting for approval
        </h2>
        <p className="text-slate-500 text-sm mb-1">
          The teacher will let you in shortly.
        </p>
        {retryCount > 0 && (
          <p className="text-xs text-indigo-400 font-semibold mb-4">
            Request sent {retryCount + 1}× — still waiting…
          </p>
        )}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resend
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  const { classroomId } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);
  const [me, setMe] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [tab, setTab] = useState("Chat");
  const [loading, setLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const socketRef = useRef(null);
  const didRunRef = useRef(false);
  const meRef = useRef(null);
  // Guard so approval handler only fires once even if event fires twice
  const approvalHandledRef = useRef(false);

  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const notifIdRef = useRef(0);
  const activityTimers = useRef({});
  const [joinRequests, setJoinRequests] = useState([]);
  const [classEnded, setClassEnded] = useState(false);
  const [wasKicked, setWasKicked] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const retryIntervalRef = useRef(null);

  const clientIdRef = useRef(
    localStorage.getItem("devio:clientId") ||
      (() => {
        const v = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem("devio:clientId", v);
        return v;
      })()
  );

  const chatStorageKey = `devio:chat:${classroomId}`;

  const pushNotif = useCallback((type, message) => {
    const id = ++notifIdRef.current;
    setNotifications((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissNotif = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const reportActivity = useCallback(
    (action) => {
      if (!socketRef.current || !me) return;
      const key = action;
      if (activityTimers.current[key]) return;
      activityTimers.current[key] = setTimeout(() => {
        delete activityTimers.current[key];
      }, 8000);
      socketRef.current.emit("classroom:activity", {
        classroomId,
        studentName: me.user?.name || "Someone",
        action,
      });
    },
    [classroomId, me]
  );

  const resendJoinRequest = useCallback(() => {
    const user = meRef.current;
    if (!socketRef.current || !user) return;
    socketRef.current.emit("classroom:resend_request", {
      classroomId,
      userId: user.user?._id,
      name: user.user?.name || "User",
    });
    setRetryCount((c) => c + 1);
  }, [classroomId]);

  const cancelWaiting = useCallback(() => {
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    if (!token) {
      navigate("/login");
      return;
    }

    let sock = null;

    const run = async () => {
      let user;
      try {
        user = await fetchAnyUser(token);
      } catch {
        navigate("/login");
        return;
      }
      setMe(user);
      meRef.current = user;

      sock = io(API, { transports: ["websocket"] });
      socketRef.current = sock;

      // Common listeners
      sock.on("classroom:notification", ({ type, message }) =>
        pushNotif(type, message)
      );
      sock.on("classroom:activity", ({ studentName, action }) =>
        pushNotif("activity", `${studentName} ${action}`)
      );
      sock.on("classroom:presence", ({ members }) => setMembers(members));
      sock.on("classroom:join_request", (req) =>
        setJoinRequests((prev) => {
          const isDuplicate = prev.some(
            (r) =>
              String(r.userId) === String(req.userId) &&
              r.classroomId === req.classroomId
          );
          return isDuplicate ? prev : [...prev, req];
        })
      );
      sock.on("classroom:kicked", () => setWasKicked(true));
      sock.on("classroom:ended", () => setClassEnded(true));

      let isPending = false;
      try {
        const r = await axios.get(`${API}/classrooms/${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClassroom(r.data.classroom);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) {
          isPending = true;
          setPendingApproval(true);
        } else if (status === 404) {
          setLoading(false);
          navigate("/studentdashboard");
          return;
        } else if (status === 401) {
          setLoading(false);
          navigate("/login");
          return;
        }
      }

      setLoading(false);

      if (isPending) {
        // ── Lobby path ──────────────────────────────────────────────────

        sock.on("classroom:join_approved", async () => {
          // Guard against duplicate approval events firing
          if (approvalHandledRef.current) return;
          approvalHandledRef.current = true;

          // Stop auto-retry interval immediately
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
          }

          // The socket approval means the DB write just happened on the server.
          // Wait a brief moment for the DB write to be visible, then fetch ONCE.
          await new Promise((res) => setTimeout(res, 600));

          let classroomData = null;
          try {
            const r = await axios.get(`${API}/classrooms/${classroomId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            classroomData = r.data.classroom;
          } catch (err) {
            const status = err?.response?.status;
            if (status === 401) { navigate("/login"); return; }
            if (status === 404) { navigate("/studentdashboard"); return; }
            // Still 403 after the delay — try once more after a longer wait
            await new Promise((res) => setTimeout(res, 1500));
            try {
              const r2 = await axios.get(`${API}/classrooms/${classroomId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              classroomData = r2.data.classroom;
            } catch (err2) {
              pushNotif("error", "Approval received but failed to load classroom. Please reload.");
              return;
            }
          }

          // Set classroom data BEFORE clearing pending so the UI has
          // everything it needs before re-rendering out of the lobby.
          setClassroom(classroomData);
          setPendingApproval(false);

          sock.emit("classroom:join", {
            classroomId,
            userId: user.user?._id,
            name: user.user?.name || "User",
            role: user.role,
          });
        });

        sock.on("classroom:join_denied", () => {
          if (approvalHandledRef.current) return;
          approvalHandledRef.current = true;

          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
          }
          pushNotif("error", "Your request to join was denied by the teacher.");
          navigate("/studentdashboard");
        });

        // ✅ FIX: Send the initial join request — wait for socket connection first
        const emitRequest = () => {
          socketRef.current?.emit("classroom:request_join", {
            classroomId,
            userId: user.user?._id,
            name: user.user?.name || "User",
          });
        };

        if (sock.connected) {
          emitRequest();
        } else {
          sock.once("connect", emitRequest);
        }

        // Auto-retry every 12s in case teacher connects after the student
        retryIntervalRef.current = setInterval(() => {
          // Stop retrying if already approved
          if (approvalHandledRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
            return;
          }
          if (!socketRef.current) return;
          socketRef.current.emit("classroom:resend_request", {
            classroomId,
            userId: user.user?._id,
            name: user.user?.name || "User",
          });
          setRetryCount((c) => c + 1);
        }, 12000);

      } else {
        // ✅ FIX: Normal path — wait for socket connection before emitting join
        const emitJoin = () => {
          socketRef.current?.emit("classroom:join", {
            classroomId,
            userId: user.user?._id,
            name: user.user?.name || "User",
            role: user.role,
          });
        };

        if (sock.connected) {
          emitJoin();
        } else {
          sock.once("connect", emitJoin);
        }
      }
    };

    run();

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
      if (sock) {
        sock.emit("classroom:leave", { classroomId });
        sock.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Teacher actions ──────────────────────────────────────────────────────

  const endClass = async () => {
    if (!window.confirm("End this class session for everyone?")) return;
    await axios.post(
      `${API}/classrooms/${classroomId}/end`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    socketRef.current?.emit("classroom:end", { classroomId });
    navigate("/teacherdashboard");
  };

  const kickStudent = (studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this class?`)) return;
    axios.delete(`${API}/classrooms/${classroomId}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    socketRef.current?.emit("classroom:kick", { classroomId, studentId });
  };

  const approveJoin = (req) => {
    socketRef.current?.emit("classroom:approve_join", {
      classroomId,
      userId: req.userId,
    });
    setJoinRequests((prev) => prev.filter((r) => r.userId !== req.userId));
  };

  const denyJoin = (req) => {
    socketRef.current?.emit("classroom:deny_join", {
      classroomId,
      userId: req.userId,
    });
    setJoinRequests((prev) => prev.filter((r) => r.userId !== req.userId));
  };

  const leaveClass = () => {
    if (!window.confirm("Leave this class?")) return;
    socketRef.current?.emit("classroom:leave", { classroomId });
    navigate("/studentdashboard");
  };

  const docRooms = useMemo(
    () => ({
      editor: `classroom-${classroomId}-editor`,
      canvas: `classroom-${classroomId}-canvas`,
    }),
    [classroomId]
  );

  // ── Render guards ────────────────────────────────────────────────────────

  if (pendingApproval) {
    return (
      <PendingLobby
        retryCount={retryCount}
        onRetry={resendJoinRequest}
        onCancel={cancelWaiting}
      />
    );
  }

  if (wasKicked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-10 rounded-2xl bg-white shadow-xl border border-red-100 max-w-sm">
          <UserX className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">You were removed</h2>
          <p className="text-slate-500 text-sm mb-6">
            The teacher removed you from this class session.
          </p>
          <button
            onClick={() => navigate("/studentdashboard")}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (classEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-10 rounded-2xl bg-white shadow-xl border border-amber-100 max-w-sm">
          <StopCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Class ended</h2>
          <p className="text-slate-500 text-sm mb-6">
            The teacher has ended this session.
          </p>
          <button
            onClick={() =>
              navigate(
                me?.role === "teacher"
                  ? "/teacherdashboard"
                  : "/studentdashboard"
              )
            }
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!classroom) return null;

  const TABS = [
    { label: "Chat",   icon: MessageSquare },
    { label: "Editor", icon: Code2 },
    { label: "Canvas", icon: Paintbrush },
  ];

  const isTeacher = me?.role === "teacher";

  return (
    <div className="app-shell" style={{ position: "relative" }}>
      {/* Notification / modal layer */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {isTeacher && joinRequests.length > 0 && (
          <div style={{ pointerEvents: "auto" }}>
            <JoinRequestModal
              request={joinRequests[0]}
              onApprove={() => approveJoin(joinRequests[0])}
              onDeny={() => denyJoin(joinRequests[0])}
            />
          </div>
        )}
        {notifications.map((n) => (
          <div key={n.id} style={{ pointerEvents: "auto" }}>
            <NotificationToast note={n} onDismiss={() => dismissNotif(n.id)} />
          </div>
        ))}
      </div>

      <aside className="sidebar">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-black text-slate-800">devio</div>
              <div className="text-[11px] text-slate-400 font-semibold">Classroom</div>
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="panel-soft p-3">
            <div className="text-xs font-bold text-slate-400">Class</div>
            <div className="font-extrabold text-slate-800 mt-0.5">{classroom.name}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <div>Code:</div>
              <div className="font-bold text-indigo-600">{classroom.code}</div>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(classroom.code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 1600);
                  } catch (_) {}
                }}
                title="Copy code"
                className="ml-auto p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              {copiedCode && (
                <div className="text-xs text-emerald-600 font-bold">Copied</div>
              )}
            </div>
          </div>

          <div className="panel-soft p-3">
            <MembersPanel
              members={members}
              role={me?.role}
              onKick={kickStudent}
            />
          </div>
        </div>

        <nav className="px-3 flex flex-col gap-1">
          {TABS.map((t) => {
            const active = tab === t.label;
            return (
              <button
                key={t.label}
                onClick={() => setTab(t.label)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <t.icon className="w-[18px] h-[18px]" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 flex flex-col gap-2">
          {isTeacher && (
            <button
              onClick={endClass}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl py-2.5 font-extrabold text-sm transition-colors"
            >
              <StopCircle className="w-4 h-4" />
              End class
            </button>
          )}

          {!isTeacher && (
            <button
              onClick={leaveClass}
              className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl py-2.5 font-extrabold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave class
            </button>
          )}

          <button
            onClick={() =>
              navigate(isTeacher ? "/teacherdashboard" : "/studentdashboard")
            }
            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl py-2.5 font-extrabold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>
        </div>
      </aside>

      <main className="content overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">{classroom.name}</h1>
            <p className="text-sm text-slate-500 font-medium">
              Live chat + collaborative editor + collaborative canvas (CRDT).
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">You</div>
            <div className="text-sm font-extrabold text-slate-800">
              {me?.user?.name || "User"}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">{me?.role}</div>
          </div>
        </div>

        <div className="panel p-4 h-[calc(100vh-140px)] overflow-hidden">
          <div
            style={{
              display: tab === "Chat" ? "flex" : "none",
              height: "100%",
              flexDirection: "column",
            }}
          >
            <ClassroomChat
              classroomId={classroomId}
              me={me}
              storageKey={chatStorageKey}
              socket={socketRef.current}
            />
          </div>

          {tab === "Editor" && (
            <CollaborativeEditor
              serverUrl={API}
              room={docRooms.editor}
              me={me}
              clientId={clientIdRef.current}
              onActivity={() => reportActivity("is editing in the Editor")}
            />
          )}
          {tab === "Canvas" && (
            <CollaborativeCanvas
              serverUrl={API}
              room={docRooms.canvas}
              me={me}
              clientId={clientIdRef.current}
              onActivity={() => reportActivity("is drawing on the Canvas")}
            />
          )}
        </div>
      </main>

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease; }
      `}</style>
    </div>
  );
}