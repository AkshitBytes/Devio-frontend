export default function useTheme(dark) {
  return {
    bg: dark ? "#071013" : "#F0F5F8",
    bgNav: dark ? "rgba(7,16,19,0.88)" : "rgba(240,245,248,0.88)",
    border: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    cardBg: dark ? "rgba(255,255,255,0.025)" : "#ffffff",
    text: dark ? "#DFE0E2" : "#0f2228",
    muted: dark ? "#75ABBC" : "#4a7a8a",
    faint: dark ? "#4a5a60" : "#8aa5b0",
    inputBg: dark ? "rgba(0,0,0,0.35)" : "#f4f8fa",
    inputBorder: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    rowHover: dark ? "rgba(255,255,255,0.025)" : "rgba(34,211,238,0.05)",
    rowBorder: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    gridLine: dark ? "rgba(35,181,211,0.03)" : "rgba(35,181,211,0.07)",
    editorBg: dark ? "#0d1b1e" : "#f8fbfc",
    codeBg: dark ? "#060e10" : "#eef4f6",
    toggleBg: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    toggleText: dark ? "#75ABBC" : "#4a7a8a",
    accent: "#22d3ee",
  };
}