import BarraProgresso from "./BarraProgresso";
import "./RevisaoPainel.css";

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentual(indice) {
  if (indice === null || indice === undefined) return "—";
  return `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function resumoDoEstado(resumo) {
  const partes = [];
  if (resumo.impedimentos > 0) {
    partes.push(`${resumo.impedimentos} ${resumo.impedimentos > 1 ? "impedimentos" : "impedimento"} à contratação`);
  }
  if (resumo.camposFaltando > 0) {
    partes.push(`${resumo.camposFaltando} campo${resumo.camposFaltando > 1 ? "s" : ""} obrigatório${resumo.camposFaltando > 1 ? "s" : ""} em branco`);
  }
  if (resumo.naoAvaliados > 0) {
    partes.push(`${resumo.naoAvaliados} ${resumo.naoAvaliados > 1 ? "itens" : "item"} sem avaliação`);
  }
  if (resumo.pendencias > 0) {
    partes.push(`${resumo.pendencias} ${resumo.pendencias > 1 ? "pendências" : "pendência"} para devolutiva`);
  }
  return partes;
}

// Aba "Revisao": uma conferencia antes de gerar o parecer e a devolutiva — o que falta
// preencher, os pontos de atencao, a situacao de cada checklist e os numeros-chave.
export default function RevisaoPainel({ revisao, rotulosAbas, onIrParaAba }) {
  const { resumo, numeros, camposFaltando, avisos, secoes, regras } = revisao;
  const partes = resumoDoEstado(resumo);
  const impedida = resumo.impedimentos > 0;
  const tom = impedida ? "impedimento" : resumo.pronto ? (resumo.pendencias > 0 ? "atencao" : "ok") : "atencao";
  const titulo = impedida
    ? "Há impedimento à contratação segundo as regras do parecer"
    : resumo.pronto
    ? resumo.pendencias > 0
      ? "Checklists completos, com pendências para devolver ao proponente"
      : "Tudo avaliado e sem pendências"
    : "Ainda há o que conferir antes de fechar a análise";

  return (
    <div className="revisao">
      <div className="cartao">
        <h2>Revisão</h2>
        <p className="cartao-descricao">
          Confira o que ainda falta antes de gerar o parecer e a devolutiva.
        </p>

        <div className={`revisao-banner ${tom}`} role="status">
          <strong>{titulo}</strong>
          {partes.length > 0 && <span>{partes.join(" · ")}</span>}
        </div>

        <dl className="revisao-numeros">
          <div>
            <dt>Valor da operação</dt>
            <dd>{numeros.valorOperacao > 0 ? moeda(numeros.valorOperacao) : "—"}</dd>
          </div>
          <div>
            <dt>Prazo / carência</dt>
            <dd>
              {numeros.prazoMeses > 0 ? `${numeros.prazoMeses} meses` : "—"}
              {numeros.carenciaMeses > 0 ? ` / ${numeros.carenciaMeses}` : ""}
            </dd>
          </div>
          <div>
            <dt>Taxa</dt>
            <dd>{numeros.taxaAnual > 0 ? `${numeros.taxaAnual.toLocaleString("pt-BR")}% a.a.` : "—"}</dd>
          </div>
          <div>
            <dt>Parcela estimada</dt>
            <dd>{numeros.parcela > 0 ? moeda(numeros.parcela) : "—"}</dd>
          </div>
          <div>
            <dt>Garantias (soma)</dt>
            <dd>{numeros.somaGarantias > 0 ? moeda(numeros.somaGarantias) : "—"}</dd>
          </div>
          <div>
            <dt>Cobertura das garantias</dt>
            <dd>{percentual(numeros.coberturaGarantias)}</dd>
          </div>
        </dl>
      </div>

      {(camposFaltando.length > 0 || avisos.length > 0) && (
        <div className="cartao">
          <h3>Pontos de atenção</h3>
          <ul className="revisao-lista">
            {avisos.filter((aviso) => aviso.impede).map((aviso) => (
              <li key={aviso.texto} className="obrigatorio">
                <span>{aviso.texto}</span>
                <button type="button" className="btn btn-pequeno" onClick={() => onIrParaAba(aviso.aba)}>
                  Ir para {rotulosAbas[aviso.aba]}
                </button>
              </li>
            ))}
            {camposFaltando.map((campo) => (
              <li key={campo.campo} className="obrigatorio">
                <span>
                  <strong>Campo obrigatório em branco:</strong> {campo.rotulo}
                </span>
                <button type="button" className="btn btn-pequeno" onClick={() => onIrParaAba(campo.aba)}>
                  Ir para {rotulosAbas[campo.aba]}
                </button>
              </li>
            ))}
            {avisos.filter((aviso) => !aviso.impede).map((aviso) => (
              <li key={aviso.texto}>
                <span>{aviso.texto}</span>
                <button type="button" className="btn btn-pequeno" onClick={() => onIrParaAba(aviso.aba)}>
                  Ir para {rotulosAbas[aviso.aba]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {regras.acionadas.length > 0 && (
        <div className="cartao">
          <h3>Regras do parecer acionadas</h3>
          <ul className="revisao-regras">
            {regras.acionadas.map((regra) => (
              <li key={regra.id} className={regra.impede ? "impede" : ""}>
                <div className="revisao-regra-cabecalho">
                  <strong>{regra.nome}</strong>
                  {regra.impede && <span className="revisao-regra-selo">Impede a contratação</span>}
                  <button type="button" className="btn btn-pequeno" onClick={() => onIrParaAba(regra.aba)}>
                    Ir para {rotulosAbas[regra.aba]}
                  </button>
                </div>
                <span className="revisao-regra-motivo">
                  {regra.condicao}
                  {regra.encontrado ? ` — informado: ${regra.encontrado}` : ""}
                </span>
                {regra.textoParecer && (
                  <span>
                    <em>No Parecer:</em> {regra.textoParecer}
                  </span>
                )}
                {regra.textoDevolutiva && (
                  <span>
                    <em>Na Devolutiva:</em> {regra.textoDevolutiva}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="cartao">
        <h3>Situação dos checklists</h3>
        <div className="revisao-tabela-rolagem">
          <table className="revisao-tabela">
            <thead>
              <tr>
                <th scope="col">Seção</th>
                <th scope="col" className="num">OK</th>
                <th scope="col" className="num">N/A</th>
                <th scope="col" className="num">Pendente</th>
                <th scope="col" className="num">Sem avaliação</th>
                <th scope="col">Avaliado</th>
                <th scope="col">
                  <span className="sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {secoes.map((secao) => (
                <tr key={secao.chave}>
                  <th scope="row">{secao.titulo}</th>
                  <td className="num">{secao.ok}</td>
                  <td className="num">{secao.na}</td>
                  <td className={`num${secao.pendente > 0 ? " destaque" : ""}`}>{secao.pendente}</td>
                  <td className="num">{secao.naoAvaliados}</td>
                  <td className="revisao-celula-barra">
                    {secao.totalItens > 0 ? (
                      <BarraProgresso
                        mostrarRotulo={false}
                        altura="fina"
                        rotulo={`Avaliado em ${secao.titulo}`}
                        total={secao.totalItens}
                        segmentos={[
                          { chave: "ok", quantidade: secao.ok, rotulo: "OK" },
                          { chave: "na", quantidade: secao.na, rotulo: "N/A" },
                          { chave: "pendente", quantidade: secao.pendente, rotulo: "pendentes" },
                        ]}
                      />
                    ) : (
                      <span className="revisao-sem-itens">sem itens</span>
                    )}
                  </td>
                  <td>
                    <button type="button" className="btn btn-pequeno" onClick={() => onIrParaAba(secao.aba)}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {secoes
          .filter((secao) => secao.pendencias.length > 0)
          .map((secao) => (
            <details className="revisao-pendencias" key={secao.chave}>
              <summary>
                {secao.titulo} — {secao.pendencias.length} {secao.pendencias.length > 1 ? "pendências" : "pendência"}
              </summary>
              <ul>
                {secao.pendencias.map((pendencia, indice) => (
                  <li key={`${pendencia.contexto}-${pendencia.nome}-${indice}`}>
                    <span>
                      {pendencia.contexto && <small>{pendencia.contexto} · </small>}
                      <strong>{pendencia.nome}</strong>
                      <small> ({pendencia.grupo})</small>
                    </span>
                    {pendencia.texto ? (
                      <em>{pendencia.texto}</em>
                    ) : (
                      <em className="sem-texto">sem texto de devolutiva</em>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
      </div>

      <div className="revisao-acoes">
        <button type="button" className="btn btn-primario" onClick={() => onIrParaAba("parecer")}>
          Ir para o Parecer →
        </button>
        <button type="button" className="btn" onClick={() => onIrParaAba("devolutiva")}>
          Ver a Devolutiva
        </button>
      </div>
    </div>
  );
}
