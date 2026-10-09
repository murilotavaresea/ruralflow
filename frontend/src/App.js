import { useState } from "react";
import Operacao from "./pages/Operacao";
import Administracao from "./pages/Administracao";
import "./App.css";

function App() {
  const [pagina, setPagina] = useState("operacao");

  return (
    <div>
      <nav className="app-nav">
        <button type="button" className={pagina === "operacao" ? "ativa" : ""} onClick={() => setPagina("operacao")}>
          Operação
        </button>
        <button
          type="button"
          className={pagina === "administracao" ? "ativa" : ""}
          onClick={() => setPagina("administracao")}
        >
          Administração
        </button>
      </nav>

      {pagina === "operacao" ? <Operacao /> : <Administracao />}
    </div>
  );
}

export default App;
