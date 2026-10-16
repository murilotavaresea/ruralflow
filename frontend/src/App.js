import { useState } from "react";
import Operacao from "./pages/Operacao";
import Administracao from "./pages/Administracao";
import TemaToggle from "./components/TemaToggle";
import { UiProvider } from "./components/UiFeedback";
import "./App.css";

function App() {
  const [pagina, setPagina] = useState("operacao");
  const emAdministracao = pagina === "administracao";

  return (
    <UiProvider>
      <a className="pular-para-conteudo" href="#conteudo-principal">
        Pular para o conteúdo
      </a>

      <header className="app-barra nao-imprimir">
        <button
          type="button"
          className="app-marca"
          onClick={() => setPagina("operacao")}
          aria-label="RuralFlow Checklist — ir para a análise de operação"
        >
          <span className="app-logo" aria-hidden="true">
            RF
          </span>
          <span className="app-marca-texto">
            <strong>RuralFlow</strong>
            <small>Checklist de crédito rural</small>
          </span>
        </button>

        <div className="app-barra-acoes">
          {emAdministracao && (
            <button type="button" className="btn btn-pequeno" onClick={() => setPagina("operacao")}>
              ← Voltar para a operação
            </button>
          )}
          <TemaToggle />
          <button
            type="button"
            className={`btn btn-fantasma btn-pequeno app-admin${emAdministracao ? " ativa" : ""}`}
            aria-current={emAdministracao ? "page" : undefined}
            onClick={() => setPagina("administracao")}
            title="Administração dos checklists"
          >
            <span aria-hidden="true">⚙</span> Administração
          </button>
        </div>
      </header>

      {emAdministracao ? (
        <Administracao />
      ) : (
        <Operacao onIrParaAdministracao={() => setPagina("administracao")} />
      )}
    </UiProvider>
  );
}

export default App;
