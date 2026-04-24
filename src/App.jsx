import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AnimatePresence, motion } from "framer-motion";

import Signup from "./pages/Auth/Signup.jsx";
import Login from "./pages/Auth/Login.jsx";
import ProtectedRoute from "./pages/Auth/Protected.jsx";
import StudentDashboard from "./pages/Student/dashboard/StudentDashboard.jsx";
import TeacherDashboard from "./pages/Teacher/dashboard/TeacherDashboard.jsx";
import PracticePage from "./pages/Student/Practice/PracticePage.jsx";
import PracticeSolver from "./pages/Student/Practice/PracticeSolver.jsx";
import FreePracticePage from "./pages/Student/Practice/FreePracticePage.jsx";
import BattlePage from "./pages/Student/battles/BattlePage.jsx";
import LeaderBoard from "./pages/Student/leaderboard/LeaderBoard.jsx";
import ClassroomPage from "./pages/Classroom/ClassroomPage.jsx";
import ProtectedAny from "./pages/Auth/ProtectedAny.jsx";

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

        <Route path="/teacherdashboard" element={
          <ProtectedRoute role="teacher">
            <PageTransition><TeacherDashboard /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/studentdashboard" element={
          <ProtectedRoute role="student">
            <PageTransition><StudentDashboard /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/student/practice" element={
          <ProtectedRoute role="student">
            <PageTransition><PracticePage /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/student/practice/solver" element={
          <ProtectedRoute role="student">
            <PageTransition><PracticeSolver /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/freepractice" element={
          <ProtectedRoute role="student">
            <PageTransition><FreePracticePage /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/student/battles" element={
          <ProtectedRoute role="student">
            <PageTransition><BattlePage /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/student/leaderboard" element={
          <ProtectedRoute role="student">
            <PageTransition><LeaderBoard /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/classroom/:classroomId" element={
          <ProtectedAny>
            <PageTransition><ClassroomPage /></PageTransition>
          </ProtectedAny>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <>
      <AnimatedRoutes />
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </>
  );
}

export default App;
