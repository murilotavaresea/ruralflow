import { rotuloPrograma } from "../utils/operacaoModel";
import "./OperacoesRecentes.css";

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataCurta(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function descricao(entrada) {
  const partes = [rotuloPrograma(entrada.programa)];
  if (Number(entrada.valorOperacao) > 0) partes.push(moeda(entrada.valorOperacao));
  const data = dataCurta(entrada.atualizadoEm);
  if (data) partes.push(data);
  return partes.filter(Boolean).join(" · ");
}

// Conteudo do menu "Operacoes": as operacoes salvas neste navegador. `atualId` pode nao estar
// na lista (operacao nova ainda em branco, que so passa a ser salva quando recebe dados).
export default function OperacoesRecentes({ operacoes, atualId, onAbrir, onExcluir, onNova, fechar }) {
  const atualNaLista = operacoes.some((entrada) => entrada.id === atualId);

  return (
    <div className="operacoes-recentes">
      <button
        type="button"
        className="menu-item operacoes-recentes-nova"
        onClick={() => {
          fechar();
          onNova();
        }}
      >
        <span aria-hidden="true">＋</span> Nova operação
      </button>
      <div className="menu-separador" />

      {!atualNaLista && (
        <div className="operacoes-recentes-linha atual">
          <div className="operacoes-recentes-texto">
            <strong>Nova operação em branco</strong>
            <small>Será salva assim que você preencher algo</small>
          </div>
          <span className="operacoes-recentes-selo">aberta</span>
        </div>
      )}

      {operacoes.length === 0 && atualNaLista === false && (
        <p className="operacoes-recentes-vazio">Nenhuma operação salva ainda.</p>
      )}

      <ul>
        {operacoes.map((entrada) => (
          <li key={entrada.id} className={`operacoes-recentes-linha${entrada.id === atualId ? " atual" : ""}`}>
            <button
              type="button"
              className="operacoes-recentes-abrir"
              aria-current={entrada.id === atualId ? "true" : undefined}
              onClick={() => {
                fechar();
                if (entrada.id !== atualId) onAbrir(entrada.id);
              }}
            >
              <span className="operacoes-recentes-texto">
                <strong>{entrada.nome || "Operação sem proponente"}</strong>
                <small>{descricao(entrada)}</small>
              </span>
              {entrada.id === atualId && <span className="operacoes-recentes-selo">aberta</span>}
            </button>
            <button
              type="button"
              className="btn btn-fantasma btn-pequeno btn-perigo"
              aria-label={`Excluir a operação ${entrada.nome || "sem proponente"}`}
              onClick={() => {
                fechar();
                onExcluir(entrada);
              }}
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
