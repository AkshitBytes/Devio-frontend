import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError, handleSuccess } from "../../utils/toast";

function Login() {
  const navigate = useNavigate();

  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLoginInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/auth/signin",
        loginInfo
      );

      handleSuccess(response.data.message);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      const userRole = response.data.user.role;

      if (userRole === "teacher") {
        navigate("/teacherdashboard");
      } else {
        navigate("/studentdashboard");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Something went wrong";
      handleError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-8 rounded-xl w-96 shadow-lg">
        <h2 className="text-white text-2xl mb-6 text-center">Login</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={loginInfo.email}
            onChange={handleChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginInfo.password}
            onChange={handleChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
          />

          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded mt-4"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
