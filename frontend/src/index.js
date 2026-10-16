import React from "react";
import ReactDOM from "react-dom/client";
// Fontes empacotadas com o app (nada de Google Fonts): funcionam offline, que e justamente o
// papel do fallback de dados de referencia.
import "@fontsource-variable/manrope";
import "@fontsource-variable/sora";
import "./index.css";
import App from "./App";
import { aplicarTema, lerTema } from "./utils/tema";

// Antes do primeiro render, pra nao piscar o tema errado.
aplicarTema(lerTema());

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
