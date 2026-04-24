import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useNavigate } from "react-router-dom";
import { runCodeAPI } from "../../../services/code.service.js";
import {
  ChevronLeft, Play, Terminal, Code2, Trash2, Copy, Check,
  Zap, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
  { id: "javascript", label: "JS", name: "JavaScript", ext: ".js", langId: 63 },
  { id: "python",     label: "PY", name: "Python",     ext: ".py", langId: 71 },
  { id: "cpp",        label: "C++", name: "C++",       ext: ".cpp", langId: 54 },
  { id: "java",       label: "Java", name: "Java",     ext: ".java", langId: 62 },
];

const STARTER = {
  javascript: `// Write your JavaScript here\n\nconsole.log("Hello Devio 🚀");`,
  python:     `# Write your Python here\n\nprint("Hello Devio 🚀")`,
  cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello Devio 🚀" << endl;\n  return 0;\n}`,
  java:       `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Devio 🚀");\n  }\n}`,
};

export default function FreePracticePage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(STARTER.javascript);
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const handleLangChange = (l) => {
    setLang(l);
    setCode(STARTER[l.id]);
    setOutput([]);
    setRan(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      setOutput([]);
      const token = localStorage.getItem("token");

      if (!token) {
        setOutput([{ text: "> Please login first.", type: "error" }]);
        return;
      }

      const ts = new Date().toLocaleTimeString();
      const preamble = [
        { text: `> devio sandbox · ${lang.name} · ${ts}`, type: "info" },
        { text: `> Running main${lang.ext}...`, type: "prompt" },
        { text: "", type: "prompt" },
      ];
      setOutput(preamble);

      const result = await runCodeAPI(code, lang.langId, token);

      let lines = [];
      if (result.stdout) {
        lines = result.stdout.split("\n").map(line => ({ text: line, type: "normal" }));
      } else if (result.stderr) {
        lines = result.stderr.split("\n").map(line => ({ text: line, type: "error" }));
      } else if (result.compile_output) {
        lines = result.compile_output.split("\n").map(line => ({ text: line, type: "error" }));
      } else {
        lines = [{ text: "(no output)", type: "normal" }];
      }

      const hasError = lines.some(l => l.type === "error");
      const postamble = [
        { text: "", type: "prompt" },
        {
          text: hasError ? "> Process exited with error" : "> Process exited with code 0",
          type: hasError ? "error" : "success",
        },
      ];

      setOutput([...preamble, ...lines, ...postamble]);
      setRan(true);
    } catch {
      setOutput([{ text: "> Execution failed.", type: "error" }]);
    } finally {
      setRunning(false);
    }
  };

  const lineCount = code.split("\n").length;
  const charCount = code.length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F7FE]" style={{ fontFamily: "'DM Sans','Nunito',sans-serif" }}>

      {/* Top Bar */}
      <header className="h-[60px] bg-white border-b border-slate-100 px-5 flex items-center gap-4 shrink-0 z-10 shadow-sm">
        <button
          onClick={() => navigate("/student/practice")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all font-bold text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Practice
        </button>

        <div className="w-px h-6 bg-slate-100" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Terminal className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-800 leading-tight">Free Sandbox</div>
            <div className="text-[10px] text-slate-400 font-medium leading-tight">main{lang.ext}</div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Language selector */}
        <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
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
          onClick={copyCode}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
            copied
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>

        <button
          onClick={() => { setOutput([]); setRan(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl shadow-md shadow-indigo-200 transition-all"
        >
          {running ? (
            <><Square className="w-4 h-4 fill-white" /> Running…</>
          ) : (
            <><Play className="w-4 h-4 fill-white" /> Run</>
          )}
        </button>
      </header>

      {/* Editor + Output */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">

        {/* Editor */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0"
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-sm">
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">main{lang.ext}</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              theme="vs-light"
              language={lang.id}
              value={code}
              onChange={(value) => setCode(value || "")}
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
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center gap-4 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold">{lineCount} lines</span>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold">{charCount} chars</span>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold">{lang.name}</span>
          </div>
        </motion.div>

        {/* Output */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[400px] shrink-0 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-extrabold text-slate-700">Console Output</span>
            </div>
            <AnimatePresence>
              {ran && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                    output.some(l => l.type === "error")
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {output.some(l => l.type === "error") ? "Error" : "Success"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto p-5 font-mono text-sm min-h-0"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
          >
            {output.length === 0 && !running ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                <Terminal style={{ width: 48, height: 48 }} />
                <p className="text-sm font-bold">Press Run to execute your code</p>
              </div>
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
                {running && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-indigo-400 font-semibold mt-2"
                  >
                    Executing…
                  </motion.div>
                )}
              </>
            )}
          </div>

          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 shrink-0">
            <div className="text-[10px] text-slate-400 font-bold">
              devio sandbox · {lang.name}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}