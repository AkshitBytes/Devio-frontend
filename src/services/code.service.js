import axios from "axios"

export const runCodeAPI = async (code, language_id, token) => {
  const res = await axios.post(
    "http://localhost:5000/code/run",
    {
      source_code: code,
      language_id,
      stdin: ""
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return res.data
}
