import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const getGames = () => axios.get(`${API}/games`).then((r) => r.data);
export const getResults = (game, limit = 30) =>
  axios.get(`${API}/results/${game}?limit=${limit}`).then((r) => r.data);
export const getStats = (game) => axios.get(`${API}/stats/${game}`).then((r) => r.data);
export const getStatus = () => axios.get(`${API}/status`).then((r) => r.data);
export const triggerUpdate = (game) =>
  axios.post(`${API}/update${game ? `?game=${game}` : ""}`).then((r) => r.data);
export const generateTickets = (body) =>
  axios.post(`${API}/generate`, body).then((r) => r.data);
