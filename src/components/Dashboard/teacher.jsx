import React from "react";
import { useNavigate } from "react-router-dom";

function Teacher() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-6">Teacher Dashboard</h1>

      <button
        onClick={handleLogout}
        className="bg-red-600 px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}

export default Teacher;
