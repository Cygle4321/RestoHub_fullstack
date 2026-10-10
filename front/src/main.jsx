import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Rechargement automatique et transparent lors d'un nouveau déploiement (chunks obsolètes)
window.addEventListener("vite:preloadError", () => {
  const key = "restohub_chunk_reload";
  const lastReload = sessionStorage.getItem(key);
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(key, String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
