import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutGrid, Users, BookOpen, Swords, Settings,
  LogOut, Copy, Check, Plus, Eye, ChevronRight,
  TrendingUp, Shield, BarChart2, Clipboard, Award, HelpCircle
} from "lucide-react";

const SIDEBAR = [
  { icon: LayoutGrid, label: "Overview", active: true },
  { icon: BookOpen, label: "My Classes" },
  { icon: Users, label: "Students" },
  { icon: Swords, label: "Spectate" },
  { icon: BarChart2, label: "Analytics" },
  { icon: Award, label: "Assignments" },
];
const SIDEBAR_BOTTOM = [
  { icon: Settings, label: "Settings" },
  { icon: HelpCircle, label: "Help" },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState({ name: "Teacher" });
  const [copied, setCopied] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [classes, setClasses] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    axios.get("http://localhost:5000/dashboard/teacher", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data?.teacher) setTeacher(res.data.teacher);
      else if (res.data?.user) setTeacher(res.data.user);
      return axios.get("http://localhost:5000/classrooms/teacher", {
        headers: { Authorization: `Bearer ${token}` }
      });
    }).then(r => {
      if (Array.isArray(r?.data?.classrooms)) setClasses(r.data.classrooms);
    }).catch(() => {
      localStorage.removeItem("token");
      navigate("/login");
    });
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const createClass = async () => {
    const token = localStorage.getItem("token");
    const name = newClassName.trim();
    if (!token || !name) return;
    setCreating(true);
    try {
      const r = await axios.post(
        "http://localhost:5000/classrooms",
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created = r.data?.classroom;
      if (created) {
        setClasses((prev) => [created, ...prev]);
        setShowCreateModal(false);
        setNewClassName("");
        navigate(`/classroom/${created._id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const STUDENT_STATS = [
    { name: "Arjun Singh", xp: 4820, solved: 47, battles: 12, rank: 1 },
    { name: "Priya Mehta", xp: 4200, solved: 41, battles: 10, rank: 2 },
    { name: "Rahul Kumar", xp: 3800, solved: 38, battles: 9, rank: 3 },
    { name: "Anjali Sharma", xp: 3200, solved: 30, battles: 7, rank: 4 },
    { name: "Dev Tiwari", xp: 2900, solved: 27, battles: 6, rank: 5 },
  ];

  const LIVE_BATTLES = [
    { p1: "Arjun S.", p2: "Priya M.", problem: "Binary Search", time: "12:34", class: "CS301" },
    { p1: "Rahul K.", p2: "Dev T.", problem: "Two Sum", time: "08:12", class: "CS201" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="px-3 py-2 text-xl font-bold">Devio</div>
        <div className="panel-soft p-3 text-sm">
          <div className="font-semibold">{teacher.name?.split(" ")[0]}</div>
          <div className="text-emerald-300 text-xs">Teacher</div>
        </div>
        <nav className="flex flex-col gap-1">
          {SIDEBAR.map((item) => {
            const active = activeTab === item.label;
            return (
              <button key={item.label} onClick={() => setActiveTab(item.label)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${active ? "sidebar-item-active" : "hover:bg-slate-800/60"}`}>
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-300"><LogOut className="w-4 h-4" /> <span className="text-sm">Log out</span></button>
      </aside>

      <main className="content custom-scrollbar overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-extrabold">Teacher dashboard</h1>
            <p className="text-slate-400">Manage classrooms and monitor student activity.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-success flex items-center gap-2"><Plus className="w-4 h-4" /> New class</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[["Total Students","84","+6 this week"],["Active Classes","3","2 ongoing"],["Battles Created","25","8 this month"],["Avg Student XP","3.1K","+12%"]].map((s)=>(
            <div key={s[0]} className="panel p-4"><div className="text-2xl font-bold">{s[1]}</div><div className="text-sm text-slate-300">{s[0]}</div><div className="text-xs text-slate-400">{s[2]}</div></div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="xl:col-span-2 panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My classrooms</h2>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create</button>
            </div>
            <div className="space-y-3">
              {classes.map((cls) => (
                <div key={cls._id} className="panel-soft p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{cls.name}</div>
                    <div className="text-xs text-slate-400">{(cls.studentIds?.length || 0)} students</div>
                  </div>
                  <button onClick={() => copyCode(cls.code)} className="btn-muted !py-2 !px-3 flex items-center gap-2"><Clipboard className="w-4 h-4" /> {cls.code} {copied === cls.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button>
                  <button onClick={() => navigate(`/classroom/${cls._id}`)} className="btn-muted !py-2 !px-3"><Eye className="w-4 h-4" /></button>
                  <button className="btn-muted !py-2 !px-3"><Settings className="w-4 h-4" /></button>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="text-sm text-slate-400 font-medium py-8 text-center">
                  No classrooms yet. Create your first class.
                </div>
              )}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="text-xl font-bold mb-4">Top students</h2>
            <div className="space-y-2">
              {STUDENT_STATS.map((s) => (
                <div key={s.rank} className="panel-soft p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">#{s.rank} {s.name}</div>
                    <div className="text-xs text-slate-400">{s.solved} solved · {s.battles} battles</div>
                  </div>
                  <div className="text-indigo-300 font-semibold">{s.xp}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ─── CREATE CLASS MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md p-8 rounded-[32px]"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-2xl mb-2" style={{ fontFamily: "var(--font-display)" }}>Create New Class</h3>
            <p className="font-medium mb-6" style={{ color: "var(--c-text-secondary)" }}>A unique join code will be auto-generated.</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--c-text-secondary)" }}>Class Name</label>
                <input
                  type="text" placeholder="e.g. CS301 - Data Structures"
                  value={newClassName} onChange={e => setNewClassName(e.target.value)}
                  className="input-dark w-full px-4 py-4 text-[15px]"
                  id="new-class-name"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:bg-white/8"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--c-border)", color: "var(--c-text-secondary)" }}>
                  Cancel
                </button>
                <button disabled={creating || !newClassName.trim()} onClick={createClass}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                  style={{ background: "linear-gradient(135deg, #059669, #10B981)", color: "white", boxShadow: "0 4px 16px rgba(16,185,129,0.3)", opacity: (creating || !newClassName.trim()) ? 0.6 : 1 }}>
                  {creating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
