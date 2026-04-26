import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Plus, LogOut, Settings, Bell, Search,
  Copy, Check, Users, Clock, ChevronRight,
  BookOpen, Swords, Trophy, LayoutDashboard,
  CalendarDays, X, AlertCircle, Lock,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const duration = (start, end) => {
  if (!start || !end) return null;
  const diff = Math.round((new Date(end) - new Date(start)) / 60000);
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const isEnded = (cls) => cls.status === "ended" || cls.endedAt;

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex flex-col gap-1">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-sm font-bold text-slate-700">{label}</div>
      {sub && <div className="text-[11px] text-slate-400 font-medium">{sub}</div>}
    </div>
  );
}

// ─── ClassCard ───────────────────────────────────────────────────────────────
function ClassCard({ cls, onCopy, copied, onNavigate }) {
  const ended = isEnded(cls);
  const dur = duration(cls.createdAt, cls.endedAt);
  const studentCount = cls.studentIds?.length ?? cls.students?.length ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[20px] p-5 shadow-sm border transition-all
        ${ended ? "border-slate-100 opacity-80" : "border-slate-100 hover:border-indigo-200 hover:shadow-md"}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-extrabold text-slate-800 truncate">{cls.name}</span>
            {ended ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Ended
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                Active
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Code: {cls.code}</div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onCopy(cls.code)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
          >
            {copied === cls.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === cls.code ? "Copied!" : "Copy"}
          </button>

          {ended ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 cursor-not-allowed select-none">
              <Lock className="w-3.5 h-3.5" /> Closed
            </div>
          ) : (
            <button
              onClick={() => onNavigate(cls._id)}
              className="flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-colors shadow shadow-indigo-200"
            >
              Open <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Users className="w-3 h-3" /> Students</div>
          <div className="text-sm font-extrabold text-slate-700 mt-0.5">{studentCount}</div>
        </div>
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Started</div>
          <div className="text-[11px] font-bold text-slate-700 mt-0.5 leading-tight">{fmt(cls.createdAt)}</div>
        </div>
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          {ended ? (
            <>
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</div>
              <div className="text-[11px] font-bold text-slate-700 mt-0.5">{dur ?? "—"}</div>
            </>
          ) : (
            <>
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> End</div>
              <div className="text-[11px] font-bold text-slate-700 mt-0.5">Ongoing</div>
            </>
          )}
        </div>
      </div>

      {ended && cls.endedAt && (
        <div className="mt-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-medium">
          Ended: {fmt(cls.endedAt)}
        </div>
      )}
    </motion.div>
  );
}

// ─── CreateModal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name.trim());
    setCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-[28px] p-8 shadow-2xl shadow-indigo-200/30 border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-black text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            New Classroom
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <p className="text-sm text-slate-400 font-medium mb-6">A unique join code will be auto-generated.</p>

        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Class Name</label>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="e.g. CS301 — Data Structures"
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all mb-6 font-medium"
        />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={creating || !name.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {creating ? "Creating…" : "Create Class"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState({ name: "Teacher" });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | ended
  const menuRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const load = async () => {
      try {
        const [dr, cr] = await Promise.all([
          axios.get("http://localhost:5000/dashboard/teacher", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/classrooms/teacher", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const t = dr.data?.teacher ?? dr.data?.user;
        if (t) setTeacher(t);
        if (Array.isArray(cr.data?.classrooms)) setClasses(cr.data.classrooms);
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  useEffect(() => {
    const fn = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleCreate = async (name) => {
    const token = localStorage.getItem("token");
    try {
      const r = await axios.post(
        "http://localhost:5000/classrooms",
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created = r.data?.classroom;
      if (created) {
        setClasses(prev => [created, ...prev]);
        setShowCreate(false);
        navigate(`/classroom/${created._id}`);
      }
    } catch {}
  };

  // derived
  const active = classes.filter(c => !isEnded(c));
  const ended  = classes.filter(c => isEnded(c));
  const totalStudents = [...new Set(classes.flatMap(c => c.studentIds ?? c.students ?? []))].length;

  const filtered = classes.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.code?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "active" ? !isEnded(c) : isEnded(c);
    return matchSearch && matchFilter;
  });

  const STATS = [
    { label: "Total Students", value: totalStudents, sub: "Across all classes", color: "text-indigo-600" },
    { label: "Active Classes",  value: active.length,  sub: "Currently running",  color: "text-emerald-600" },
    { label: "Ended Classes",   value: ended.length,   sub: "Completed sessions", color: "text-rose-500" },
    { label: "Total Classes",   value: classes.length, sub: "All time",           color: "text-amber-500" },
  ];

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="h-[72px] bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 z-10 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-[18px] font-black text-slate-800 tracking-tight">devio</span>
          </div>

          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search classrooms…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 outline-none border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Settings style={{ width: 18, height: 18 }} />
            </button>
            <button className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell style={{ width: 18, height: 18 }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-2.5 ml-3 pl-4 border-l border-slate-100 relative" ref={menuRef}>
              <div className="text-right">
                <div className="text-sm font-extrabold text-slate-800 leading-tight">{teacher.name?.split(" ")[0]}</div>
                <div className="text-[11px] text-slate-400 font-medium">Teacher</div>
              </div>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-9 h-9 rounded-full bg-linear-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-extrabold text-sm shadow hover:shadow-md transition-all"
              >
                {teacher.name?.charAt(0) || "T"}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[46px] w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-1.5 z-50 border border-slate-100"
                  >
                    <button className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold text-slate-700 transition-colors">
                      <Settings className="w-4 h-4 text-slate-400" /> Account Settings
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => { localStorage.clear(); navigate("/login"); }}
                      className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-red-50 flex items-center gap-3 text-sm font-semibold text-red-500 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-400" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6" style={{ scrollbarWidth: "none" }}>

          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-[26px] px-8 py-7 flex items-center justify-between relative overflow-hidden shadow-lg shadow-indigo-200/60 shrink-0 h-48">
           <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 right-40 w-40 h-40 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <p className="text-emerald-100 text-sm font-semibold mb-1">Welcome back 👋</p>
              <h1 className="text-[28px] font-black text-white leading-tight mb-1">
                {teacher.name?.split(" ")[0]}
              </h1>
              <p className="text-emerald-100/80 text-sm font-medium mb-5">
                {active.length > 0
                  ? ` ${active.length} active classroom${active.length > 1 ? "s" : ""} running right now`
                  : "No active classrooms — start a new session!"}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-full text-sm font-extrabold shadow hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Start a New Class
              </button>
            </div>

            {/* Decorative icon cluster */}
            
          </div>

          {/* Stats row */}
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-[20px] p-5 h-24 shadow-sm border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>
          )}

          {/* Class History */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-slate-800">Classroom History</h2>

              {/* Filter tabs */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {["all", "active", "ended"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs font-bold px-4 py-2 capitalize transition-colors ${
                      filter === f
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-[22px] p-8 shadow-sm border border-slate-100 flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-[22px] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">
                  {search ? "No classrooms match your search." : "No classrooms yet — create one!"}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-1 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl shadow shadow-indigo-200 transition-colors"
                  >
                    + Create First Class
                  </button>
                )}
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filtered.map(cls => (
                    <ClassCard
                      key={cls._id}
                      cls={cls}
                      onCopy={copyCode}
                      copied={copied}
                      onNavigate={(id) => navigate(`/classroom/${id}`)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* bottom spacer */}
          <div className="h-4 shrink-0" />
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>
    </div>
  );
}