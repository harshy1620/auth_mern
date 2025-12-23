import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // VERY IMPORTANT (for refresh token cookie)
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
