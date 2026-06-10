import axios from "axios";

const api = axios.create({
  baseURL: window.location.hostname === "localhost" 
    ? "http://localhost:4000" 
    : "https://kanbanbackend-production-53a6.up.railway.app",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const version = localStorage.getItem("apiVersion") || "v1";
  
  // If url is relative and doesn't have api prefix, prepend version
  if (config.url && !config.url.startsWith("http") && !config.url.startsWith("/api/v")) {
    const cleanUrl = config.url.startsWith("/") ? config.url : `/${config.url}`;
    config.url = `/api/${version}${cleanUrl}`;
  }
  
  return config;
});

export default api;
