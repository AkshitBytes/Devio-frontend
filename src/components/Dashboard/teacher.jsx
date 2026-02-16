import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";


function Teacher() {
  const navigate = useNavigate();
  
  useEffect(() => {
  const token = localStorage.getItem("token")

  axios.get("http://localhost:5000/auth/teacher-dashboard", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => {
     console.log("Authorized")
  })
  .catch(err => {
     localStorage.removeItem("token")
     navigate("/login")
  })
}, [])
const handleLogout=() =>{
  localStorage.removeItem('token')
  navigate('/login')
}

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
