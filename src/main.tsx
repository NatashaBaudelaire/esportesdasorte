import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize settings from localStorage before render
const stored = localStorage.getItem('selecaobet-settings');
if (stored) {
  try {
    const { state } = JSON.parse(stored);
    if (state?.theme) document.documentElement.setAttribute('data-theme', state.theme);
    if (state?.fontSize) document.documentElement.setAttribute('data-fontsize', state.fontSize);
    if (state?.daltonism) document.documentElement.setAttribute('data-daltonism', state.daltonism);
  } catch {}
}

createRoot(document.getElementById("root")!).render(<App />);
