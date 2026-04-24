import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Swords, Play, Copy, Check, Shield, Award, ChevronLeft,
    Home, BookOpen, Calendar, User, Settings, HelpCircle, LogOut,
    ChevronRight, Diamond, Bell, Trophy, Timer, Code2, Terminal,
    AlertCircle, Flame, Zap, LayoutDashboard, Users, Search,
    Plus, Minus, ToggleLeft, ToggleRight, Radio, Star, TrendingUp,
    MessageSquare, Clock, CheckCircle2, XCircle, History, Flag
} from "lucide-react";

/* ─── NAV (mirrors dashboard sidebar) ─── */
const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard",   path: "/studentdashboard"   },
    { icon: Code2,           label: "Practice",    path: "/student/practice"    },
    { icon: Swords,          label: "Battles",     path: "/student/battles",  active: true },
    { icon: Trophy,          label: "Leaderboard", path: "/student/leaderboard" },
];

const LANGS = [
    { id: 71, label: "Python 3", monaco: "python" },
    { id: 62, label: "Java",     monaco: "java"   },
    { id: 54, label: "C++",      monaco: "cpp"    },
    { id: 63, label: "JavaScript", monaco: "javascript" },
];

const DEFAULT_CODE = {
    python:     "# Write your solution here\ndef solve():\n    pass\n",
    java:       "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n",
    cpp:        "#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Your code here\n    return 0;\n}\n",
    javascript: "const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n// Your code here\n",
};

const MOCK_COMBATANTS = [];
const MOCK_MATCH_HISTORY = [];

