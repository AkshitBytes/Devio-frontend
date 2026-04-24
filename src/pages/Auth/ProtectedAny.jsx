import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProtectedAny({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    axios
      .get("http://localhost:5000/dashboard/student", { headers })
      .catch(() => axios.get("http://localhost:5000/dashboard/teacher", { headers }))
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  return children;
}

