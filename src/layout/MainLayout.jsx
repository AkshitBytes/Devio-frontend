// src/layout/MainLayout.jsx
import useTheme from "../hooks/useTheme"

export default function MainLayout({ dark, children }) {
  const th = useTheme(dark)

  return (
    <div style={{
      minHeight: "100vh",
      background: th.bg,
      color: th.text
    }}>
      {children}
    </div>
  )
}
