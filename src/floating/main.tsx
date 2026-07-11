import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/floating.css";
import { FloatingApp } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FloatingApp />
  </StrictMode>,
);