const DIFF_COLORS = {
    Novice: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    Master: { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200"   },
    Elite:  { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200"    },
};

/* ─── Confetti ─── */
const Confetti = () => {
    useEffect(() => {
        const fireBurst = () => {
            if (typeof window === "undefined" || typeof window.confetti !== "function") return;

            const fire = (particleRatio, opts) => window.confetti({
                origin: { y: 0.62 },
                colors: ["#4F46E5", "#7C3AED", "#10B981", "#F59E0B", "#6366F1"],
                ...opts,
                particleCount: Math.floor(220 * particleRatio),
            });

            fire(0.25, { spread: 30, startVelocity: 55 });
            fire(0.2, { spread: 65 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.85 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        };

        if (typeof window !== "undefined" && typeof window.confetti === "function") {
            fireBurst();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
        script.async = true;
        script.onload = fireBurst;
        document.head.appendChild(script);

        return () => {
            try { document.head.removeChild(script); } catch {}
        };
    }, []);

    return null;
};

/* ─── Shared Sidebar (no Start Quest button) ─── */
function Sidebar({ navigate, user }) {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    return (
        <aside className="w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col h-full z-20 shadow-sm">
            <div className="h-[72px] flex items-center px-6 gap-2.5 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
                    <Code2 className="w-4 h-4 text-white"/>
                </div>
                <div>
                    <span className="text-[18px] font-black text-slate-800 tracking-tight">devio</span>
                    <div className="text-[10px] text-slate-400 font-semibold -mt-0.5">{user?.points ? `Level ${Math.max(1, Math.floor(user.points/1000))} Coder` : "Level 42 Coder"}</div>
                </div>
            </div>
            <nav className="flex-1 px-3 pt-5 pb-4 flex flex-col gap-1 overflow-y-auto">
                {NAV_ITEMS.map(({ icon: Icon, label, path: p, active }) => {
                    const isActive = active || path.startsWith(p);
                    return (
                        <button key={label} onClick={() => navigate(p)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left transition-all
                                ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                            <Icon style={{ width:18, height:18 }} className="shrink-0"/>
                            {label}
                        </button>
                    );
                })}
            </nav>
            {/* Settings & Help — no Start Quest */}
            <div className="px-3 pb-6 flex flex-col gap-1">
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left text-slate-500 hover:bg-slate-50 transition-all">
                    <Settings style={{width:18,height:18}}/> Settings
                </button>
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold w-full text-left text-slate-500 hover:bg-slate-50 transition-all">
                    <HelpCircle style={{width:18,height:18}}/> Help
                </button>
            </div>
        </aside>
    );
}

/* ─── Shared Header ─── */
function Header({ title, subtitle, user }) {
    const lsUsername = localStorage.getItem("username") || "Coder";
    return (
        <header className="h-[72px] bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 z-10">
            <div className="relative w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input type="text" placeholder="Search battle arenas…"
                    className="w-full bg-slate-50 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 outline-none border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"/>
            </div>
            <div className="flex items-center gap-3">
                <button className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                    <Bell style={{width:18,height:18}}/>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"/>
                </button>
                <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                    <User style={{width:18,height:18}}/>
                </button>
                <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
                    <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-800 leading-tight">{user?.name?.split(" ")[0] || lsUsername}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{(user?.points || 0).toLocaleString()} Points</div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-extrabold text-sm shadow">
                        {user?.name?.charAt(0) || "C"}
                    </div>
                </div>
            </div>
        </header>
    );
}

/* ─── Progress bar ─── */
function ProgressBar({ pct, color = "from-indigo-500 to-violet-500" }) {
    return (
        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-1.5 rounded-full bg-gradient-to-r ${color}`}/>
        </div>
    );
}

/* ─── Forfeit Confirm Modal ─── */
function ForfeitModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl border border-slate-100 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                    <Flag className="w-7 h-7 text-rose-500"/>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Leave Battle?</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                    Leaving now will count as a forfeit — your opponent wins instantly. This cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                        Keep Fighting
                    </button>
                    <button onClick={onConfirm}
                        className="flex-1 py-3 rounded-2xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 transition-colors flex items-center justify-center gap-2">
                        <Flag className="w-4 h-4"/> Forfeit
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function BattlePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCode = searchParams.get("code") || "";

    // ── Read auth from localStorage FIRST — must be before any useState that references them ──
    const token      = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId") || "anon";
    const lsUsername = localStorage.getItem("username") || "Coder";
    const normalizeId = (id) => String(id?._id ?? id?.id ?? id ?? "").trim();

    const [phase, setPhase]             = useState("lobby");
    const [activeQ, setActiveQ]         = useState(0);
    const [user, setUser]               = useState({ name: lsUsername, id: storedUserId });
    const [currentUserId, setCurrentUserId] = useState(normalizeId(storedUserId) || "anon");
    const [inviteCode, setInviteCode]   = useState("");
    const [joinCode, setJoinCode]       = useState(initialCode);
    const [battle, setBattle]           = useState(null);
    const [questions, setQuestions]     = useState([]);
    const [lang, setLang]               = useState(LANGS[0]);
    const [codes, setCodes]             = useState({});
    const [submitResult, setSubmitResult] = useState(null);
    const [submitting, setSubmitting]   = useState(false);
    const [timer, setTimer]             = useState(1800);
    const [chat, setChat]               = useState([]);
    const [opponentSolved, setOpponentSolved] = useState([]);
    const [winnerInfo, setWinnerInfo]   = useState(null);
    const [copied, setCopied]           = useState(false);
    const [isCreator, setIsCreator]     = useState(false);
    const [opponentJoined, setOpponentJoined] = useState(null);
    const [showForfeitModal, setShowForfeitModal] = useState(false);
    const [matchHistory, setMatchHistory] = useState([]);
    const [topCombatants, setTopCombatants] = useState([]);

    // ── Battle config state ──
    const [difficulty, setDifficulty]   = useState("Novice");
    const [problemCount, setProblemCount] = useState(5);
    const [timeLimit, setTimeLimit]     = useState(30);
    const [streakBooster, setStreakBooster] = useState(true);

    // ── Active battle config (locked in when battle starts) ──
    const [activeBattleConfig, setActiveBattleConfig] = useState(null);

    const socketRef = useRef(null);
    const timerRef  = useRef(null);
    const isCreatorRef = useRef(false);

    useEffect(() => {
        isCreatorRef.current = isCreator;
    }, [isCreator]);


    useEffect(() => {
        if (!token) return;
        axios.get("http://localhost:5000/dashboard/student", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data.user) {
                    const apiName = res.data.user.name || lsUsername;
                    const resolvedUserId = normalizeId(res.data.user._id || res.data.user.id || storedUserId) || "anon";
                    setUser({ name: apiName, id: resolvedUserId });
                    setCurrentUserId(resolvedUserId);
                    localStorage.setItem("username", apiName);
                    if (resolvedUserId) {
                        localStorage.setItem("userId", resolvedUserId);
                    }
                }
            })
            .catch(() => {});
    }, [token, storedUserId]);

    useEffect(() => {
        if (!token) return;
        axios.get("http://localhost:5000/dashboard/student", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                setMatchHistory(res.data?.matchHistory || []);
            })
            .catch(() => {});
        axios.get("http://localhost:5000/dashboard/leaderboard", {
            headers: { Authorization: `Bearer ${token}` },
            params: { range: "global", sortBy: "points" },
        })
            .then((res) => {
                const players = (res.data?.players || []).slice(0, 3).map((p) => ({
                    rank: p.rank,
                    name: p.name,
                    points: p.points,
                    winRate: p.solved > 0 ? Math.min(99.9, Math.round((p.wins / p.solved) * 1000) / 10) : 0,
                    avatar: (p.name || "U").charAt(0).toUpperCase(),
                }));
                setTopCombatants(players);
            })
            .catch(() => {});
    }, [token]);

    const connectSocket = useCallback((battleId) => {
        if (socketRef.current) socketRef.current.disconnect();
        const sock = io("http://localhost:5000/battle", { auth: { token } });
        socketRef.current = sock;
        sock.emit("join_battle_room", { battleId, userId: currentUserId });
        sock.on("joined",          ({ battle })          => setBattle(battle));
        sock.on("player_joined",   ({ username: un })    => {
            setOpponentJoined({ username: un, avatar: un.charAt(0).toUpperCase() });
            setChat(c => [...c, { system: true, msg: `${un} joined the battle!` }]);

            // Creator triggers battle start (reliable auto-start)
            if (isCreatorRef.current) {
                sock.emit("start_battle", { battleId });
            }
        });

        sock.on("battle_started",  ({ battle: b }) => {
            setBattle(b);
            // ── Use the time limit from the battle config if provided by server,
            //    otherwise fall back to the locally set timeLimit ──
            const battleTimeLimitSeconds = (b.timeLimitMinutes || b.timeLimit || null);
            loadQuestions(b.questions).then(() => {
                startTimer(battleTimeLimitSeconds);
                setPhase("arena");
            });
        });

        sock.on("battle_update",   ({ battle: b }) => {
            setBattle(b);
            const opp = b.players.find(p => normalizeId(p.userId) !== currentUserId);
            if (opp) setOpponentSolved(opp.solvedQuestions || []);
        });
        sock.on("submit_result",   (res) => {
            setSubmitting(false);
            setSubmitResult(res);
            if (res.allPassed) {
                setBattle(b => {
                    if (!b) return b;
                    return {
                        ...b,
                        players: b.players.map(p =>
                            normalizeId(p.userId) === currentUserId
                                ? { ...p, solvedQuestions: [...(p.solvedQuestions || []), questions[activeQ]?.id] }
                                : p
                        ),
                    };
                });
            }
        });
        sock.on("battle_finished", ({ winnerId, battle: b }) => {
            setBattle(b);
            const normalizedWinnerId = normalizeId(winnerId);
            setWinnerInfo({ winnerId: normalizedWinnerId, isWinner: normalizedWinnerId === currentUserId });
            setPhase("results");
            stopTimer();
            if (normalizedWinnerId !== currentUserId) {
                setTimeout(() => {
                    socketRef.current?.disconnect();
                    navigate("/studentdashboard");
                }, 5000);
            }
            (async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const r = await axios.get('http://localhost:5000/dashboard/student', { headers: { Authorization: `Bearer ${token}` } });
                    window.dispatchEvent(new CustomEvent('devio:userStatsUpdated', { detail: r.data }));
                } catch (e) { /* ignore */ }
            })();
        });
        sock.on("opponent_submitting", () => setChat(c => [...c, { system: true, msg: "Opponent is submitting…" }]));
        sock.on("player_disconnected", ({ userId: uid }) =>
            setChat(c => [...c, { system: true, msg: `Player ${normalizeId(uid) === currentUserId ? "(you)" : "opponent"} disconnected` }])
        );
    }, [currentUserId, token, activeQ, questions]);

    // ── startTimer accepts an optional seconds override ──
    const startTimer = (overrideSeconds) => {
        const seconds = overrideSeconds
            ? overrideSeconds * 60
            : timeLimit * 60;
        setTimer(seconds);
        timerRef.current = setInterval(() => setTimer(t => {
            if (t <= 1) { clearInterval(timerRef.current); return 0; }
            return t - 1;
        }), 1000);
    };
    const stopTimer  = () => clearInterval(timerRef.current);
    useEffect(() => () => { stopTimer(); socketRef.current?.disconnect(); }, []);
    useEffect(() => { if (initialCode) setJoinCode(initialCode); }, [initialCode]);

    const loadQuestions = async (qIds) => {
        try {
            const results = await Promise.all(qIds.map(id => axios.get(`http://localhost:5000/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data).catch(() => null)));
            const valid = results.filter(Boolean);
            setQuestions(valid);
            const initCodes = {};
            valid.forEach(q => { initCodes[q.id] = DEFAULT_CODE.python; });
            setCodes(initCodes);
            return valid;
        } catch (e) { console.error(e); return []; }
    };

    // ── handleCreate: pass battle config to backend ──
    const handleCreate = async () => {
        try {
            const verifiedUsername = user.name && user.name !== "CodeMaster" ? user.name : lsUsername;

            // Lock in current config so arena can display it
            const config = { difficulty, problemCount, timeLimit, streakBooster };
            setActiveBattleConfig(config);

            const { data } = await axios.post(
                "http://localhost:5000/battles/create",
                {
                    userId: currentUserId,
                    username: verifiedUsername,
                    // ── Send config settings to the backend ──
                    difficulty,
                    problemCount,
                    timeLimit,        // in minutes
                    streakBooster,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setBattle(data.battle);
            setInviteCode(data.battle.inviteCode);
            setIsCreator(true);
            setPhase("waiting");
            connectSocket(data.battle._id);
        } catch (e) {
            alert("Failed to create battle: " + (e.response?.data?.message || e.message));
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        try {
            const verifiedUsername = user.name && user.name !== "CodeMaster" ? user.name : lsUsername;
            const { data } = await axios.post("http://localhost:5000/battles/join", { userId: currentUserId, username: verifiedUsername, inviteCode: joinCode.trim().toUpperCase() }, { headers: { Authorization: `Bearer ${token}` } });
            setBattle(data.battle);
            setIsCreator(false);

            // ── When joining, read battle config from the battle object if the server returns it ──
            if (data.battle?.difficulty)    setDifficulty(data.battle.difficulty);
            if (data.battle?.problemCount)  setProblemCount(data.battle.problemCount);
            if (data.battle?.timeLimit)     setTimeLimit(data.battle.timeLimit);
            if (data.battle?.streakBooster !== undefined) setStreakBooster(data.battle.streakBooster);
            setActiveBattleConfig({
                difficulty: data.battle?.difficulty || difficulty,
                problemCount: data.battle?.problemCount || problemCount,
                timeLimit: data.battle?.timeLimit || timeLimit,
                streakBooster: data.battle?.streakBooster ?? streakBooster,
            });

            if (data.battle?.players) {
                const creator = data.battle.players.find(p => normalizeId(p.userId) !== currentUserId);
                if (creator?.username) {
                    setOpponentJoined({ username: creator.username, avatar: creator.username.charAt(0).toUpperCase() });
                }
            }
            setPhase("waiting");
            connectSocket(data.battle._id);
        } catch (e) { alert("Failed to join battle: " + (e.response?.data?.message || e.message)); }
    };

    // Battle auto-starts when opponent joins

    // ── Forfeit ──
    const handleForfeitConfirm = () => {
        if (battle) {
            socketRef.current?.emit("forfeit_battle", { battleId: battle._id, userId: currentUserId });
        }
    };

    const handleSubmit = () => {
        if (!battle || submitting) return;
        const q = questions[activeQ];
        if (!q) return;
        setSubmitting(true); setSubmitResult(null);
        socketRef.current?.emit("submit_code", { battleId: battle._id, userId: currentUserId, questionId: q.id, source_code: codes[q.id] || DEFAULT_CODE[lang.monaco], language_id: lang.id });
    };

    const copyCode = () => { navigator.clipboard.writeText(inviteCode || battle?.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

    const myPlayer  = battle?.players?.find(p => normalizeId(p.userId) === currentUserId);
    const oppPlayer = battle?.players?.find(p => normalizeId(p.userId) !== currentUserId);
    const mySolved  = myPlayer?.solvedQuestions || [];
    const q         = questions[activeQ];
    const isSolved  = q && mySolved.includes(q.id);
    const timerDanger = timer <= 300;

    // ── Derive the active config to show in arena header ──
    const arenaConfig = activeBattleConfig || { difficulty, problemCount, timeLimit, streakBooster };

    /* ══════════════════════
       LOBBY PHASE
    ══════════════════════ */
    if (phase === "lobby") {
        return (
            <div className="flex h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>
                <Sidebar navigate={navigate} user={user}/>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header user={user}/>
                    <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5" style={{ scrollbarWidth:"none" }}>

                        {/* Top Cards — Create Arena + Join Lobby */}
                        <div className="grid grid-cols-2 gap-5">
                            {/* Create Arena */}
                            <motion.div whileHover={{ y:-3 }} transition={{ type:"spring", stiffness:300 }}
                                className="bg-white rounded-[24px] p-7 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden group"
                                onClick={handleCreate}>
                                <div className="absolute right-5 bottom-3 text-[100px] text-slate-50 font-black pointer-events-none select-none leading-none">⚔</div>
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <Swords className="w-6 h-6 text-indigo-600"/>
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Create Arena</h3>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4 max-w-xs">
                                    Host a private or public coding battle. Choose languages, difficulty, and invite rivals.
                                </p>
                                {/* ── Live config preview pill ── */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${DIFF_COLORS[difficulty]?.bg} ${DIFF_COLORS[difficulty]?.text} ${DIFF_COLORS[difficulty]?.border}`}>
                                        {difficulty}
                                    </span>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
                                        {problemCount} Problems
                                    </span>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-indigo-50 text-indigo-600 border-indigo-200">
                                        {timeLimit}m
                                    </span>
                                    {streakBooster && (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-orange-50 text-orange-600 border-orange-200 flex items-center gap-1">
                                            <Flame className="w-3 h-3"/> 2x
                                        </span>
                                    )}
                                </div>
                                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md shadow-indigo-200 transition-colors flex items-center gap-2">
                                    <Swords className="w-4 h-4"/> Host New Battle
                                </button>
                            </motion.div>

                            {/* Join Lobby */}
                            <motion.div whileHover={{ y:-3 }} transition={{ type:"spring", stiffness:300 }}
                                className="bg-white rounded-[24px] p-7 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
                                <div className="absolute right-6 bottom-4 opacity-5 pointer-events-none select-none">
                                    <Users style={{ width: 110, height: 110, color: "#7C3AED" }}/>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <Shield className="w-6 h-6 text-violet-600"/>
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Join Lobby</h3>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-5 max-w-xs">
                                    Jump into active matches. Test your speed against top coders in real-time sprints.
                                </p>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Enter invite code…"
                                        value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === "Enter" && handleJoin()}
                                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm uppercase tracking-wider rounded-xl px-4 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal transition-all"/>
                                    <button onClick={handleJoin}
                                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-5 rounded-xl shadow-md transition-colors">
                                        Join
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2 font-medium">— or —</p>
                                <button onClick={() => navigate("/student/practice")}
                                    className="mt-1 border border-violet-200 text-violet-600 font-bold text-sm px-6 py-2.5 rounded-2xl hover:bg-violet-50 transition-colors flex items-center gap-2">
                                    <Code2 className="w-4 h-4"/> Practice
                                </button>
                            </motion.div>
                        </div>

                        {/* Bottom Row — Battle Config + Match History + Top Combatants */}
                        <div className="grid grid-cols-[320px_1fr] gap-5">

                            {/* Battle Config */}
                            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                        <Settings className="w-4 h-4 text-indigo-600"/>
                                    </div>
                                    <h3 className="text-sm font-extrabold text-slate-800">Battle Config</h3>
                                    <span className="ml-auto text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                        Applied on Create
                                    </span>
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Difficulty</div>
                                    <div className="flex gap-2">
                                        {["Novice","Master","Elite"].map(d => (
                                            <button key={d} onClick={() => setDifficulty(d)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${difficulty === d
                                                    ? d === "Novice" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200"
                                                    : d === "Master" ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200"
                                                    : "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200"
                                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Problem Count */}
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Problem Count</div>
                                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
                                        <button onClick={() => setProblemCount(c => Math.max(1, c-1))}
                                            className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-indigo-300 transition-colors shadow-sm">
                                            <Minus className="w-3.5 h-3.5 text-slate-500"/>
                                        </button>
                                        <span className="flex-1 text-center text-base font-extrabold text-slate-800">{problemCount} Problems</span>
                                        <button onClick={() => setProblemCount(c => Math.min(10, c+1))}
                                            className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-indigo-300 transition-colors shadow-sm">
                                            <Plus className="w-3.5 h-3.5 text-slate-500"/>
                                        </button>
                                    </div>
                                </div>

                                {/* Time Limit Slider */}
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Time Limit (minutes)</div>
                                    <input type="range" min={5} max={60} step={5} value={timeLimit}
                                        onChange={e => setTimeLimit(+e.target.value)}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                        style={{ background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${((timeLimit-5)/55)*100}%, #e2e8f0 ${((timeLimit-5)/55)*100}%, #e2e8f0 100%)` }}/>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                                        <span>5m</span><span className="text-indigo-600">{timeLimit}m</span><span>60m</span>
                                    </div>
                                </div>

                                {/* Streak Booster */}
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Battle Streak Booster</div>
                                    <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-4 h-4 text-orange-500"/>
                                            <span className="text-sm font-extrabold text-orange-600">2x Multiplier</span>
                                        </div>
                                        <button onClick={() => setStreakBooster(b => !b)}
                                            className={`w-11 h-6 rounded-full border-2 transition-all relative ${streakBooster ? "bg-orange-500 border-orange-500" : "bg-slate-200 border-slate-200"}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${streakBooster ? "left-[22px]" : "left-0.5"}`}/>
                                        </button>
                                    </div>
                                </div>

                                {/* Config Summary */}
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 flex flex-col gap-2">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Current Config Summary</div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${difficulty === "Novice" ? "bg-emerald-500" : difficulty === "Master" ? "bg-amber-500" : "bg-rose-500"}`}/>
                                            <span className="text-xs font-bold text-slate-600">{difficulty}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Code2 className="w-3 h-3 text-indigo-500"/>
                                            <span className="text-xs font-bold text-slate-600">{problemCount} problems</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Timer className="w-3 h-3 text-indigo-500"/>
                                            <span className="text-xs font-bold text-slate-600">{timeLimit} minutes</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Flame className="w-3 h-3 text-orange-500"/>
                                            <span className="text-xs font-bold text-slate-600">Booster {streakBooster ? "ON" : "OFF"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right column: Match History + Top Combatants */}
                            <div className="flex flex-col gap-5">

                                {/* Match History */}
                                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <History className="w-4 h-4 text-indigo-600"/>
                                            <h3 className="text-sm font-extrabold text-slate-800">Match History</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {matchHistory.filter(m => m.result === "win").length}W –{" "}
                                                {matchHistory.filter(m => m.result === "loss").length}L
                                            </span>
                                            <button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors">
                                                View All <ChevronRight className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(matchHistory.length ? matchHistory : MOCK_MATCH_HISTORY).map((m, i) => {
                                            const isWin = m.result === "win";
                                            const diff = DIFF_COLORS[m.difficulty] || DIFF_COLORS.Novice;
                                            return (
                                                <motion.div key={m.id || i}
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                                    className={`rounded-2xl p-4 border transition-colors hover:shadow-sm cursor-pointer
                                                        ${isWin ? "bg-emerald-50 border-emerald-100 hover:border-emerald-200" : "bg-rose-50 border-rose-100 hover:border-rose-200"}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold shadow-sm
                                                                ${isWin ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-gradient-to-br from-rose-400 to-pink-500"}`}>
                                                                {m.opponentAvatar}
                                                            </div>
                                                            <span className="text-xs font-extrabold text-slate-700">vs {m.opponent}</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg
                                                            ${isWin ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                                                            {isWin
                                                                ? <><CheckCircle2 className="w-3 h-3"/> WIN</>
                                                                : <><XCircle className="w-3 h-3"/> LOSS</>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-[11px] font-bold text-slate-500">
                                                            Score: <span className="text-slate-800">{m.score}</span>
                                                        </div>
                                                        <div className="w-px h-3 bg-slate-200"/>
                                                        <div className="text-[11px] font-bold text-slate-500">
                                                            Opp: <span className="text-slate-800">{m.oppScore}</span>
                                                        </div>
                                                        <div className="w-px h-3 bg-slate-200"/>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${diff.bg} ${diff.text} ${diff.border}`}>
                                                            {m.difficulty || "Novice"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                            <Clock className="w-3 h-3"/> {m.duration}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                                                            <Zap className="w-3 h-3"/> +{m.xpGained} Points
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{m.date ? new Date(m.date).toLocaleString() : "-"}</div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Top Combatants */}
                                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-extrabold text-slate-800">Top Combatants</h3>
                                        <button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors">
                                            Full Rankings <ChevronRight className="w-3.5 h-3.5"/>
                                        </button>
                                    </div>
                                    <div className="w-full">
                                        <div className="grid grid-cols-[40px_1fr_90px_80px_50px] gap-x-4 px-3 pb-2 border-b border-slate-100">
                                            {["RANK","USERNAME","POINTS","WIN RATE","ACTION"].map(h => (
                                                <div key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</div>
                                            ))}
                                        </div>
                                        {(topCombatants.length ? topCombatants : MOCK_COMBATANTS).map((c, i) => (
                                            <motion.div key={c.rank} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.08 }}
                                                className="grid grid-cols-[40px_1fr_90px_80px_50px] gap-x-4 px-3 py-3.5 border-b border-slate-50 hover:bg-slate-50 rounded-xl transition-colors items-center">
                                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold
                                                    ${c.rank===1?"bg-amber-100 text-amber-600":c.rank===2?"bg-slate-100 text-slate-500":"bg-orange-50 text-orange-500"}`}>
                                                    {c.rank}
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
                                                        {c.avatar}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{c.name}</span>
                                                </div>
                                                <div className="text-sm font-extrabold text-slate-700">{c.points.toLocaleString()}</div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <ProgressBar pct={c.winRate} color="from-emerald-400 to-teal-500"/>
                                                        <span className="text-xs font-bold text-emerald-600 shrink-0">{c.winRate}%</span>
                                                    </div>
                                                </div>
                                                <button className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center hover:bg-indigo-100 transition-colors">
                                                    <Swords className="w-3.5 h-3.5 text-indigo-600"/>
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ══════════════════════
       WAITING PHASE
    ══════════════════════ */
    if (phase === "waiting") {
        const myDisplayName = user.name && user.name !== "CodeMaster" ? user.name : lsUsername;
        const myAvatar  = myDisplayName.charAt(0).toUpperCase();
        const oppAvatar = opponentJoined?.avatar || null;
        const oppName   = opponentJoined?.username || null;
        const bothReady = !!opponentJoined;
        const cfg = activeBattleConfig || { difficulty, problemCount, timeLimit, streakBooster };

        return (
            <div className="flex h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>
                <Sidebar navigate={navigate}/>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header user={user}/>
                    <div className="flex-1 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                            className="max-w-lg w-full bg-white text-center p-10 rounded-[40px] shadow-xl border border-slate-100">

                            {/* Battle config badge row */}
                            <div className="flex justify-center flex-wrap gap-2 mb-7">
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${DIFF_COLORS[cfg.difficulty]?.bg} ${DIFF_COLORS[cfg.difficulty]?.text} ${DIFF_COLORS[cfg.difficulty]?.border}`}>
                                    {cfg.difficulty}
                                </span>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">
                                    {cfg.problemCount} Problems
                                </span>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-indigo-50 text-indigo-600 border-indigo-200 flex items-center gap-1">
                                    <Timer className="w-3 h-3"/> {cfg.timeLimit}m
                                </span>
                                {cfg.streakBooster && (
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-orange-50 text-orange-600 border-orange-200 flex items-center gap-1">
                                        <Flame className="w-3 h-3"/> 2x Booster
                                    </span>
                                )}
                            </div>

                            {/* Players row */}
                            <div className="flex items-center justify-center gap-6 mb-8">
                                {/* Me */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                                        {myAvatar}
                                    </div>
                                    <span className="text-xs font-extrabold text-slate-700">{myDisplayName}</span>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Ready</span>
                                </div>

                                {/* VS divider */}
                                <div className="flex flex-col items-center gap-1">
                                    {bothReady ? (
                                        <div className="text-2xl">⚔️</div>
                                    ) : (
                                        <div className="relative w-10 h-10">
                                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-200 animate-spin" style={{ animationDuration:"3s" }}/>
                                            <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" style={{ animationDuration:"1s" }}/>
                                        </div>
                                    )}
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest mt-1">VS</span>
                                </div>

                                {/* Opponent slot */}
                                <div className="flex flex-col items-center gap-2">
                                    <AnimatePresence mode="wait">
                                        {oppAvatar ? (
                                            <motion.div key="opp-filled"
                                                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                                                {oppAvatar}
                                            </motion.div>
                                        ) : (
                                            <motion.div key="opp-empty"
                                                className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                                                <Users className="w-6 h-6 text-slate-300"/>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <span className="text-xs font-extrabold text-slate-700">
                                        {oppName || "Waiting…"}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${oppAvatar ? "text-emerald-500" : "text-slate-400"}`}>
                                        {oppAvatar ? "Ready" : "Not joined"}
                                    </span>
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="font-extrabold text-2xl text-slate-900 mb-1">
                                {bothReady ? "Opponent joined! Starting battle…" : "Waiting for opponent…"}
                            </h2>
                            <p className="font-medium text-slate-500 mb-7 text-sm">
                                {isCreator ? "Share the invite code below with your friend" : "You've joined the arena — standby…"}
                            </p>

                            {/* Invite code — only show for creator */}
                            {isCreator && (
                                <div className="bg-slate-50 px-8 py-6 rounded-[24px] mb-6 border border-slate-200">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Invite Code</div>
                                    <div className="font-black text-4xl tracking-[0.25em] text-indigo-600">{inviteCode || battle?.inviteCode}</div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-center gap-3">
                                {isCreator ? (
                                    <>
                                        <button onClick={copyCode}
                                            className={`px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm ${copied ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                            {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                                            {copied ? "Copied!" : "Copy Code"}
                                        </button>
                                        <button onClick={() => { socketRef.current?.disconnect(); navigate("/studentdashboard"); }}
                                            className="px-6 py-3.5 rounded-2xl font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-all text-sm">
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => { socketRef.current?.disconnect(); navigate("/studentdashboard"); }}
                                        className="px-8 py-3.5 rounded-2xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all text-sm">
                                        Leave Lobby
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    /* ══════════════════════
       ARENA PHASE
    ══════════════════════ */
    if (phase === "arena" && questions.length > 0) {
        const myCount  = mySolved.length;
        const oppCount = opponentSolved.length;
        const isAhead  = myCount >= oppCount;
        const cfg = arenaConfig;

        return (
            <div className="flex h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>
                {/* Forfeit Confirmation Modal */}
                <AnimatePresence>
                    {showForfeitModal && (
                        <ForfeitModal
                            onConfirm={handleForfeitConfirm}
                            onCancel={() => setShowForfeitModal(false)}
                        />
                    )}
                </AnimatePresence>

                <Sidebar navigate={navigate}/>
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Arena Header */}
                    <header className="h-[72px] bg-white border-b border-slate-100 px-6 flex items-center gap-4 shrink-0 z-10">
                        {/* Back arrow → dashboard */}
                        <button onClick={() => setShowForfeitModal(true)}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all"
                            title="Leave battle">
                            <ChevronLeft className="w-5 h-5"/>
                        </button>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Code Battle</div>
                            <div className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                                <Swords className="w-4 h-4 text-indigo-500"/> Arena Match
                            </div>
                        </div>

                        {/* ── Config badges in arena header ── */}
                        <div className="flex items-center gap-1.5 ml-1">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${DIFF_COLORS[cfg.difficulty]?.bg} ${DIFF_COLORS[cfg.difficulty]?.text} ${DIFF_COLORS[cfg.difficulty]?.border}`}>
                                {cfg.difficulty}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-slate-50 text-slate-500 border-slate-200">
                                {questions.length} Problems
                            </span>
                            {cfg.streakBooster && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-orange-50 text-orange-600 border-orange-200 flex items-center gap-1">
                                    <Flame className="w-3 h-3"/> 2x
                                </span>
                            )}
                        </div>

                        <div className="flex-1 flex justify-center">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border ${isAhead ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"}`}>
                                {isAhead ? <><Flame className="w-4 h-4"/> YOU'RE AHEAD 🔥</> : <><Zap className="w-4 h-4"/> OPPONENT AHEAD ⚡</>}
                            </div>
                        </div>
                        {oppPlayer && (
                            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-[11px] font-extrabold">
                                    {oppPlayer.username?.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-800">{oppPlayer.username}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">opponent</div>
                                </div>
                                <div className="flex gap-1.5 border-l border-slate-300 pl-3">
                                    {questions.map(q2 => (
                                        <div key={q2.id}
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black border transition-all ${opponentSolved.includes(q2.id) ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-white text-slate-300 border-slate-200"}`}>
                                            {opponentSolved.includes(q2.id) ? "✓" : "?"}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg shadow-sm border transition-all ${timerDanger ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse" : "bg-indigo-50 border-indigo-200 text-indigo-600"}`}>
                            <Timer className="w-5 h-5"/>{formatTime(timer)}
                        </div>
                        {/* ── Leave Battle button ── */}
                        <button
                            onClick={() => setShowForfeitModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all shadow-sm"
                            title="Leave battle (forfeit)">
                            <Flag className="w-4 h-4"/> Leave
                        </button>
                    </header>

                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                        className="flex-1 flex gap-4 p-4 overflow-hidden">

                        {/* Problem panel */}
                        <div className="w-[420px] flex flex-col bg-white rounded-[24px] overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                            <div className="flex shrink-0 bg-slate-50 border-b border-slate-100">
                                {questions.map((q2, i) => (
                                    <button key={q2.id} onClick={() => setActiveQ(i)}
                                        className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-all ${activeQ===i ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-400"}`}>
                                        {mySolved.includes(q2.id) ? <span className="text-emerald-500">✓ Solved</span> : `Problem ${i+1}`}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 text-slate-700" style={{ scrollbarWidth:"none" }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${q?.difficulty==="Easy"?"bg-emerald-50 text-emerald-600 border-emerald-200":q?.difficulty==="Medium"?"bg-amber-50 text-amber-600 border-amber-200":"bg-rose-50 text-rose-600 border-rose-200"}`}>
                                        {q?.difficulty||"Easy"}
                                    </span>
                                    {q?.tags?.slice(0,2).map((t,idx) => <span key={idx} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">{t}</span>)}
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-900 mb-5">{q?.title}</h2>
                                <p className="text-[15px] leading-relaxed mb-6 whitespace-pre-wrap">{q?.description}</p>
                                {q?.input_format && <div className="mb-4"><div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Input Format</div><div className="p-3 rounded-xl text-sm bg-slate-50 border border-slate-200 font-mono">{q.input_format}</div></div>}
                                {q?.output_format && <div className="mb-4"><div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Output Format</div><div className="p-3 rounded-xl text-sm bg-slate-50 border border-slate-200 font-mono">{q.output_format}</div></div>}
                                {q?.examples?.map((ex,i) => (
                                    <div key={i} className="rounded-2xl overflow-hidden mt-4 border border-slate-200">
                                        <div className="px-4 py-2 text-xs font-bold uppercase bg-slate-50 border-b border-slate-200 text-slate-400">Example {i+1}</div>
                                        <div className="p-4 flex flex-col gap-3">
                                            <div><div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-indigo-600">Input</div><div className="text-sm p-3 rounded-xl bg-slate-50 text-slate-800 font-mono">{ex.input}</div></div>
                                            <div><div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-emerald-600">Output</div><div className="text-sm p-3 rounded-xl font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono">{ex.output}</div></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Editor panel */}
                        <div className="flex-1 flex flex-col bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5 mr-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-400"/>
                                        <div className="w-3 h-3 rounded-full bg-amber-400"/>
                                        <div className="w-3 h-3 rounded-full bg-emerald-400"/>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                                        <Code2 className="w-4 h-4 text-slate-400"/>
                                        <select value={lang.id}
                                            onChange={e => { const l = LANGS.find(l => l.id===+e.target.value); setLang(l); if (q && !codes[q?.id]) setCodes(c => ({ ...c, [q.id]: DEFAULT_CODE[l.monaco] })); }}
                                            className="bg-transparent border-none text-sm font-bold outline-none cursor-pointer text-slate-700">
                                            {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* ── Progress indicator: X / total solved ── */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600">
                                        <CheckCircle2 className="w-3.5 h-3.5"/>
                                        {mySolved.length}/{questions.length} solved
                                    </div>
                                    {isSolved && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
                                            <Check className="w-4 h-4"/> Solved
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <Editor height="100%" theme="vs-light" language={lang.monaco}
                                    value={q ? (codes[q?.id] ?? DEFAULT_CODE[lang.monaco]) : ""}
                                    onChange={val => { if (q) setCodes(c => ({ ...c, [q.id]: val })); }}
                                    options={{ fontSize:14, minimap:{enabled:false}, scrollBeyondLastLine:false, padding:{top:16}, lineHeight:1.7, cursorBlinking:"smooth" }}/>
                            </div>
                            <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-slate-50 border-t border-slate-100">
                                <div className="flex-1">
                                    <AnimatePresence>
                                        {submitResult && (
                                            <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold w-max border shadow-sm ${submitResult.error||!submitResult.allPassed ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                                                {submitResult.error||!submitResult.allPassed
                                                    ? <><AlertCircle className="w-4 h-4"/> {submitResult.error?`Error: ${submitResult.error}`:`❌ ${submitResult.passed}/${submitResult.total} passed`}</>
                                                    : <><Check className="w-4 h-4"/> All {submitResult.total} test cases passed!</>}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm transition-all">
                                        <Terminal className="w-4 h-4"/> Console
                                    </button>
                                    <button onClick={handleSubmit} disabled={submitting||isSolved}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 px-7 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold disabled:opacity-50 transition-colors">
                                        {submitting ? "Running…" : isSolved ? "✓ Completed" : <><Play className="w-4 h-4"/> Submit</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    /* ══════════════════════
       RESULTS PHASE
    ══════════════════════ */
    if (phase === "results") {
        const isWin = winnerInfo?.isWinner;
        const cfg = arenaConfig;
        // Points awarded with streak booster applied
        const basePoints = isWin ? 200 : 50;
        const awardedPoints = cfg.streakBooster ? basePoints * 2 : basePoints;

        return (
            <div className="flex h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>
                {isWin && <Confetti/>}
                <Sidebar navigate={navigate}/>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header user={user}/>
                    <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, ease:"easeOut" }}
                            className="max-w-2xl w-full bg-white rounded-[36px] border border-slate-100 shadow-xl overflow-hidden">
                            <div className={`px-10 py-8 border-b border-slate-100 flex items-center justify-between ${isWin ? "bg-gradient-to-r from-indigo-600 to-violet-600" : "bg-slate-800"}`}>
                                <div className="text-left">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5"
                                        style={{ color: isWin ? "rgba(199,210,254,0.85)" : "rgba(148,163,184,0.85)" }}>
                                        Battle Complete
                                    </div>
                                    <h1 className="text-3xl font-extrabold text-white leading-tight">
                                        {isWin ? "Victory" : "Defeated"}
                                    </h1>
                                    <p className="text-sm font-medium mt-1.5"
                                        style={{ color: isWin ? "rgba(199,210,254,0.75)" : "rgba(148,163,184,0.75)" }}>
                                        {isWin
                                            ? "You outpaced your opponent and claimed the win."
                                            : "Your opponent was faster this time. Keep practicing."}
                                    </p>
                                    {/* ── Show the config used ── */}
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/15 text-white/80 border border-white/20">
                                            {cfg.difficulty}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/15 text-white/80 border border-white/20">
                                            {questions.length} Problems
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/15 text-white/80 border border-white/20">
                                            {cfg.timeLimit}m Limit
                                        </span>
                                        {cfg.streakBooster && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-orange-400/40 text-orange-100 border border-orange-300/30 flex items-center gap-1">
                                                <Flame className="w-2.5 h-2.5"/> 2x Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border ${isWin ? "bg-white/10 border-white/20 text-white" : "bg-white/10 border-white/10 text-slate-300"}`}>
                                    <Zap className="w-4 h-4"/>
                                    +{awardedPoints} Points
                                    {cfg.streakBooster && <span className="text-[10px] ml-0.5 opacity-75">(2x)</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-8 py-8 border-b border-slate-100">
                                {battle?.players?.map(p => {
                                    const pIsWinner = normalizeId(p.userId) === winnerInfo?.winnerId;
                                    return (
                                        <div key={p.userId}
                                            className={`p-6 rounded-[28px] relative overflow-hidden border ${pIsWinner ? "bg-indigo-50/50 border-indigo-100 shadow-md" : "bg-slate-50 border-slate-200"}`}>
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                                                {normalizeId(p.userId)===currentUserId?"You":"Opponent"}
                                            </div>
                                            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 shadow-sm flex items-center justify-center text-white text-xl font-extrabold bg-gradient-to-br ${pIsWinner ? "from-indigo-500 to-violet-600" : "from-slate-400 to-slate-500"}`}>
                                                {p.username?.charAt(0)}
                                            </div>
                                            <div className="font-extrabold text-slate-900 text-xl mb-4">{p.username}</div>
                                            {pIsWinner && (
                                                <div className="mb-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-600">
                                                        Winner
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="px-3 py-1.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 shadow-sm">
                                                    {p.solvedQuestions?.length||0}/{questions.length} Solved
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black bg-indigo-100 text-indigo-700 shadow-sm">
                                                    {p.points||0} <Diamond className="w-4 h-4 fill-current"/>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="px-8 py-6 flex justify-end gap-3 bg-slate-50/60">
                                <button onClick={() => navigate("/studentdashboard")}
                                    className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
                                    Dashboard
                                </button>
                                <button onClick={() => { setPhase("lobby"); setBattle(null); setQuestions([]); setOpponentSolved([]); setTimer(timeLimit * 60); setCodes({}); setActiveBattleConfig(null); }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm transition-colors">
                                    <Swords className="w-4 h-4"/> Play Again
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Loading ── */
    return (
        <div className="flex h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>
            <Sidebar navigate={navigate}/>
            <div className="flex-1 flex items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200"/>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin" style={{ animationDuration:"1s" }}/>
                </div>
            </div>
        </div>
    );
}