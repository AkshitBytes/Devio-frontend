import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:5000/auth/signin", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user?._id || data.user?.id || "");
      localStorage.setItem("username", data.user?.name || "Coder");
      const role = data.user?.role;
      navigate(role === "teacher" ? "/teacherdashboard" : "/studentdashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#F4F7FE", fontFamily: "'DM Sans','Nunito',sans-serif" }}
    >
      <div className="w-full max-w-[960px] min-h-[580px] bg-white rounded-[28px] border border-slate-100 overflow-hidden flex shadow-xl shadow-indigo-100/40">

        {/* ── LEFT: form ── */}
        <div className="flex-1 flex flex-col justify-center px-14 py-14 border-r border-slate-100">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]">
                <path d="M7 5L3 10L7 15M13 5L17 10L13 15" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[20px] font-black text-indigo-950 tracking-tight">devio</span>
          </div>

          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight mb-1">Sign in to Devio</h1>
          <p className="text-sm text-slate-400 font-medium mb-8">Enter your credentials to continue.</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-semibold text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 7l10 7 10-7"/>
                </svg>
                <input
                  type="email" name="email" required placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" required placeholder="••••••••••"
                  value={form.password} onChange={handleChange}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options row */}
            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-2 text-sm text-slate-500 font-medium cursor-pointer">
                <input type="checkbox" className="accent-indigo-600 w-3.5 h-3.5" />
                Remember me
              </label>
              <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Forgot Password?</a>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-extrabold tracking-widest uppercase text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] shadow-lg shadow-indigo-200"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100"/>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-slate-100"/>
          </div>

          {/* OAuth */}
          <div className="flex gap-3">
            {["Google", "GitHub"].map((p) => (
              <button key={p}
                className="flex-1 h-11 flex items-center justify-center gap-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-indigo-300 hover:bg-slate-50 transition-all">
                {p}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-400 font-medium text-center mt-5">
            No account? <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-800">Create one</Link>
          </p>
        </div>

        {/* ── RIGHT: info panel ── */}
        <div
          className="hidden lg:flex flex-col justify-center px-11 py-14 relative overflow-hidden"
          style={{ flex: "0 0 44%", background: "linear-gradient(145deg,#6366f1 0%,#7c3aed 100%)" }}
        >
        

          <h2 className="relative z-10 text-[24px] font-extrabold text-white tracking-tight mb-2">
            Level up your coding journey.
          </h2>
          <p className="relative z-10 text-sm text-white/70 font-medium leading-relaxed mb-8 max-w-[280px]">
            A focused platform for practice, live battles, and classroom performance.
          </p>

          {[
            { icon: "⚡", title: "Structured Practice & XP", sub: "Curated problem sets with difficulty tiers and XP tracking." },
            { icon: "⚔️", title: "Live Coding Battles", sub: "Real-time head-to-head challenges with live leaderboards." },
            { icon: "📊", title: "Teacher Dashboards", sub: "Full classroom controls, analytics, and assignment tools." },
          ].map((f) => (
            <div key={f.title}
              className="relative z-10 flex items-start gap-3.5 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 mb-3 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-base">{f.icon}</div>
              <div>
                <div className="text-[13px] font-bold text-white mb-0.5">{f.title}</div>
                <div className="text-[12px] text-white/60 font-medium leading-relaxed">{f.sub}</div>
              </div>
            </div>
          ))}

          <div className="relative z-10 flex gap-6 mt-6 pt-5 border-t border-white/15">
            {[["10K+","Students"],["500+","Problems"],["95%","Pass Rate"]].map(([v,l]) => (
              <div key={l} className="flex flex-col">
                <span className="text-[22px] font-black text-white leading-none">{v}</span>
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mt-1">{l}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}