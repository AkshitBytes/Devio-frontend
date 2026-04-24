import { Navigate } from "react-router-dom";
function isAuthenticated() {
  return !!localStorage.getItem("token");
}
function getUserRole() {

  return localStorage.getItem("role") || null;
}
export default function ProtectedRoute({ children, allowedRole }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole) {
    const role = getUserRole();
    if (role !== allowedRole) {
      return <Navigate to={role === "teacher" ? "/teacherdashboard" : "/studentdashboard"} replace />;
    }
  }

  return children;
}