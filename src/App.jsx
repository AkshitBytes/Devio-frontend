import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Signup from "./components/Auth/Signup";
import TeacherDashboard from "./components/Dashboard/Teacher";
import StudentDashboard from "./components/Dashboard/Student";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/teacherdashboard" element={<TeacherDashboard />} />
        <Route path="/studentdashboard" element={<StudentDashboard />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
   
  );
}

export default App;
