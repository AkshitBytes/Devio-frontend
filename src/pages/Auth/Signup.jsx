import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, User as UserIcon, BookOpen, Users } from "lucide-react";

const ROLES = [
  { value: "student", icon: BookOpen, name: "Student", desc: "Solve & Battle", color: "#A855F7" },
  { value: "teacher", icon: Users, name: "Teacher", desc: "Lead Classes", color: "#10B981" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/auth/signup", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-center p-14 border-r border-slate-800">
        <h1 className="text-4xl font-extrabold mb-3">Create your Devio account</h1>
        <p className="text-slate-400 max-w-md mb-8">Pick your role and start with practice, live battles, and class tracking.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="panel w-full max-w-md p-7">
          <h2 className="text-2xl font-bold mb-2">Sign up</h2>
          <p className="text-sm text-slate-400 mb-5">Create a new account.</p>
          {error && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <div className="flex gap-3 mb-5">
            {ROLES.map((r) => (
              <button
                key={r.value} type="button"
                onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold ${form.role === r.value ? "border-indigo-400 bg-indigo-500/20 text-indigo-200" : "border-slate-700 bg-slate-900/40 text-slate-400"}`}
              >
                <r.icon className="w-4 h-4 mx-auto mb-1" />
                {r.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="text-sm block"><span className="mb-1 block text-slate-300">Full name</span><div className="relative"><UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input type="text" name="name" required value={form.name} onChange={handleChange} className="input-dark pl-10" /></div></label>
            <label className="text-sm block"><span className="mb-1 block text-slate-300">Email</span><div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input type="email" name="email" required value={form.email} onChange={handleChange} className="input-dark pl-10" /></div></label>
            <label className="text-sm block"><span className="mb-1 block text-slate-300">Password</span><div className="relative"><Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input type="password" name="password" required minLength={8} value={form.password} onChange={handleChange} className="input-dark pl-10" /></div></label>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Creating account..." : "Create account"}</button>
          </form>

          <p className="text-sm text-slate-400 mt-5">Already have an account? <Link to="/login" className="text-indigo-300 font-semibold">Sign in</Link></p>
        </div>
      </section>
    </div>
  );
}