import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Play, Terminal, CheckCircle, Code2,
  AlertCircle, Diamond, Check, XCircle, Search,
  ChevronDown, BookOpen, List
} from "lucide-react";

const LANGUAGES = [
  { id: "javascript", label: "JS",   name: "JavaScript", ext: ".js",   langId: 63 },
  { id: "python",     label: "PY",   name: "Python",     ext: ".py",   langId: 71 },
  { id: "cpp",        label: "C++",  name: "C++",        ext: ".cpp",  langId: 54 },
  { id: "java",       label: "Java", name: "Java",       ext: ".java", langId: 62 },
];

const STARTER = {
  javascript: `// Write your JavaScript here\n`,
  python:     `# Write your Python here\n`,
  cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your code here\n  return 0;\n}`,
  java:       `public class Main {\n  public static void main(String[] args) {\n    // Write your code here\n  }\n}`,
};

const API_BASE = "http://localhost:5000/questions";

const diffBadge = {
  Easy:   "bg-emerald-50 text-emerald-600 border-emerald-200",
  Medium: "bg-amber-50 text-amber-600 border-amber-200",
  Hard:   "bg-rose-50 text-rose-600 border-rose-200",
};

const diffDot = {
  Easy:   "bg-emerald-400",
  Medium: "bg-amber-400",
  Hard:   "bg-rose-400",
};

export default function PracticeSolver() {
  const navigate = useNavigate();

  const [questions, setQuestions]             = useState([]);
  const [selected, setSelected]               = useState(null);
  const [questionDetails, setQuestionDetails] = useState(null);
  const [lang, setLang]                       = useState(LANGUAGES[1]);
  const [code, setCode]                       = useState(STARTER.python);
  const [output, setOutput]                   = useState([]);
  const [running, setRunning]                 = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [ran, setRan]                         = useState(false);
  const [submitResult, setSubmitResult]       = useState(null);
  const [problemsOpen, setProblemsOpen]       = useState(false);
  const [problemSearch, setProblemSearch]     = useState("");
  const [activeTab, setActiveTab]             = useState("description");
  const [pointsToast, setPointsToast]         = useState(null);

  const outputRef   = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProblemsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
        setQuestions(Array.isArray(res.data) ? res.data : []);
      } catch {}
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setQuestionDetails(null);
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/${selected.id}`, { headers: { Authorization: `Bearer ${token}` } });
        setQuestionDetails(res.data);
      } catch {}
    };
    fetchDetails();
  }, [selected]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qid = urlParams.get("id");
    if (qid && questions.length > 0) {
      const q = questions.find(qu => qu.id === qid || qu._id === qid);
      if (q) setSelected(q);
    }
  }, [questions]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const handleLangChange = (l) => {
    setLang(l);
    setCode(STARTER[l.id]);
    setOutput([]);
    setRan(false);
    setSubmitResult(null);
  };

  const selectQuestion = (q) => {
    setSelected(q);
    setOutput([]);
    setRan(false);
    setSubmitResult(null);
    setProblemsOpen(false);
    setProblemSearch("");
    setActiveTab("description");
  };

  const ts = () => new Date().toLocaleTimeString();

  const handleRun = async () => {
    if (!selected) return;
    try {
      setRunning(true); setOutput([]); setSubmitResult(null);
      const token = localStorage.getItem("token");
      const preamble = [
        { text: `> devio run · ${lang.name} · ${ts()}`, type: "info" },
        { text: `> Compiling & Executing...`, type: "prompt" },
        { text: "", type: "prompt" },
      ];
      setOutput(preamble);
      const res = await axios.post(
        `${API_BASE}/${selected.id}/run`,
        { source_code: code, language_id: lang.langId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = res.data;
      let lines = result.output
        ? result.output.split("\n").map(line => ({ text: line, type: "normal" }))
        : [{ text: "(no output)", type: "normal" }];
      const hasError = result.status && result.status.id >= 6;
      const postamble = [
        { text: "", type: "prompt" },
        {
          text: hasError
            ? `> Execution failed (${result.status.description})`
            : "> Execution matched format",
          type: hasError ? "error" : "success",
        },
      ];
      setOutput([...preamble, ...lines, ...postamble]);
      setRan(true);
    } catch {
      setOutput(prev => [...prev, { text: "> Execution failed.", type: "error" }]);
    } finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      setSubmitting(true); setOutput([]); setSubmitResult(null);
      const token = localStorage.getItem("token");
      const preamble = [
        { text: `> devio submit · ${ts()}`, type: "info" },
        { text: `> Running hidden test cases...`, type: "prompt" },
        { text: "", type: "prompt" },
      ];
      setOutput(preamble);
      const res = await axios.post(
        `${API_BASE}/${selected.id}/submit`,
        { source_code: code, language_id: lang.langId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { passed, total, allPassed, details } = res.data;
      let lines = [];
      details.forEach((d, i) => {
        lines.push({ text: `Test ${i + 1}: ${d.passed ? "✅ Passed" : "❌ Failed"}`, type: d.passed ? "success" : "error" });
        if (!d.passed) {
          lines.push({ text: `   Expected: ${d.expected}`, type: "error" });
          lines.push({ text: `   Got:      ${d.got}`,      type: "error" });
        }
      });
      const postamble = [
        { text: "", type: "prompt" },
        {
          text: allPassed
            ? `> 🎉 All ${total} test cases passed!`
            : `> ⚠️  Passed ${passed} / ${total} test cases.`,
          type: allPassed ? "success" : "error",
        },
      ];
      setOutput([...preamble, ...lines, ...postamble]);
      setSubmitResult({ passed, total, allPassed });
      if (allPassed) {
        const awarded = Number(res.data?.awardedPoints || 0);
        if (awarded > 0) {
          setPointsToast({ points: awarded, at: Date.now() });
          setTimeout(() => setPointsToast(null), 2200);
        }
        setQuestions((prev) =>
          prev.map((q) =>
            (q.id === selected.id || q._id === selected._id) ? { ...q, isSolved: true } : q
          )
        );
        setSelected((prev) => (prev ? { ...prev, isSolved: true } : prev));
        setQuestionDetails((prev) => (prev ? { ...prev, isSolved: true } : prev));

        // Refresh global user/dashboard state and notify other components so points and ranks
        // update immediately across the app (leaderboard, dashboard, headers, etc.).
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const r2 = await axios.get("http://localhost:5000/dashboard/student", { headers: { Authorization: `Bearer ${token}` } });
            // Broadcast full dashboard payload so listeners can update without individually refetching
            window.dispatchEvent(new CustomEvent("devio:userStatsUpdated", { detail: r2.data }));
          }
        } catch (e) {
          // ignore refresh errors silently
        }
      }
      setRan(true);
    } catch {
      setOutput(prev => [...prev, { text: "> Submission failed.", type: "error" }]);
    } finally { setSubmitting(false); }
  };

  const filteredQuestions = questions.filter(q =>
    !problemSearch || q.title.toLowerCase().includes(problemSearch.toLowerCase())
  );

  const currentIndex = selected
    ? questions.findIndex(q => q.id === selected.id || q._id === selected._id)
    : -1;

  const goNext = () => { if (currentIndex < questions.length - 1) selectQuestion(questions[currentIndex + 1]); };
  const goPrev = () => { if (currentIndex > 0) selectQuestion(questions[currentIndex - 1]); };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>
      <AnimatePresence>
        {pointsToast && (
          <motion.div
            initial={{ opacity: 0, x: 30, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 30, y: -10 }}
            className="fixed right-6 top-20 z-[100] bg-white border border-emerald-200 rounded-2xl px-4 py-3 shadow-xl"
          >
            <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm">
              <CheckCircle className="w-4 h-4" />
              +{pointsToast.points} Points
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Nav Bar ── */}
      <header className="h-[56px] bg-white border-b border-slate-100 px-5 flex items-center gap-3 shrink-0 z-20 shadow-sm">

        <button
          onClick={() => navigate("/student/practice")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all font-bold text-sm shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Practice</span>
        </button>

        <div className="w-px h-6 bg-slate-100 shrink-0" />

        {/* Problems dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setProblemsOpen(o => !o)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all ${
              problemsOpen
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <List className="w-4 h-4" />
            Problems
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${problemsOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {problemsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="absolute left-0 top-[calc(100%+8px)] w-[380px] bg-white rounded-[20px] border border-slate-200 shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={problemSearch}
                      onChange={e => setProblemSearch(e.target.value)}
                      placeholder="Search problems…"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
                  {filteredQuestions.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm font-medium">No problems found.</div>
                  ) : (
                    filteredQuestions.map((q, i) => (
                      <button
                        key={q.id}
                        onClick={() => selectQuestion(q)}
                        className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                          selected?.id === q.id ? "bg-indigo-50" : ""
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-400 w-6 shrink-0 text-right">{i + 1}.</span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${diffDot[q.difficulty] || "bg-emerald-400"}`} />
                        <span className="flex-1 text-sm font-bold text-slate-700 truncate">{q.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${diffBadge[q.difficulty] || diffBadge.Easy}`}>
                          {q.difficulty || "Easy"}
                        </span>
                        {(selected?.id === q.id || selected?._id === q._id) && (
                          <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400">
                  {filteredQuestions.length} problem{filteredQuestions.length !== 1 ? "s" : ""}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={goPrev}
            disabled={currentIndex <= 0}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 transition-all"
            title="Previous problem"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex >= questions.length - 1 || currentIndex === -1}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 transition-all"
            title="Next problem"
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>

        {/* Active problem pill */}
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${diffDot[selected.difficulty] || "bg-emerald-400"}`} />
            <span className="text-sm font-extrabold text-slate-700 truncate max-w-[260px]">{selected.title}</span>
            {currentIndex >= 0 && (
              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                {currentIndex + 1}/{questions.length}
              </span>
            )}
          </motion.div>
        )}

        <div className="flex-1" />

        {/* Language picker */}
        <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLangChange(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang.id === l.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleRun}
          disabled={running || submitting || !selected}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-sm disabled:opacity-40 transition-all shadow-sm shrink-0"
        >
          <Play className="w-4 h-4" /> Run
        </button>
        <button
          onClick={handleSubmit}
          disabled={running || submitting || !selected}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm px-5 py-2 rounded-xl shadow-md shadow-indigo-200 transition-all shrink-0"
        >
          <CheckCircle className="w-4 h-4" /> Submit
        </button>
      </header>

      {/* ── Main body: left description | right editor+console ── */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden min-h-0">

        {/* LEFT — Problem Description */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[44%] shrink-0 bg-white rounded-[20px] border border-slate-100 shadow-sm flex flex-col overflow-hidden min-h-0"
        >
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-100 px-5 bg-slate-50 shrink-0">
            {[
              { id: "description", label: "Description", icon: BookOpen },
              { id: "examples",    label: "Examples",    icon: Terminal  },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold border-b-2 transition-all -mb-px ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Description / Examples content */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            {selected && questionDetails ? (
              <AnimatePresence mode="wait">
                {activeTab === "description" ? (
                  <motion.div
                    key="desc"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="p-8"
                  >
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <h1 className="text-[22px] font-extrabold text-slate-900 leading-snug flex-1">
                        {questionDetails.title}
                      </h1>
                      <div className="flex flex-col items-end gap-2 shrink-0 mt-1">
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${diffBadge[questionDetails.difficulty] || diffBadge.Easy}`}>
                          {questionDetails.difficulty}
                        </span>
                        {questionDetails.points && (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Diamond className="w-3 h-3 fill-current" /> {questionDetails.points} Points
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description body */}
                    <p className="text-[15px] text-slate-600 leading-[1.85] whitespace-pre-wrap mb-8">
                      {questionDetails.description}
                    </p>

                    {/* Input format */}
                    {questionDetails.input_format && (
                      <div className="mb-6">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 mb-2.5">Input Format</div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono text-sm text-slate-700 leading-relaxed">
                          {questionDetails.input_format}
                        </div>
                      </div>
                    )}

                    {/* Output format */}
                    {questionDetails.output_format && (
                      <div className="mb-6">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-2.5">Output Format</div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono text-sm text-slate-700 leading-relaxed">
                          {questionDetails.output_format}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {questionDetails.constraints && (
                      <div className="mb-6">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 mb-2.5">Constraints</div>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 font-mono text-sm text-slate-700 leading-relaxed">
                          {questionDetails.constraints}
                        </div>
                      </div>
                    )}

                    {/* Inline first example preview */}
                    {questionDetails.examples?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Example 1</div>
                        <div className="rounded-2xl overflow-hidden border border-slate-200">
                          <div className="grid grid-cols-2 divide-x divide-slate-200">
                            <div className="p-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-2">Input</div>
                              <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap">{questionDetails.examples[0].input}</pre>
                            </div>
                            <div className="p-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">Output</div>
                              <pre className="font-mono text-sm text-emerald-700 whitespace-pre-wrap">{questionDetails.examples[0].output}</pre>
                            </div>
                          </div>
                        </div>
                        {questionDetails.examples.length > 1 && (
                          <button
                            onClick={() => setActiveTab("examples")}
                            className="mt-2 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                          >
                            + {questionDetails.examples.length - 1} more example{questionDetails.examples.length > 2 ? "s" : ""} →
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="examples"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="p-8 flex flex-col gap-6"
                  >
                    {questionDetails.examples?.length > 0 ? (
                      questionDetails.examples.map((ex, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-slate-200">
                          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[11px] font-black">{i + 1}</div>
                            <span className="text-sm font-extrabold text-slate-700">Example {i + 1}</span>
                          </div>
                          <div className="p-5 flex flex-col gap-4">
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-widest mb-2 text-indigo-500">Input</div>
                              <pre className="text-sm p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono overflow-x-auto whitespace-pre-wrap">{ex.input}</pre>
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-widest mb-2 text-emerald-600">Output</div>
                              <pre className="text-sm p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-mono overflow-x-auto whitespace-pre-wrap">{ex.output}</pre>
                            </div>
                            {ex.explanation && (
                              <div>
                                <div className="text-[10px] font-extrabold uppercase tracking-widest mb-2 text-slate-400">Explanation</div>
                                <p className="text-sm text-slate-600 leading-relaxed">{ex.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center text-slate-300">
                        <Terminal className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium text-slate-400">No examples provided.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 p-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Code2 className="w-8 h-8 text-indigo-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-slate-500 mb-1">No problem selected</p>
                  <p className="text-xs text-slate-400 font-medium">Click "Problems" in the top bar to pick a challenge</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT — Editor on top, Console below */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06 }}
          className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden"
        >
          {/* Editor */}
          <div className="flex-1 bg-white rounded-[20px] border border-slate-100 shadow-sm flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-sm">
                <Code2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">solution{lang.ext}</span>
              </div>
              <div className="flex-1" />
              <AnimatePresence>
                {submitResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl border ${
                      submitResult.allPassed
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : "bg-rose-50 border-rose-200 text-rose-600"
                    }`}
                  >
                    {submitResult.allPassed
                      ? <><Check className="w-3.5 h-3.5" /> All {submitResult.total} passed!</>
                      : <><XCircle className="w-3.5 h-3.5" /> {submitResult.passed}/{submitResult.total} passed</>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                theme="vs-light"
                language={lang.id}
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  lineHeight: 1.7,
                  cursorBlinking: "smooth",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
              />
            </div>
          </div>

          {/* Console */}
          <div className="h-[200px] bg-white rounded-[20px] border border-slate-100 shadow-sm flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-extrabold text-slate-700">Console</span>
                {ran && (
                  <div className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-lg border ml-1 ${
                    output.some(l => l.type === "error")
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                  }`}>
                    {output.some(l => l.type === "error") ? "Error" : "Passed"}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setOutput([]); setRan(false); setSubmitResult(null); }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Clear
              </button>
            </div>

            <div
              ref={outputRef}
              className="flex-1 overflow-y-auto px-5 py-4 font-mono text-xs"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
            >
              {output.length === 0 && !running && !submitting ? (
                <p className="text-slate-400 font-medium">Run or Submit your code to see output here.</p>
              ) : (
                <>
                  {output.map((line, i) => (
                    <div
                      key={i}
                      className={`leading-relaxed mb-0.5 ${
                        line.type === "error"   ? "text-rose-500" :
                        line.type === "success" ? "text-emerald-600 font-bold" :
                        line.type === "info"    ? "text-indigo-500 font-semibold" :
                        line.type === "prompt"  ? "text-slate-400" :
                        "text-slate-700"
                      }`}
                    >
                      {line.text || "\u00A0"}
                    </div>
                  ))}
                  {(running || submitting) && (
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="text-indigo-400 font-semibold mt-1"
                    >
                      {submitting ? "Running test cases…" : "Executing…"}
                    </motion.div>
                  )}
                  {ran && (
                    <div className={`mt-3 flex items-center gap-2 font-bold ${
                      output.some(l => l.type === "error") ? "text-rose-500" : "text-emerald-600"
                    }`}>
                      {output.some(l => l.type === "error")
                        ? <><AlertCircle className="w-3.5 h-3.5" /> Process ended with errors</>
                        : <><CheckCircle className="w-3.5 h-3.5" /> Process completed successfully</>
                      }
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
