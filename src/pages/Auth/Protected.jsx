import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

function ProtectedRoute({ children, role }) {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      navigate("/login")
      return
    }

    axios.get(`http://localhost:5000/dashboard/${role}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .catch(() => {
        localStorage.removeItem("token")
        navigate("/login")
      })

  }, [navigate, role])

  return children
}

export default ProtectedRoute
