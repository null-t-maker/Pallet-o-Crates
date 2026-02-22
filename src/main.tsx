import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const globalState = globalThis as typeof globalThis & { __palletoThreeWarnPatched?: boolean };
if (!globalState.__palletoThreeWarnPatched) {
  const ignoredThreeWarnings = [
    "THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.",
    "THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.",
  ];
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const first = typeof args[0] === "string" ? args[0] : "";
    if (ignoredThreeWarnings.some((text) => first.includes(text))) return;
    originalWarn(...args);
  };
  globalState.__palletoThreeWarnPatched = true;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
