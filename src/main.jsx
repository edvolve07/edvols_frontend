import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./portal/context/AuthContext";
import { ToastProvider } from "./portal/context/ToastContext";
import "./globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);
