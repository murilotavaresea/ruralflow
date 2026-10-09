import { valorParcela, calcularCapacidade } from "../utils/capacidadePagamento";
import { novoAvalista } from "../utils/operacaoModel";
import "./CapacidadePagamento.css";

function formatarMoeda(valor) {
  if (!Number.isFinite(valor)) return "-";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarIndice(indice) {
  if (indice === null || !Number.isFinite(indice)) return "-";
  return `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function LinhaCapacidade({ titulo, pessoa, onMudar, parcela, periodicidade, onRemover }) {
  const despesasPercentual =
    pessoa.despesasPercentual === "" || pessoa.despesasPercentual === undefined
      ? 50
      : Number(pessoa.despesasPercentual);

  const { rendaLiquida, despesas, indice } = calcularCapacidade({
    rendaBruta: pessoa.rendaBruta,
    despesasPercentual,
    parcela,
    periodicidade,
  });

  return (
    <div className="capacidade-linha">
      <div className="capacidade-linha-cabecalho">
        <strong>{titulo}</strong>
        {onRemover && (
          <button type="button" className="capacidade-remover" onClick={onRemover}>
            Remover
          </button>
        )}
      </div>
      <div className="grade-campos">
        {pessoa.nome !== undefined && (
          <label className="campo">
            <span>Nome</span>
            <input
              type="text"
              value={pessoa.nome}
              onChange={(e) => onMudar({ ...pessoa, nome: e.target.value })}
            />
          </label>
        )}
        <label className="campo">
          <span>Renda bruta anual (R$)</span>
          <input
            type="number"
            value={pessoa.rendaBruta}
            onChange={(e) => onMudar({ ...pessoa, rendaBruta: e.target.value })}
          />
        </label>
        <label className="campo">
          <span>Despesas (%)</span>
          <input
            type="number"
            value={pessoa.despesasPercentual}
            onChange={(e) => onMudar({ ...pessoa, despesasPercentual: e.target.value })}
            placeholder="50"
          />
        </label>
      </div>
      <div className="capacidade-resultado">
        <span>Renda liquida: <strong>{formatarMoeda(rendaLiquida)}</strong></span>
        <span>Despesas: <strong>{formatarMoeda(despesas)}</strong></span>
        <span>Indice de capacidade: <strong>{formatarIndice(indice)}</strong></span>
      </div>
    </div>
  );
}

export default function CapacidadePagamento({ proposta, capacidadePagamento, onMudarBeneficiario, onMudarAvalistas }) {
  const parcela = valorParcela({
    valorOperacao: proposta.valorOperacao,
    taxaAnualPercentual: proposta.taxaAnual,
    prazoMeses: proposta.prazoMeses,
    carenciaMeses: proposta.carenciaMeses,
    periodicidade: proposta.periodicidadePagamento,
  });

  const avalistas = capacidadePagamento.avalistas || [];

  const atualizarAvalista = (indice, novoValor) => {
    const copia = [...avalistas];
    copia[indice] = novoValor;
    onMudarAvalistas(copia);
  };

  const removerAvalista = (indice) => {
    onMudarAvalistas(avalistas.filter((_, i) => i !== indice));
  };

  const adicionarAvalista = () => {
    if (avalistas.length >= 4) return;
    onMudarAvalistas([...avalistas, novoAvalista()]);
  };

  return (
    <div className="cartao">
      <h2>Capacidade de pagamento</h2>
      <p className="cartao-descricao">
        Calculo automatico a partir do valor, prazo, carencia e taxa informados na proposta.
      </p>

      <div className="capacidade-parcela">
        <span>Parcela estimada ({proposta.periodicidadePagamento || "Anual"})</span>
        <strong>{formatarMoeda(parcela)}</strong>
      </div>

      <LinhaCapacidade
        titulo="Beneficiario"
        pessoa={capacidadePagamento.beneficiario}
        onMudar={onMudarBeneficiario}
        parcela={parcela}
        periodicidade={proposta.periodicidadePagamento}
      />

      {avalistas.map((avalista, indice) => (
        <LinhaCapacidade
          key={indice}
          titulo={`Avalista ${indice + 1}`}
          pessoa={avalista}
          onMudar={(novoValor) => atualizarAvalista(indice, novoValor)}
          parcela={parcela}
          periodicidade={proposta.periodicidadePagamento}
          onRemover={() => removerAvalista(indice)}
        />
      ))}

      {avalistas.length < 4 && (
        <button type="button" className="capacidade-adicionar" onClick={adicionarAvalista}>
          + Adicionar avalista
        </button>
      )}
    </div>
  );
}
