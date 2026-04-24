import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Code2, Swords, Trophy, Users,
  Search, Bell, Settings, LogOut,
  Crown, Flame, Target, TrendingUp, Star,
  ChevronUp, ChevronDown, Medal, Diamond,
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   path: "/studentdashboard"   },
  { icon: Code2,           label: "Practice",    path: "/student/practice"    },
  { icon: Swords,          label: "Battles",     path: "/student/battles"     },
  { icon: Trophy,          label: "Leaderboard", path: "/student/leaderboard" },
];

const PODIUM_COLORS = {
  1: { gradient: "from-amber-400 to-yellow-300",   ring: "ring-amber-300",  crown: "#F59E0B", height: "h-32", badge: "bg-amber-100 text-amber-700" },
  2: { gradient: "from-slate-400 to-slate-300",    ring: "ring-slate-300",  crown: "#94A3B8", height: "h-24", badge: "bg-slate-100 text-slate-700" },
  3: { gradient: "from-orange-400 to-amber-300",   ring: "ring-orange-300", crown: "#F97316", height: "h-20", badge: "bg-orange-100 text-orange-700" },
};

/* ─────────────────────────────────────────────
   MINI STAT CHIP
───────────────────────────────────────────── */
function Chip({ icon: Icon, val, label, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-3 h-3" />
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-medium leading-none">{label}</div>
        <div className="text-xs font-extrabold text-slate-700 leading-none mt-0.5">{val.toLocaleString()}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PODIUM CARD
───────────────────────────────────────────── */
function PodiumCard({ player, delay = 0 }) {
  const c = PODIUM_COLORS[player.rank];
  const isFirst = player.rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center ${isFirst ? "mt-0" : "mt-6"}`}
    >
      {/* Crown for #1 */}
      {isFirst && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
          className="mb-2"
        >
          <Crown className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-sm" />
        </motion.div>
      )}

      {/* Avatar */}
      <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ${c.ring}`}>
        {player.avatar}
        <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full ${c.badge} flex items-center justify-center text-[11px] font-black shadow-sm border-2 border-white`}>
          {player.rank}
        </div>
      </div>

      {/* Name & country */}
      <div className="mt-3 text-center">
        <div className={`font-extrabold text-slate-800 ${isFirst ? "text-sm" : "text-xs"}`}>{player.name.split(" ")[0]}</div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{player.country}</div>
      </div>

      {/* Points */}
      <div className={`mt-2 flex items-center gap-1 font-black ${isFirst ? "text-base text-indigo-600" : "text-sm text-indigo-500"}`}>
        <Diamond className="w-3 h-3 fill-current" />
        {player.pts.toLocaleString()}
      </div>

      {/* Mini stats */}
      <div className="mt-2 flex gap-2">
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{player.wins}W</span>
        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">{player.solved}Q</span>
      </div>

      {/* Podium base */}
      <div className={`mt-3 w-24 ${c.height} bg-gradient-to-b ${c.gradient} rounded-t-xl opacity-30`} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   RANK ROW
───────────────────────────────────────────── */
function RankRow({ player, delay = 0 }) {
  const isMe = player.isMe;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`grid grid-cols-[52px_1fr_110px_90px_90px_72px] items-center px-5 py-3.5 border-b border-slate-100 last:border-0 transition-colors
        ${isMe ? "bg-indigo-50/70 hover:bg-indigo-50" : "hover:bg-slate-50"}`}
    >
      {/* Rank */}
      <div className="flex items-center gap-1">
        <span className={`text-sm font-extrabold ${isMe ? "text-indigo-600" : "text-slate-500"}`}>#{player.rank}</span>
        {player.change === "up"   && <ChevronUp   className="w-3 h-3 text-emerald-500 shrink-0" />}
        {player.change === "down" && <ChevronDown  className="w-3 h-3 text-rose-400 shrink-0" />}
      </div>

      {/* Player */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0
          ${isMe ? "bg-indigo-600 text-white shadow shadow-indigo-200" : "bg-indigo-50 text-indigo-600"}`}>
          {player.avatar}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-800 truncate">
            {player.name}
            {isMe && <span className="ml-1.5 text-[10px] font-extrabold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">You</span>}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">{player.country}</div>
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center gap-1 font-black text-indigo-600 text-sm">
        <Diamond className="w-3 h-3 fill-current shrink-0" />
        {player.pts.toLocaleString()}
      </div>

      {/* Solved */}
      <div className="font-bold text-slate-600 text-sm">{player.solved}</div>

      {/* Wins */}
      <div className="font-bold text-slate-600 text-sm">{player.wins}</div>

      {/* Streak */}
      <div className="flex items-center gap-1">
        <Flame className={`w-3.5 h-3.5 ${player.streak >= 10 ? "text-orange-500" : "text-slate-300"}`} />
        <span className="text-sm font-bold text-slate-600">{player.streak}</span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   USER RANK CARD (right sidebar)
───────────────────────────────────────────── */
function UserRankCard({ me, totalPlayers = 0 }) {
  const percentile = me ? Math.round(((totalPlayers - me.rank + 1) / Math.max(1, totalPlayers)) * 100) : 0;
  const stats = [
    { icon: Diamond,    val: (me?.points || 0).toLocaleString(), label: "Points",       color: "bg-indigo-100 text-indigo-600" },
    { icon: Target,     val: me?.solved || 0,                     label: "Solved",       color: "bg-sky-100 text-sky-600"      },
    { icon: Swords,     val: me?.wins || 0,                       label: "Battles Won",  color: "bg-violet-100 text-violet-600"},
    { icon: Flame,      val: `${me?.streak || 0}d`,               label: "Streak",       color: "bg-orange-100 text-orange-600"},
  ];

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-sm border border-slate-100">
      <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-4">Your Ranking</div>

      {/* Avatar + rank badge */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200/50">
            Y
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow border-2 border-white">
            #{me?.rank || "-"}
          </div>
        </div>
        <div className="mt-4 text-sm font-extrabold text-slate-800">You</div>
        <div className="text-[11px] text-slate-400 font-medium">{me?.country || "IN"} · Student</div>

        {/* Percentile pill */}
        <div className="mt-2 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full">
          <TrendingUp className="w-3 h-3 text-indigo-600" />
          <span className="text-xs font-extrabold text-indigo-700">Top {Math.max(1, 100 - percentile + 1)}%</span>
        </div>
      </div>

      {/* Rank progress */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-500">Rank #{me?.rank || "-"}</span>
          <span className="text-[10px] font-bold text-slate-400">→ #{Math.max(1, (me?.rank || 2) - 1)}</span>
        </div>
        <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "68%" }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400 font-medium">{(me?.points || 0).toLocaleString()} Points</span>
          <span className="text-[9px] text-slate-400 font-medium">{Math.max(0, 500 - ((me?.points || 0) % 500))} Points to go</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 mb-4" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.4 }}
            className="bg-slate-50 rounded-xl p-3 flex items-center gap-2"
          >
            <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium leading-none">{s.label}</div>
              <div className="text-sm font-extrabold text-slate-700 leading-none mt-0.5">{s.val}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <button className="mt-4 w-full bg-indigo-600 text-white text-sm font-extrabold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center gap-2">
        <Swords className="w-4 h-4" /> Start a Battle
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LEADERBOARD PAGE
───────────────────────────────────────────── */
export default function LeaderBoard() {
  const navigate = useNavigate();
  const [range, setRange]   = useState("Global");
  const [sortBy, setSortBy] = useState("pts");
  const [user, setUser]     = useState({ name: "Student" });
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState(null);
  const [lbStats, setLbStats] = useState({ totalPlayers: 0, topScore: 0, avgPoints: 0, battlesToday: 0 });
  const [menuOpen]          = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("http://localhost:5000/dashboard/student", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      if (r.data.user) setUser(r.data.user);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("http://localhost:5000/dashboard/leaderboard", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        range: range.toLowerCase(),
        sortBy: sortBy === "pts" ? "points" : sortBy,
      },
    }).then(r => {
      const mapped = (r.data.players || []).map((p) => ({
        ...p,
        pts: p.points,
        change: "same",
        isMe: String(p.id) === String(r.data.me?.id),
      }));
      setPlayers(mapped);
      setMe(r.data.me ? { ...r.data.me, pts: r.data.me.points } : null);
      if (r.data.stats) setLbStats(r.data.stats);
    }).catch(() => {});
  }, [range, sortBy]);

  // Listen for global updates and refresh leaderboard when user stats change elsewhere
  useEffect(() => {
    const handler = (e) => {
      // If detail contains leaderboard payload, use it; otherwise refetch
      if (e?.detail && e.detail.players) {
        const mapped = (e.detail.players || []).map((p) => ({ ...p, pts: p.points, change: 'same', isMe: String(p.id) === String(e.detail.me?.id) }));
        setPlayers(mapped);
        setMe(e.detail.me ? { ...e.detail.me, pts: e.detail.me.points } : null);
        if (e.detail.stats) setLbStats(e.detail.stats);
      } else {
        const token = localStorage.getItem('token');
        if (!token) return;
        axios.get('http://localhost:5000/dashboard/leaderboard', { headers: { Authorization: `Bearer ${token}` }, params: { range: range.toLowerCase(), sortBy: sortBy === 'pts' ? 'points' : sortBy } })
          .then(r => {
            const mapped = (r.data.players || []).map((p) => ({ ...p, pts: p.points, change: 'same', isMe: String(p.id) === String(r.data.me?.id) }));
            setPlayers(mapped);
            setMe(r.data.me ? { ...r.data.me, pts: r.data.me.points } : null);
            if (r.data.stats) setLbStats(r.data.stats);
          }).catch(() => {});
      }
    };
    window.addEventListener('devio:userStatsUpdated', handler);
    return () => window.removeEventListener('devio:userStatsUpdated', handler);
  }, [range, sortBy]);

  const topThree = players.filter(p => p.rank <= 3).sort((a, b) => a.rank - b.rank);
  const second = topThree.find(p => p.rank === 2);
  const first = topThree.find(p => p.rank === 1);
  const third = topThree.find(p => p.rank === 3);
  const podiumOrder = [second, first, third].filter(Boolean);
  const sorted = players;

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>

      {/* ══════════ SIDEBAR ══════════════════════════ */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col h-full z-20 shadow-sm">
        <div className="h-[72px] flex items-center px-6 gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-[18px] font-black text-slate-800 tracking-tight">devio</span>
        </div>
        <nav className="flex-1 px-3 pt-5 pb-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = typeof window !== "undefined" && window.location.pathname.startsWith(path);
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left transition-all
                  ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
              >
                <Icon style={{ width: 18, height: 18 }} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ══════════ MAIN ═════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── HEADER ─────────────────────────────── */}
        <header className="h-[72px] bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 z-10">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search players…"
              className="w-full bg-slate-50 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 outline-none border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Settings style={{ width: 18, height: 18 }} />
            </button>
            <button className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell style={{ width: 18, height: 18 }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2.5 ml-3 pl-4 border-l border-slate-100">
              <div className="text-right">
                <div className="text-sm font-extrabold text-slate-800 leading-tight">{user.name?.split(" ")[0]}</div>
                <div className="text-[11px] text-slate-400 font-medium">Student Profile</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-extrabold text-sm shadow">
                {user.name?.charAt(0) || "S"}
              </div>
            </div>
          </div>
        </header>

        {/* ── BODY ───────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* ─── CENTER COLUMN ──────────────────── */}
          <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5" style={{ scrollbarWidth: "none" }}>

            {/* Page header */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-[22px] font-black text-slate-800 leading-tight">Top Combatants</h1>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Global rankings by coding points and win rate</p>
              </div>
              <div className="flex items-center gap-2">
                {["Global", "Weekly", "Monthly"].map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all
                      ${range === r
                        ? "bg-indigo-600 text-white shadow shadow-indigo-200"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* ── PODIUM ────────────────────────── */}
            <div className="bg-white rounded-[26px] px-8 py-6 shadow-sm border border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-800">Hall of Fame</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-bold text-slate-400">Top 3 this week</span>
                </div>
              </div>

              {/* Podium visual */}
              <div className="flex items-end justify-center gap-6">
                {podiumOrder.map((p, i) => (
                  <PodiumCard key={p.id || p.rank} player={p} delay={i * 0.12} />
                ))}
              </div>
            </div>

            {/* ── RANKINGS TABLE ────────────────── */}
            <div className="bg-white rounded-[22px] shadow-sm border border-slate-100 overflow-hidden shrink-0">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <span className="text-sm font-extrabold text-slate-800">Global Rankings</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">Sort by:</span>
                  {[["pts", "Points"], ["solved", "Solved"], ["wins", "Wins"]].map(([key, lbl]) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all
                        ${sortBy === key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[52px_1fr_110px_90px_90px_72px] px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                {["Rank", "Player", "Points", "Solved", "Wins", "Streak"].map(h => (
                  <div key={h} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{h}</div>
                ))}
              </div>

              {/* Rows */}
              <AnimatePresence mode="wait">
                <motion.div key={sortBy}>
                  {sorted.map((p, i) => (
                    <RankRow key={p.id || p.rank} player={p} delay={i * 0.03} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>{/* end center */}

          {/* ─── RIGHT COLUMN ───────────────────── */}
          <div className="w-[320px] shrink-0 border-l border-slate-100 overflow-y-auto px-5 py-6 flex flex-col gap-5" style={{ scrollbarWidth: "none" }}>

            {/* User rank card */}
            <UserRankCard me={me} totalPlayers={players.length} />

            {/* Quick stats summary */}
            <div className="bg-white rounded-[22px] p-5 shadow-sm border border-slate-100">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-4">Leaderboard Stats</div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Total Players",   val: lbStats.totalPlayers, icon: Users,    color: "bg-sky-100 text-sky-600"      },
                  { label: "Top Score",       val: (lbStats.topScore || 0).toLocaleString(), icon: Diamond,  color: "bg-indigo-100 text-indigo-600"},
                  { label: "Avg Points",      val: (lbStats.avgPoints || 0).toLocaleString(), icon: TrendingUp,color:"bg-emerald-100 text-emerald-600"},
                  { label: "Battles Today",   val: lbStats.battlesToday, icon: Swords,   color: "bg-violet-100 text-violet-600"},
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.5 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
                      <div className="text-sm font-extrabold text-slate-700">{s.val}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Practice CTA banner */}
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[22px] p-5 text-white shadow-lg shadow-indigo-200/50 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <Trophy className="w-8 h-8 text-indigo-200 mb-3" />
              <div className="text-sm font-extrabold mb-1">Climb the ranks!</div>
              <div className="text-indigo-100/80 text-[11px] font-medium mb-4 leading-relaxed">
                Solve more problems & win battles to boost your position
              </div>
              <button
                onClick={() => navigate("/student/practice")}
                className="w-full bg-white text-indigo-600 text-xs font-extrabold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow"
              >
                Start Practicing →
              </button>
            </div>

          </div>{/* end right */}
        </div>{/* end body */}
      </div>{/* end main */}
    </div>
  );
}
