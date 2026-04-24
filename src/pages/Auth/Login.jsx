import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-center p-14 border-r border-slate-800">
        <h1 className="text-4xl font-extrabold mb-3">Welcome to Devio</h1>
        <p className="text-slate-400 mb-10 max-w-md">A focused coding platform for practice, battles and classroom performance.</p>
        <div className="space-y-3">
          <div className="panel-soft p-4">Structured practice sets and XP tracking.</div>
          <div className="panel-soft p-4">Live battle workflows with real-time updates.</div>
          <div className="panel-soft p-4">Teacher dashboards and classroom controls.</div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="panel w-full max-w-md p-7">
          <h2 className="text-2xl font-bold mb-2">Sign in</h2>
          <p className="text-slate-400 text-sm mb-6">Use your account credentials.</p>
          {error && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="text-sm block">
              <span className="mb-1 block text-slate-300">Email</span>
              <div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input type="email" name="email" required value={form.email} onChange={handleChange} className="input-dark pl-10" /></div>
            </label>
            <label className="text-sm block">
              <span className="mb-1 block text-slate-300">Password</span>
              <div className="relative"><Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input type="password" name="password" required value={form.password} onChange={handleChange} className="input-dark pl-10" /></div>
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Signing in..." : "Sign in"}</button>
          </form>
          <p className="text-sm text-slate-400 mt-5">No account? <Link to="/signup" className="text-indigo-300 font-semibold">Create one</Link></p>
        </div>
      </section>
    </div>
  );
}