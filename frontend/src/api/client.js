import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("penny_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

export default client;
