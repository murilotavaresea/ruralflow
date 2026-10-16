import CampoNumerico from "./CampoNumerico";
import { SITUACOES_GRAU, grauEstaAberto, resumirMatricula } from "../utils/analiseMatricula";
import "./AnaliseMatricula.css";

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentual(indice) {
  if (indice === null || indice === undefined) return "—";
  return `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function detalhe(faixa, rotulo) {
  return `${rotulo} ${faixa.quantidade}${faixa.valor > 0 ? ` (${moeda(faixa.valor)})` : ""}`;
}

// "Analise matricula quando hipoteca ou alienacao" da planilha-modelo: o analista lanca cada grau
// ja registrado na matricula (n.º do registro, grau, valor, vencimento, contrato e se esta
// aberto ou cancelado) e o resumo calcula graus em aberto, valor tomado, risco e cobertura.
export default function AnaliseMatricula({
  garantia,
  valorOperacao,
  onMudarCampo,
  onAdicionarGrau,
  onRemoverGrau,
  onMudarCampoGrau,
}) {
  const resumo = resumirMatricula(garantia, valorOperacao);
  const graus = garantia.graus || [];
  const grauSugerido = `${resumo.grauDestaOperacao}º`;
  const mostrarComOutraProposta = resumo.outraProposta > 0;
  const semAvaliacao = !(Number(garantia.valor) > 0);

  const itens = [
    {
      rotulo: "Graus de hipoteca em aberto",
      valor: resumo.grausDeHipotecaAbertos,
      nota: `${detalhe(resumo.hipotecaCredisul, "Credisul")} · ${detalhe(resumo.hipotecaOutraIf, "Outras IFs")}`,
    },
    {
      rotulo: "Alienações em aberto",
      valor: resumo.alienacoesAbertas,
      nota: `${detalhe(resumo.alienacaoCredisul, "Credisul")} · ${detalhe(resumo.alienacaoOutraIf, "Outras IFs")}`,
    },
    { rotulo: "Valor tomado (graus abertos)", valor: moeda(resumo.valorTomado) },
    {
      rotulo: "Total do risco respaldado",
      valor: resumo.totalRisco === null ? "—" : moeda(resumo.totalRisco),
      nota: resumo.totalRisco === null ? "informe o valor da operação" : "esta proposta + valor tomado",
    },
    {
      rotulo: "Cobertura (avaliação ÷ risco)",
      valor: percentual(resumo.cobertura),
      nota: semAvaliacao ? "informe o valor da avaliação acima" : undefined,
    },
    { rotulo: "Grau desta operação", valor: grauSugerido, acao: garantia.grau !== grauSugerido },
  ];
  if (mostrarComOutraProposta) {
    itens.push(
      {
        rotulo: "Risco c/ outra proposta",
        valor: resumo.totalRiscoComOutraProposta === null ? "—" : moeda(resumo.totalRiscoComOutraProposta),
      },
      { rotulo: "Cobertura c/ outra proposta", valor: percentual(resumo.coberturaComOutraProposta) }
    );
  }

  return (
    <section className="analise-matricula" aria-label="Análise da matrícula">
      <h4>
        Análise da matrícula{garantia.matricula ? ` ${garantia.matricula}` : ""} — graus já registrados
      </h4>

      <div className="analise-matricula-topo">
        <label className="campo">
          <span>Outra proposta de crédito nesta matrícula</span>
          <CampoNumerico
            prefixo="R$"
            valor={garantia.outraProposta || ""}
            onChange={(valor) => onMudarCampo("outraProposta", valor)}
            placeholder="0,00"
          />
        </label>
      </div>

      {graus.length > 0 && (
        <div className="analise-graus-rolagem">
          <table className="analise-graus">
            <thead>
              <tr>
                <th scope="col">Nº registro</th>
                <th scope="col">Grau</th>
                <th scope="col">Valor</th>
                <th scope="col">Vencimento</th>
                <th scope="col">Nº contrato</th>
                <th scope="col">Situação</th>
                <th scope="col">
                  <span className="sr-only">Remover</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {graus.map((grau, indice) => {
                const posicao = indice + 1;
                const classeLinha = grau.status === "cancelado" ? "cancelado" : grauEstaAberto(grau) ? "aberto" : "";
                return (
                  <tr key={grau.id} className={classeLinha}>
                    <td>
                      <input
                        type="text"
                        value={grau.registro}
                        aria-label={`Nº do registro, grau ${posicao}`}
                        onChange={(e) => onMudarCampoGrau(grau.id, "registro", e.target.value)}
                      />
                    </td>
                    <td className="col-grau">
                      <input
                        type="text"
                        value={grau.grau}
                        placeholder={`${posicao}º`}
                        aria-label={`Grau ${posicao}`}
                        onChange={(e) => onMudarCampoGrau(grau.id, "grau", e.target.value)}
                      />
                    </td>
                    <td>
                      <CampoNumerico
                        prefixo="R$"
                        valor={grau.valor}
                        placeholder="0,00"
                        aria-label={`Valor do grau ${posicao}`}
                        onChange={(valor) => onMudarCampoGrau(grau.id, "valor", valor)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={grau.vencimento}
                        aria-label={`Vencimento do grau ${posicao}`}
                        onChange={(e) => onMudarCampoGrau(grau.id, "vencimento", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={grau.contrato}
                        aria-label={`Nº do contrato do grau ${posicao}`}
                        onChange={(e) => onMudarCampoGrau(grau.id, "contrato", e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={grau.status}
                        aria-label={`Situação do grau ${posicao}`}
                        onChange={(e) => onMudarCampoGrau(grau.id, "status", e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {SITUACOES_GRAU.map((situacao) => (
                          <option key={situacao.valor} value={situacao.valor}>
                            {situacao.rotulo}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="col-remover">
                      <button
                        type="button"
                        className="btn btn-fantasma btn-pequeno btn-perigo"
                        onClick={() => onRemoverGrau(grau.id)}
                        aria-label={`Remover o grau ${posicao}`}
                        title="Remover grau"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="analise-matricula-acoes">
        <button type="button" className="btn btn-pequeno" onClick={onAdicionarGrau}>
          + Adicionar grau
        </button>
        {graus.length === 0 && (
          <span className="campo-dica">
            Lance os graus que já constam na matrícula (abertos ou cancelados) para calcular o valor tomado e a
            cobertura.
          </span>
        )}
        {resumo.semSituacao > 0 && (
          <span className="campo-dica aviso">
            {resumo.semSituacao} grau{resumo.semSituacao > 1 ? "s" : ""} sem situação: não {resumo.semSituacao > 1 ? "entram" : "entra"} nas somas.
          </span>
        )}
        {resumo.cancelados > 0 && (
          <span className="campo-dica">
            {resumo.cancelados} cancelado{resumo.cancelados > 1 ? "s" : ""} (não {resumo.cancelados > 1 ? "entram" : "entra"} nas somas).
          </span>
        )}
      </div>

      <dl className={`analise-resumo itens-${itens.length}`}>
        {itens.map((item) => (
          <div key={item.rotulo}>
            <dt>{item.rotulo}</dt>
            <dd>
              {item.valor}
              {item.acao && (
                <button
                  type="button"
                  className="analise-usar-grau"
                  onClick={() => onMudarCampo("grau", grauSugerido)}
                  title={`Preencher o campo Grau com ${grauSugerido}`}
                >
                  usar no campo Grau
                </button>
              )}
            </dd>
            {item.nota && <small>{item.nota}</small>}
          </div>
        ))}
      </dl>
    </section>
  );
}
