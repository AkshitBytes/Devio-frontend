import React from 'react';
import  axios  from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError , handleSuccess } from '../../utils/toast'
function Signup() {
  const navigate = useNavigate();

  const [signupInfo, setSignupInfo] = useState({
    name:"",
    email:"",
    password:"",
    role:"student"
  })

  const handleChange=(e)=>{
    const{name,value} = e.target;

    setSignupInfo((prev)=>({
      ...prev,
      [name]:value,
    }))
  }

  const handleSubmit =async(e)=>{
    e.preventDefault();
    console.log(signupInfo)
    try{
      const response = await axios.post(
        "http://localhost:5000/auth/signup",
        signupInfo
      )

      handleSuccess(response.data.message)

      const userRole = response.data.user.role;
      if(userRole === "teacher"){
        navigate("/teacherdashboard")
      }else if(userRole === "student"){
        navigate("/studentdashboard")
      }

    }catch(err){
      if(err.response){
        handleError(err.response.data.message)
      }else{
        handleError("Server error")
      }
    }
  }
  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-8 rounded-xl w-96 shadow-lg">
        <h2 className="text-white text-2xl mb-6 text-center">Signup</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={signupInfo.name}
            onChange={handleChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={signupInfo.email}
            onChange={handleChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={signupInfo.password}
            onChange={handleChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
          />

          <div className="flex gap-4 justify-center mt-2">
            <button
              type="button"
              onClick={() =>
                setSignupInfo({ ...signupInfo, role: "teacher" })
              }
              className={`px-4 py-2 rounded ${
                signupInfo.role === "teacher"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Teacher
            </button>

            <button
              type="button"
              onClick={() =>
                setSignupInfo({ ...signupInfo, role: "student" })
              }
              className={`px-4 py-2 rounded ${
                signupInfo.role === "student"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Student
            </button>
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded mt-4"
          >
            Signup
          </button>
        </form>
      </div>
    </div>
    </>
  )
}

export default Signup
