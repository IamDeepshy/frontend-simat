import API from "../config/api.jsx";

export const apiFetch = (endpoint, options = {}) => {
  return fetch(`${API}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
};