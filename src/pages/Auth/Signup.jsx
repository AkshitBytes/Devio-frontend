import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/auth/signup", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#F4F7FE", fontFamily: "'DM Sans','Nunito',sans-serif" }}
    >
      <div className="w-full max-w-[960px] bg-white rounded-[28px] border border-slate-100 overflow-hidden flex shadow-xl shadow-indigo-100/40">

        {/* ── LEFT: form ── */}
        <div className="flex-1 flex flex-col justify-center px-14 py-12 border-r border-slate-100">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]">
                <path d="M7 5L3 10L7 15M13 5L17 10L13 15" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[20px] font-black text-indigo-950 tracking-tight">devio</span>
          </div>

          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight mb-1">Create your account</h1>
          <p className="text-sm text-slate-400 font-medium mb-7">Join Devio and start your coding journey.</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-semibold text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                <input
                  type="text" name="name" required placeholder="Jane Smith"
                  value={form.name} onChange={handleChange}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

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

            {/* Role toggle */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">I am a</label>
              <div className="flex gap-2">
                {["student", "teacher"].map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className={`flex-1 h-11 rounded-xl text-sm font-bold capitalize border transition-all ${
                      form.role === r
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {r === "student" ? "🎓 Student" : "📋 Teacher"}
                  </button>
                ))}
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
                  type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                  tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirm Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword" required placeholder="••••••••••"
                  value={form.confirmPassword} onChange={handleChange}
                  className={`w-full h-11 bg-slate-50 border rounded-xl pl-10 pr-11 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:ring-2 transition-all ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                      : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                <button
                  type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                  tabIndex={-1} aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {/* Match indicator */}
                {form.confirmPassword && (
                  <div className={`absolute right-11 top-1/2 -translate-y-1/2 text-xs font-bold ${
                    form.password === form.confirmPassword ? "text-emerald-500" : "text-rose-400"
                  }`}>
                    {form.password === form.confirmPassword ? "✓" : "✗"}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-extrabold tracking-widest uppercase text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] shadow-lg shadow-indigo-200 mt-1"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-slate-400 font-medium text-center mt-5">
            Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800">Sign in</Link>
          </p>
        </div>

        {/* ── RIGHT: info panel ── */}
        <div
          className="hidden lg:flex flex-col justify-center px-11 py-14 relative overflow-hidden"
          style={{ flex: "0 0 44%", background: "linear-gradient(145deg,#6366f1 0%,#7c3aed 100%)" }}
        >
          <div className="absolute w-72 h-72 rounded-full bg-white/5 -top-24 -right-20 pointer-events-none"/>
          <div className="absolute w-48 h-48 rounded-full bg-white/5 -bottom-10 -left-14 pointer-events-none"/>
          <div className="absolute w-24 h-24 rounded-full bg-white/8 top-[55%] right-8 pointer-events-none"/>

          <h2 className="relative z-10 text-[24px] font-extrabold text-white tracking-tight mb-2">
            Join thousands of coders.
          </h2>
          <p className="relative z-10 text-sm text-white/70 font-medium leading-relaxed mb-8 max-w-[280px]">
            Practice smarter, battle harder, and climb the leaderboard from day one.
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