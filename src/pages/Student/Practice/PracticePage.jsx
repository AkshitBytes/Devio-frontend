  import { useState, useEffect, useMemo } from "react";
  import { useNavigate } from "react-router-dom";
  import axios from "axios";
  import { AnimatePresence, motion } from "framer-motion";
  import {
    Search, Diamond, Filter, ChevronLeft, ChevronRight,
    LayoutDashboard, Code2, Swords, Trophy, Settings,
    HelpCircle, Zap, Terminal, BookOpen, Star, TrendingUp,
    ArrowRight, Play
  } from "lucide-react";

  const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard",   path: "/studentdashboard" },
    { icon: Code2,           label: "Practice",    path: "/student/practice", active: true },
    { icon: Swords,          label: "Battles",     path: "/student/battles" },
    { icon: Trophy,          label: "Leaderboard", path: "/student/leaderboard" },
  ];

  const DIFF_LABELS = ["All", "Easy", "Medium", "Hard"];

  const diffBadge = {
    Easy:   "bg-emerald-50 text-emerald-600 border border-emerald-200",
    Medium: "bg-amber-50 text-amber-600 border border-amber-200",
    Hard:   "bg-rose-50 text-rose-600 border border-rose-200",
  };

  function Sidebar({ navigate, userStats }) {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    return (
      <aside className="w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col h-full z-20 shadow-sm">
        <div className="h-[72px] flex items-center px-6 gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
            <Code2 className="w-4 h-4 text-white" />
          </div>
            <div>
            <span className="text-[18px] font-black text-slate-800 tracking-tight">devio</span>
            <div className="text-[10px] text-slate-400 font-semibold -mt-0.5">{`Level ${Math.max(1, Math.floor(userStats.points/1000))} Coder`}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 pt-5 pb-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path: p, active }) => {
            const isActive = active || path.startsWith(p);
            return (
              <button key={label} onClick={() => navigate(p)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left transition-all
                  ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <Icon style={{ width: 18, height: 18 }} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-6 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left text-slate-500 hover:bg-slate-50 transition-all">
            <Settings style={{ width: 18, height: 18 }} /> Settings
          </button>
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left text-slate-500 hover:bg-slate-50 transition-all">
            <HelpCircle style={{ width: 18, height: 18 }} /> Help
          </button>
        </div>
      </aside>
    );
  }

  export default function PracticePage() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [diffFilter, setDiffFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [problemPage, setProblemPage] = useState(0);
    const [autoTicks, setAutoTicks] = useState(60);
    const [userStats, setUserStats] = useState({ points: 0, solved: 0, streak: 0, rank: "-" });

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return;
      axios.get("http://localhost:5000/questions", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setQuestions(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }, []);

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return;
      axios.get("http://localhost:5000/dashboard/student", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setUserStats((s) => ({
            ...s,
            points: res.data?.stats?.totalPoints || 0,
            solved: res.data?.stats?.questionsSolved || 0,
            streak: res.data?.stats?.streak || 0,
          }));
        })
        .catch(() => {});
      axios.get("http://localhost:5000/dashboard/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
        params: { range: "global", sortBy: "points" },
      })
        .then((res) => {
          const rank = res.data?.me?.rank || "-";
          setUserStats((s) => ({ ...s, rank }));
        })
        .catch(() => {});
    }, []);

    // Update when global user stats change elsewhere
    useEffect(() => {
      const handler = (e) => {
        if (e?.detail && e.detail.stats) {
          const s = e.detail.stats;
          setUserStats((prev) => ({ ...prev, points: s.totalPoints || 0, solved: s.questionsSolved || 0, streak: s.streak || 0 }));
          // update rank if provided
          if (e.detail.me?.rank) setUserStats((prev) => ({ ...prev, rank: e.detail.me.rank }));
        } else {
          // fallback: refetch minimal data
          const token = localStorage.getItem('token');
          if (!token) return;
          axios.get('http://localhost:5000/dashboard/student', { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
              setUserStats((s) => ({ ...s, points: res.data?.stats?.totalPoints || 0, solved: res.data?.stats?.questionsSolved || 0, streak: res.data?.stats?.streak || 0 }));
            }).catch(() => {});
        }
      };
      window.addEventListener('devio:userStatsUpdated', handler);
      return () => window.removeEventListener('devio:userStatsUpdated', handler);
    }, []);

    const filtered = questions.filter((q) => {
      const matchDiff = diffFilter === "All" || q.difficulty === diffFilter;
      const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase());
      return matchDiff && matchSearch;
    });

    const recommended = filtered.slice(0, 12);
    const pages = Math.max(1, Math.ceil(recommended.length / 4));
    const pagedProblems = useMemo(() => {
      const start = problemPage * 4;
      return recommended.slice(start, start + 4);
    }, [problemPage, recommended]);

    useEffect(() => {
      setProblemPage((curr) => Math.min(curr, pages - 1));
    }, [pages]);

    useEffect(() => {
      const timer = setInterval(() => {
        setAutoTicks((t) => {
          if (t <= 1) {
            setProblemPage((p) => (p + 1) % pages);
            return 60;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, [pages]);

    return (
      <div className="flex h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>
        <Sidebar navigate={navigate} userStats={userStats} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-[72px] bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 z-10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</div>
              <div className="font-extrabold text-slate-800 text-base">Practice Arena</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-extrabold text-indigo-600">{userStats.points.toLocaleString()} Points</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-extrabold text-sm shadow">
                C
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-5 p-5">

              {/* Main content */}
              <section className="flex-1 flex flex-col gap-5 min-w-0">

                {/* Open Sandbox Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 p-8 text-white"
                >
                  {/* Decorative blobs */}
                  <div className="absolute -left-10 -top-10 w-52 h-52 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                  <div className="absolute right-20 -bottom-8 w-44 h-44 rounded-full bg-violet-300/20 blur-2xl pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-64 flex items-center justify-center opacity-10 pointer-events-none select-none">
                    <Terminal style={{ width: 180, height: 180 }} />
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Terminal className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">Free Sandbox</span>
                      </div>
                      <h1 className="text-3xl font-black mb-2 leading-tight">
                        Practice on Your Own<br />Terms. No Pressure.
                      </h1>
                      <p className="text-sm font-medium text-indigo-200 mb-1 max-w-md">
                        Experiment freely with JavaScript, Python, C++, or Java in a zero-stakes environment. Debug ideas, test algorithms, and sharpen your skills before tackling ranked problems.
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200">
                          <Code2 className="w-3.5 h-3.5" /> 4 Languages
                        </div>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200">
                          <Zap className="w-3.5 h-3.5" /> Instant Execution
                        </div>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200">
                          <Star className="w-3.5 h-3.5" /> No Limits
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-3">
                      <button
                        onClick={() => navigate("/freepractice")}
                        className="group bg-white text-indigo-600 rounded-2xl px-7 py-3.5 text-sm font-extrabold transition-all hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-2"
                      >
                        Open Sandbox
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <div className="text-center text-[10px] text-indigo-300 font-medium">Free · No signup required</div>
                    </div>
                  </div>
                </motion.div>

                {/* Search */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="relative"
                >
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-slate-200 py-3.5 pl-11 pr-5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 shadow-sm transition-all"
                    placeholder="Search practice problems…"
                  />
                </motion.div>

                {/* Question Bank */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-[15px] font-extrabold text-slate-800">Question Bank</h2>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{filtered.length} problems available</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      {DIFF_LABELS.map((d) => (
                        <button key={d} onClick={() => setDiffFilter(d)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${diffFilter === d
                            ? d === "Easy" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : d === "Medium" ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : d === "Hard" ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                            : "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-[40px_1fr_90px_80px_80px] gap-x-4 px-3 pb-3 border-b border-slate-100">
                    {["#", "PROBLEM", "DIFFICULTY", "STATUS", "POINTS"].map(h => (
                      <div key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</div>
                    ))}
                  </div>

                  <div className="divide-y divide-slate-50">
                    {filtered.map((q, i) => (
                      <motion.button
                        key={q.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => navigate(`/student/practice/solver?id=${q.id}`)}
                        className="w-full text-left grid grid-cols-[40px_1fr_90px_80px_80px] gap-x-4 px-3 py-4 rounded-xl hover:bg-slate-50 transition-all items-center group"
                      >
                        <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{q.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Practice challenge</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg w-fit ${diffBadge[q.difficulty] || diffBadge.Easy}`}>
                          {q.difficulty || "Easy"}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg w-fit border ${q.isSolved ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          {q.isSolved ? "Solved" : "Pending"}
                        </span>
                        <span className="text-xs font-extrabold text-indigo-600 flex items-center gap-1">
                          {q.points || 10} <Diamond className="w-3 h-3 fill-current" />
                        </span>
                      </motion.button>
                    ))}
                    {filtered.length === 0 && (
                      <div className="py-16 text-center text-slate-400 font-medium text-sm">
                        No problems match your search.
                      </div>
                    )}
                  </div>
                </motion.div>
              </section>

              {/* Right sidebar */}
              <aside className="w-[340px] shrink-0 flex flex-col gap-5">

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5"
                >
                  <h3 className="text-[13px] font-extrabold text-slate-800 mb-4">Your Progress</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Solved", value: String(userStats.solved), color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Streak", value: `${userStats.streak}d`, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Rank", value: userStats.rank === "-" ? "-" : `#${userStats.rank}`, color: "text-indigo-600", bg: "bg-indigo-50" },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
                        <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Recommended */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 flex-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-extrabold text-slate-800">Recommended</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{autoTicks}s</span>
                      <div className="flex gap-1">
                        <button onClick={() => setProblemPage(p => Math.max(0, p - 1))} className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => setProblemPage(p => (p + 1) % pages)} className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={problemPage}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2"
                    >
                      {pagedProblems.map((item, i) => (
                        <motion.button
                          key={item.id || item.title}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          onClick={() => navigate(`/student/practice/solver?id=${item.id}`)}
                          className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between group border border-transparent hover:border-slate-100 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-extrabold shrink-0">
                              {(item.title || "Q").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{item.title}</p>
                              <p className="text-[10px] text-slate-400">{item.difficulty} · {item.points || 10} Points</p>
                            </div>
                          </div>
                          <div className="shrink-0 w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <Play className="w-3 h-3 text-white fill-white" />
                          </div>
                        </motion.button>
                      ))}
                      {pagedProblems.length === 0 && (
                        <p className="text-slate-400 text-xs font-medium py-4 text-center">No problems yet.</p>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-indigo-500 rounded-full" animate={{ width: `${((60 - autoTicks) / 60) * 100}%` }} />
                  </div>
                </motion.div>

                {/* Quick tip */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-indigo-100 rounded-[24px] p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-extrabold text-indigo-700">Pro Tip</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Use the Free Sandbox to prototype your approach before submitting. It saves attempts and builds confidence.
                  </p>
                </motion.div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    );
  }
