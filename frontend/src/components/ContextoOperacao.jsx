import { forwardRef } from "react";
import BarraProgresso from "./BarraProgresso";
import { rotuloPrograma } from "../utils/operacaoModel";
import "./ContextoOperacao.css";

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function textoSalvamento(salvamento) {
  if (salvamento.estado === "erro") {
    return "Não foi possível salvar neste navegador — exporte uma cópia (.json)";
  }
  if (salvamento.estado === "salvando") return "Salvando…";
  if (salvamento.estado === "salvo" && salvamento.em) {
    return `Salvo às ${salvamento.em.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return "Salvo automaticamente neste navegador";
}

// Faixa fixa no topo da operacao: quem e o proponente, os numeros principais, a situacao dos
// checklists (OK / N.A. / Pendente / nao avaliado) e se o que foi digitado ja foi salvo. Fica
// visivel enquanto o analista rola as listas longas.
const ContextoOperacao = forwardRef(function ContextoOperacao(
  { operacao, progresso, salvamento, dadosLocais, impedimentos = 0, onIrParaAba },
  ref
) {
  const { proponente, proposta } = operacao;
  const valor = Number(proposta.valorOperacao) || 0;
  const prazo = Number(proposta.prazoMeses) || 0;

  const meta = [rotuloPrograma(proposta.programa)];
  if (valor > 0) meta.push(moeda(valor));
  if (prazo > 0) meta.push(`${prazo} meses`);
  if (proponente.documento) meta.push(proponente.documento);

  const segmentos = [
    { chave: "ok", quantidade: progresso.ok, rotulo: "OK" },
    { chave: "na", quantidade: progresso.na, rotulo: "N/A" },
    { chave: "pendente", quantidade: progresso.pendente, rotulo: "pendentes" },
  ];

  return (
    <section className="contexto-operacao" ref={ref} aria-label="Resumo da operação">
      <div className="contexto-linha">
        <div className="contexto-identidade">
          <p className={`contexto-nome${proponente.nome ? "" : " vazio"}`}>
            {proponente.nome || "Operação sem proponente informado"}
          </p>
          <p className="contexto-meta">{meta.join(" · ")}</p>
        </div>

        <div className="contexto-lateral">
          {impedimentos > 0 && (
            <button
              type="button"
              className="contexto-selo-impedimento"
              onClick={() => onIrParaAba("revisao")}
              title="Há regras que impedem a contratação desta proposta. Clique para ver na Revisão."
            >
              {impedimentos} impedimento{impedimentos > 1 ? "s" : ""} à contratação
            </button>
          )}
          {dadosLocais && (
            <span
              className="contexto-selo-local"
              title="Não foi possível falar com o servidor; a lista de checklists vem de uma cópia local e pode estar desatualizada."
            >
              Dados locais
            </span>
          )}
          <span className={`contexto-salvamento ${salvamento.estado}`} role="status">
            <span className="contexto-salvamento-ponto" aria-hidden="true" />
            {textoSalvamento(salvamento)}
          </span>
        </div>
      </div>

      <div className="contexto-progresso">
        <BarraProgresso
          segmentos={segmentos}
          total={progresso.totalItens}
          rotulo="Progresso geral dos checklists"
          mostrarRotulo={false}
        />
        <ul className="contexto-contagens">
          <li>
            <strong>{progresso.percentual}%</strong> avaliado
          </li>
          <li className="ok">
            <strong>{progresso.ok}</strong> OK
          </li>
          <li className="na">
            <strong>{progresso.na}</strong> N/A
          </li>
          <li className="pendente">
            <strong>{progresso.pendente}</strong> {progresso.pendente === 1 ? "pendente" : "pendentes"}
          </li>
          <li>
            <strong>{progresso.naoAvaliados}</strong> não avaliados
          </li>
        </ul>
        {progresso.pendente > 0 && (
          <button type="button" className="btn btn-pequeno" onClick={() => onIrParaAba("devolutiva")}>
            Ver devolutiva →
          </button>
        )}
      </div>
    </section>
  );
});

export default ContextoOperacao;
