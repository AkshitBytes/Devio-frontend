import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, Settings, LogOut,
  LayoutDashboard, Code2, Swords, Trophy,
  ChevronLeft, ChevronRight, ArrowRight,
} from "lucide-react";
import illustration from "../../../assets/illustration.png";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   path: "/studentdashboard"    },
  { icon: Code2,           label: "Practice",    path: "/student/practice"    },
  { icon: Swords,          label: "Battles",     path: "/student/battles"     },
  { icon: Trophy,          label: "Leaderboard", path: "/student/leaderboard" },
];

const DIFF_STYLE = {
  Easy:   { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  Medium: { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400"   },
  Hard:   { bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-400"    },
};

/* ─────────────────────────────────────────────
   CIRCULAR PROGRESS RING
───────────────────────────────────────────── */
function Ring({ size = 112, stroke = 11, pct = 0, c1, c2, label, sub }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(circ);
  const id = label.replace(/\s+/g, "-");

  useEffect(() => {
    const t = setTimeout(() => setDash(circ - (pct / 100) * circ), 80);
    return () => clearTimeout(t);
  }, [pct, circ]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 absolute inset-0">
          <defs>
            <linearGradient id={`rg-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <circle cx={size/2} cy={size/2} r={r} stroke="#EEF2FF" strokeWidth={stroke} fill="none"/>
          <circle cx={size/2} cy={size/2} r={r}
            stroke={`url(#rg-${id})`} strokeWidth={stroke} strokeLinecap="round" fill="none"
            style={{
              strokeDasharray: circ,
              strokeDashoffset: dash,
              transition: "stroke-dashoffset 1.1s cubic-bezier(.22,.9,.35,1)"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-slate-800">{pct}%</span>
          {sub && <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{sub}</span>}
        </div>
      </div>
      <span className="text-xs font-bold text-slate-600 text-center">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT BAR ROW
───────────────────────────────────────────── */
function StatBar({ label, pct, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-slate-600 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-2 rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="text-xs font-bold text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WORKING CALENDAR
───────────────────────────────────────────── */
function ActivityCalendar({ activeDates = [] }) {
  const today  = new Date();
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());

  const days    = new Date(vy, vm + 1, 0).getDate();
  const first   = new Date(vy, vm, 1).getDay();
  const offset  = (first + 6) % 7;

  const HEADS  = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  const isToday  = d => d === today.getDate() && vm === today.getMonth() && vy === today.getFullYear();
  const isActive = d => {
    const key = `${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return activeDates.includes(key);
  };

  const prev = () => vm === 0 ? (setVm(11), setVy(y => y-1)) : setVm(m => m-1);
  const next = () => vm === 11 ? (setVm(0),  setVy(y => y+1)) : setVm(m => m+1);

  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i+1)];

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-extrabold text-slate-800">{MONTHS[vm]}</span>
          <span className="ml-2 text-xs font-bold text-slate-400">{vy}</span>
        </div>
        <div className="flex gap-0.5">
          <button onClick={prev} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-400"/>
          </button>
          <button onClick={next} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-400"/>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {HEADS.map(h => <div key={h} className="text-center text-[10px] font-bold text-slate-400 py-1">{h}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`}/>;
          const tod = isToday(d);
          const act = isActive(d);
          return (
            <div key={d} className="flex flex-col items-center">
              <span className={`
                w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold cursor-default
                ${tod ? "bg-indigo-600 text-white shadow shadow-indigo-300" : ""}
                ${act && !tod ? "bg-orange-100 text-orange-600" : ""}
                ${!tod && !act ? "text-slate-600" : ""}
              `}>{d}</span>
              {act && !tod && <div className="w-1 h-1 rounded-full bg-orange-400 mt-0.5"/>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"/>
          <span className="text-[10px] text-slate-400 font-medium">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400"/>
          <span className="text-[10px] text-slate-400 font-medium">Active day</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUTO-ROTATE PROGRESS BAR
───────────────────────────────────────────── */
function AutoRotateBar({ onTick }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    setPct(0);
    const iv = setInterval(() => {
      setPct(p => {
        if (p >= 100) { onTick(); return 0; }
        return p + 100 / 60;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-slate-400">Auto-rotating</span>
        <span className="text-[10px] text-slate-400">{Math.max(0, Math.round(60 - (pct/100)*60))}s</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
        <div
          className="h-1 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user,     setUser]     = useState({ name: "Student" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const menuRef  = useRef(null);

  // All stats from API
  const [st, setSt] = useState({
    points: 0,
    battles: 0,       // battlesWon
    totalBattles: 1,  // total battles fought (for ring denominator)
    solved: 0,
    totalQuestions: 1,
    streak: 0,
    longestStreak: 0,
  });
  const [bPct, setBPct] = useState(0);  // battlesWon / totalBattles * 100
  const [qPct, setQPct] = useState(0);  // solved / totalQuestions * 100

  const [code, setCode] = useState("");
  const classrooms = [];
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [activeDates, setActiveDates] = useState([]);

  // Recommended problems pagination
  const VISIBLE = 4;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const TOTAL = recommendedProblems.length;
  const shown = recommendedProblems.slice(idx, idx + VISIBLE);

  const goNext = () => { if (!TOTAL) return; setDir(1); setIdx(i => (i + VISIBLE >= TOTAL ? 0 : i + VISIBLE)); };
  const goPrev = () => { setDir(-1); setIdx(i => Math.max(0, i - VISIBLE)); };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const fetchDashboard = async () => {
      try {
        const r = await axios.get("http://localhost:5000/dashboard/student", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.data.user) setUser(r.data.user);

        if (r.data.stats) {
          const s = r.data.stats;
          const pts            = s.totalPoints || 0;
          const battlesWon     = s.battlesWon || 0;
          const sol            = s.questionsSolved || 0;
          const str            = s.streak || 0;
          const totalBattles   = Math.max(1, s.totalBattles || 0);
          const totalQuestions = Math.max(1, s.totalQuestionsAvailable || 0);

          setSt({
            points: pts,
            battles: battlesWon,
            totalBattles,
            solved: sol,
            totalQuestions,
            streak: str,
            longestStreak: s.longestStreak || 0,
          });

          // Ring percentages
          setBPct(Math.min(100, Math.round((battlesWon / totalBattles) * 100)));
          setQPct(Math.min(100, Math.round((sol / totalQuestions) * 100)));
        }

        if (Array.isArray(r.data.recommendedProblems)) {
          setRecommendedProblems(r.data.recommendedProblems);
        }
        if (Array.isArray(r.data.user?.activityDates)) {
          setActiveDates(r.data.user.activityDates);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    // Listen for global updates (e.g. when points are awarded) so UI refreshes across pages
    const onUpdate = async (e) => {
      try {
        if (e?.detail && (e.detail.user || e.detail.stats)) {
          const d = e.detail;
          if (d.user) setUser(d.user);
          if (d.stats) {
            const s = d.stats;
            const pts = s.totalPoints || 0;
            const battlesWon = s.battlesWon || 0;
            const sol = s.questionsSolved || 0;
            const str = s.streak || 0;
            const totalBattles = Math.max(1, s.totalBattles || 0);
            const totalQuestions = Math.max(1, s.totalQuestionsAvailable || 0);
            setSt({ points: pts, battles: battlesWon, totalBattles, solved: sol, totalQuestions, streak: str, longestStreak: s.longestStreak || 0 });
            setBPct(Math.min(100, Math.round((battlesWon / totalBattles) * 100)));
            setQPct(Math.min(100, Math.round((sol / totalQuestions) * 100)));
          }
          if (Array.isArray(d.recommendedProblems)) setRecommendedProblems(d.recommendedProblems);
          if (Array.isArray(d.user?.activityDates)) setActiveDates(d.user.activityDates);
        } else {
          // fallback: re-fetch the dashboard
          await fetchDashboard();
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("devio:userStatsUpdated", onUpdate);
    return () => window.removeEventListener("devio:userStatsUpdated", onUpdate);
  }, []);

  useEffect(() => {
    const fn = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Build STAT_ROWS from live data
  const STAT_ROWS = [
    {
      label: "Total Points",
      val: st.points,
      pct: Math.min(100, Math.round((st.points / Math.max(1, st.points < 10000 ? 10000 : st.points * 1.2)) * 100)),
      color: "from-orange-400 to-amber-400",
    },
    {
      label: "Battles Won",
      val: st.battles,
      pct: bPct,
      color: "from-indigo-400 to-violet-500",
    },
    {
      label: "Questions Solved",
      val: st.solved,
      pct: qPct,
      color: "from-sky-400 to-cyan-500",
    },
    {
      label: "Day Streak",
      val: st.streak,
      pct: Math.min(100, Math.round((st.streak / Math.max(1, 30)) * 100)),
      color: "from-rose-400 to-pink-500",
    },
  ];

  /* ── render ─────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>

      {/* ══════════ LEFT SIDEBAR ══════════════════════ */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col h-full z-20 shadow-sm">
        <div className="h-[72px] flex items-center px-6 gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
            <Code2 className="w-4 h-4 text-white"/>
          </div>
          <span className="text-[18px] font-black text-slate-800 tracking-tight">devio</span>
        </div>
        <nav className="flex-1 px-3 pt-5 pb-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = typeof window !== "undefined" && window.location.pathname.startsWith(path);
            return (
              <button key={label} onClick={() => navigate(path)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left transition-all
                  ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <Icon style={{ width:18, height:18 }} className="shrink-0"/>
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ══════════ MAIN + RIGHT ══════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── HEADER ─────────────────────────────────── */}
        <header className="h-[72px] bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 z-10">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input type="text" placeholder="Search for problems…"
              className="w-full bg-slate-50 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 outline-none border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"/>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Settings style={{ width:18, height:18 }}/>
            </button>
            <button className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell style={{ width:18, height:18 }}/>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"/>
            </button>
            <div className="flex items-center gap-2.5 ml-3 pl-4 border-l border-slate-100 relative" ref={menuRef}>
              <div className="text-right">
                <div className="text-sm font-extrabold text-slate-800 leading-tight">{user.name?.split(" ")[0]}</div>
                <div className="text-[11px] text-slate-400 font-medium">{(st.points || 0).toLocaleString()} Points</div>
              </div>
              <button onClick={() => setMenuOpen(o => !o)}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-extrabold text-sm shadow hover:shadow-md transition-all">
                {user.name?.charAt(0) || "S"}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity:0, y:8, scale:0.96 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:8, scale:0.96 }}
                    transition={{ duration:0.15 }}
                    className="absolute right-0 top-[46px] w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-1.5 z-50 border border-slate-100">
                    <button className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold text-slate-700 transition-colors">
                      <Settings className="w-4 h-4 text-slate-400"/> Account Settings
                    </button>
                    <div className="my-1 border-t border-slate-100"/>
                    <button onClick={() => { localStorage.clear(); navigate("/login"); }}
                      className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-red-50 flex items-center gap-3 text-sm font-semibold text-red-500 transition-colors">
                      <LogOut className="w-4 h-4 text-red-400"/> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── BODY ───────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* ─── CENTER COLUMN ──────────────────────── */}
          <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5" style={{ scrollbarWidth:"none" }}>

            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-[26px] px-8 py-7 flex items-center justify-between relative overflow-hidden shadow-lg shadow-indigo-200/60 shrink-0 h-48">
              <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/10 blur-3xl pointer-events-none"/>
              <div className="absolute -bottom-8 right-40 w-40 h-40 rounded-full bg-violet-400/20 blur-2xl pointer-events-none"/>
              <div className="relative z-10">
                <p className="text-indigo-200 text-sm font-semibold mb-1">Good to see you 👋</p>
                <h1 className="text-[28px] font-black text-white leading-tight mb-1">
                  Welcome back, {user.name?.split(" ")[0]}
                </h1>
                <p className="text-indigo-100/80 text-sm font-medium mb-5">
                  {st.streak > 0 ? `🔥 ${st.streak}-day streak! Keep it going!` : "Ready to code today?"}
                </p>
                <button onClick={() => navigate("/student/practice")}
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-full text-sm font-extrabold shadow hover:shadow-md hover:-translate-y-0.5 transition-all">
                  Start Practicing <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
              <div className="absolute right-0 bottom-0 w-[40%] h-full hidden lg:block">
                <img src={illustration} alt="coder" className="w-full h-full object-cover drop-shadow-xl"/>
              </div>
            </div>

            {/* Stats header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-slate-800">Your Stats</h2>
              <button onClick={() => navigate("/student/leaderboard")} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Leaderboard</button>
            </div>

            {/* Stats card */}
            {loading ? (
              <div className="bg-white rounded-[22px] p-8 shadow-sm border border-slate-100 flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"/>
              </div>
            ) : (
              <div className="bg-white rounded-[22px] p-6 shadow-sm border border-slate-100 flex gap-6 items-center shrink-0">
                {/* bar list */}
                <div className="flex-1 flex flex-col gap-4">
                  {STAT_ROWS.map(s => (
                    <StatBar key={s.label} label={s.label} pct={s.pct} color={s.color}/>
                  ))}
                  {/* value chips */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {STAT_ROWS.map(s => (
                      <div key={s.label} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                        <div className={`w-1.5 h-5 rounded-full bg-gradient-to-b ${s.color}`}/>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
                          <div className="text-sm font-extrabold text-slate-700">{s.val.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* divider */}
                <div className="w-px self-stretch bg-slate-100"/>

                {/* rings — use real data */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="flex gap-8">
                    <Ring
                      pct={bPct}
                      c1="#F59E0B" c2="#F97316"
                      label="Battles Won"
                      sub={`${st.battles}/${st.totalBattles}`}
                    />
                    <Ring
                      pct={qPct}
                      c1="#8B5CF6" c2="#6366F1"
                      label="Questions"
                      sub={`${st.solved}/${st.totalQuestions}`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center max-w-[180px]">
                    Battles Won &amp; Questions Solved vs. available
                  </p>
                </div>
              </div>
            )}

            {/* Join Classroom */}
            <div className="bg-white rounded-[22px] p-6 shadow-sm border border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-extrabold text-slate-800">Join a Classroom</h2>
                <span className="text-xs text-slate-400">Enter code to join</span>
              </div>
              <div className="flex gap-2 mb-4">
                <input value={code} onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && code.trim() && (alert(`Joining: ${code.toUpperCase()}`), setCode(""))}
                  placeholder="Classroom code e.g. CS-2024"
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"/>
                <button onClick={() => { if (!code.trim()) return; alert(`Joining: ${code.toUpperCase()}`); setCode(""); }}
                  className="bg-indigo-600 text-white text-sm font-bold px-5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                  Join
                </button>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Joined Classrooms</div>
              {classrooms.length ? (
                <div className="flex flex-col gap-2">
                  {classrooms.map((c,i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Mentor: {c.mentor}</div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">No classrooms joined yet.</div>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN ───────────────────────── */}
          <div className="w-[400px] shrink-0 border-l border-slate-100 overflow-y-auto px-5 py-6 flex flex-col gap-5" style={{ scrollbarWidth:"none" }}>

            {/* Calendar */}
            <ActivityCalendar activeDates={activeDates}/>

            {/* Recommended Problems */}
            <div className="bg-white rounded-[22px] p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-extrabold text-slate-800">Recommended</div>
                <button onClick={() => navigate("/student/practice")}
                  className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                  View all
                </button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <button onClick={goPrev} disabled={idx === 0}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50">
                  <ChevronLeft className="w-3.5 h-3.5"/> Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.ceil(TOTAL / VISIBLE) }).map((_,pi) => (
                    <div key={pi} className={`w-1.5 h-1.5 rounded-full transition-colors ${Math.floor(idx/VISIBLE)===pi ? "bg-indigo-600" : "bg-slate-200"}`}/>
                  ))}
                </div>
                <button onClick={goNext}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50">
                  Next <ChevronRight className="w-3.5 h-3.5"/>
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity:0, y: dir * 14 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y: dir * -14 }}
                  transition={{ duration:0.3 }}
                  className="flex flex-col">
                  {shown.map((p, i) => {
                    const ds = DIFF_STYLE[p.difficulty] || DIFF_STYLE.Easy;
                    return (
                      <motion.div key={`${idx}-${i}`}
                        initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/student/practice/solver?id=${p.id}`)}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-xs shrink-0">
                            {p.title.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{p.title}</div>
                            <div className="text-[10px] text-slate-400">{p.tag} · {p.points}pts</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ds.bg} ${ds.text}`}>
                            {p.difficulty}
                          </span>
                          <button onClick={e => { e.stopPropagation(); navigate(`/student/practice/solver?id=${p.id}`); }}
                            className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors">
                            Solve
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  {!shown.length && (
                    <div className="text-xs text-slate-400 font-medium px-1 py-2">
                      {TOTAL === 0 ? "🎉 You've solved all available problems!" : "No recommendations right now."}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <AutoRotateBar onTick={goNext}/>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
