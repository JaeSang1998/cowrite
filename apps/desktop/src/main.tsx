import "@blocknote/react/style.css";

import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container was not found.");
}

// StrictMode disabled — BlockNote 0.23 drag-and-drop is incompatible with
// React 19 StrictMode's double-render behaviour.
createRoot(container).render(<App />);

