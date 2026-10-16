import { numeroParcelas, periodosPorAno, taxaPeriodica, valorParcela } from "../utils/capacidadePagamento";
import "./SimulacaoParcela.css";

function moeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Mostra, ao lado dos campos da proposta, o que eles produzem: a parcela estimada e os numeros
// que alimentam o parecer. Antes isso so aparecia dentro do texto do parecer.
export default function SimulacaoParcela({ proposta }) {
  const periodicidade = proposta.periodicidadePagamento;
  const parcela = valorParcela({
    valorOperacao: proposta.valorOperacao,
    taxaAnualPercentual: proposta.taxaAnual,
    prazoMeses: proposta.prazoMeses,
    carenciaMeses: proposta.carenciaMeses,
    periodicidade,
  });
  const parcelas = numeroParcelas(proposta.prazoMeses, proposta.carenciaMeses, periodicidade);
  const taxa = taxaPeriodica(proposta.taxaAnual, periodicidade);

  return (
    <section className="simulacao-parcela" aria-labelledby="simulacao-titulo">
      <h3 id="simulacao-titulo">Simulação da parcela</h3>
      {parcela > 0 ? (
        <>
          <dl className="simulacao-parcela-resumo">
            <div className="destaque">
              <dt>Parcela estimada ({periodicidade.toLowerCase()})</dt>
              <dd>{moeda(parcela)}</dd>
            </div>
            <div>
              <dt>Número de parcelas</dt>
              <dd>{parcelas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</dd>
            </div>
            <div>
              <dt>Taxa no período</dt>
              <dd>{(taxa * 100).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}%</dd>
            </div>
            <div>
              <dt>Total pago por ano</dt>
              <dd>{moeda(parcela * periodosPorAno(periodicidade))}</dd>
            </div>
          </dl>
          <p className="campo-dica">
            Estimativa por parcelas iguais (fórmula PMT) com juros compostos, como na planilha de capacidade
            de pagamento. Não substitui o simulador oficial da fonte de recurso.
          </p>
        </>
      ) : (
        <p className="campo-dica">Informe o valor, o prazo e a taxa para ver a parcela estimada.</p>
      )}
    </section>
  );
}
