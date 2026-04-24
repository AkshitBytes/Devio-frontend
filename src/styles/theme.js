// ═══════════════════════════════════════════════════════
//   LEARNY PREMIUM LIGHT DESIGN SYSTEM
// ═══════════════════════════════════════════════════════
export const THEME = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap');

:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Manrope', system-ui, sans-serif;

  --primary: #4f46e5;
  --primary-dim: rgba(79, 70, 229, 0.12);
  --success: #059669;
  --success-dim: rgba(5, 150, 105, 0.12);
  --warning: #d97706;
  --danger: #dc2626;

  --bg-base: #0a101a;
  --bg-card: rgba(17, 27, 43, 0.82);
  --bg-card-solid: #111b2b;
  --bg-input: rgba(15, 23, 36, 0.92);
  --sidebar-bg: rgba(11, 19, 32, 0.92);

  --text-1: #e2e8f0;
  --text-2: #94a3b8;
  --text-3: #64748b;

  --border: rgba(148, 163, 184, 0.18);
  --border-md: rgba(148, 163, 184, 0.28);

  --card-shadow: 0 18px 45px rgba(2, 6, 23, 0.35);
  --glow-primary: 0 8px 28px rgba(79, 70, 229, 0.25);
  --glow-success: 0 8px 28px rgba(5, 150, 105, 0.22);

  --sidebar-w: 84px;
}

html { scroll-behavior: smooth; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  background: var(--bg-base);
  color: var(--text-2);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 3px; }

/* ═══════════════════════════════════
   AMBIENT BACKGROUND
═══════════════════════════════════ */
.ambient {
  position: fixed; inset: 0; z-index: 0;
  pointer-events: none; overflow: hidden;
}
.ambient-orb {
  position: absolute; border-radius: 50%;
  filter: blur(120px); opacity: 0.22;
  animation: orbDrift ease-in-out infinite alternate;
}
.ambient-orb:nth-child(1){
  width:600px;height:600px;
  background:radial-gradient(circle,rgba(79,70,229,0.5),transparent 70%);
  top:-150px;right:-150px;animation-duration:15s;
}
.ambient-orb:nth-child(2){
  width:500px;height:500px;
  background:radial-gradient(circle,rgba(5,150,105,0.42),transparent 70%);
  bottom:-100px;left:-100px;animation-duration:20s;animation-delay:-5s;
}
@keyframes orbDrift {
  from{transform:translate(0,0) scale(1);}
  to{transform:translate(60px,40px) scale(1.05);}
}

/* ═══════════════════════════════════
   LAYOUT SHELL
═══════════════════════════════════ */
.dv-shell {
  display: flex; min-height: 100vh; position: relative; z-index: 1;
}
.dv-main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; }
.dv-content { flex: 1; padding: 32px 48px; max-width: 1600px; width: 100%; margin: 0 auto; }

/* ═══════════════════════════════════
   SIDEBAR
═══════════════════════════════════ */
.dv-sidebar {
  width: var(--sidebar-w);
  background: var(--sidebar-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center;
  position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 200; padding: 24px 0;
  box-shadow: 10px 0 28px rgba(2, 6, 23, 0.24);
}
.dv-logo {
  width: 48px; height: 48px;
  background: var(--primary);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-size: 22px; font-weight: 800; color: #fff;
  margin-bottom: 32px;
  box-shadow: var(--glow-primary);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  flex-shrink: 0;
}
.dv-logo:hover { transform: scale(1.05); box-shadow: 0 6px 28px rgba(166, 140, 225, 0.4); }

.dv-nav { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; padding: 0 10px; }

.dv-nav-item {
  width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 16px;
  font-size: 22px;
  cursor: pointer; position: relative;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
  color: var(--text-3);
}
.dv-nav-item:hover { background: rgba(148, 163, 184, 0.14); color: var(--text-1); transform: scale(1.03); }
.dv-nav-item.active {
  background: var(--primary-dim); color: var(--primary);
}

/* ═══════════════════════════════════
   GLASS CARD
═══════════════════════════════════ */
.glass {
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  transition: transform 0.25s, box-shadow 0.25s;
}
.glass:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.06); }

.glass-h { display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border); }
.glass-title { font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-1); }

/* ═══════════════════════════════════
   BUTTONS
═══════════════════════════════════ */
.btn-primary {
  display:inline-flex;align-items:center;gap:8px;
  padding:12px 24px;border-radius:16px;border:none;
  background: var(--success);
  color:#fff;font-family:var(--font-sans);font-size:15px;font-weight:600;
  cursor:pointer;transition:all 0.25s;
  box-shadow: var(--glow-success);
}
.btn-primary:hover{transform:translateY(-2px);box-shadow: 0 8px 24px rgba(150, 224, 123, 0.4);}

.btn-ghost {
  display:inline-flex;align-items:center;gap:8px;
  padding:12px 24px;border-radius:16px;
  border:1px solid var(--border-md);background:rgba(255,255,255,0.5);
  color:var(--text-1);font-family:var(--font-sans);font-size:15px;font-weight:600;
  cursor:pointer;transition:all 0.25s;
}
.btn-ghost:hover{border-color:var(--primary);background:#fff;transform:translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05);}
`;

export default THEME;

