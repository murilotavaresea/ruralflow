import ChecklistGrupo from "./ChecklistGrupo";
import { rotuloTipoGarantia, tipoTemGrau } from "../utils/garantiaModel";
import { calcularIndiceGarantia } from "../utils/capacidadePagamento";
import { formatarDocumento } from "../utils/cpfCnpj";
import "./GarantiaCard.css";

function formatarPercentual(indice) {
  if (indice === null) return "-";
  return `${(indice * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export default function GarantiaCard({
  garantia,
  checklistDef,
  valorOperacao,
  onMudarCampo,
  onMudarChecklistBem,
  onAdicionarGarantidor,
  onRemoverGarantidor,
  onMudarCampoGarantidor,
  onMudarChecklistGarantidor,
  onRemover,
}) {
  const indice = calcularIndiceGarantia(garantia.valor, valorOperacao);
  const grupoBem = checklistDef?.bem || [];
  const grupoGarantidor = checklistDef?.proprietario || [];

  return (
    <div className="garantia-card">
      <div className="garantia-card-cabecalho">
        <span className="garantia-card-tipo">{rotuloTipoGarantia(garantia.tipo)}</span>
        <div className="grade-campos garantia-card-campos">
          <label className="campo">
            <span>Valor da garantia (R$)</span>
            <input
              type="number"
              value={garantia.valor}
              onChange={(e) => onMudarCampo("valor", e.target.value)}
            />
          </label>
          {tipoTemGrau(garantia.tipo) && (
            <label className="campo">
              <span>Grau</span>
              <input type="text" value={garantia.grau} onChange={(e) => onMudarCampo("grau", e.target.value)} />
            </label>
          )}
          <div className="garantia-card-cobertura">
            <span>Cobertura desta garantia</span>
            <strong>{formatarPercentual(indice)}</strong>
          </div>
        </div>
        <button type="button" className="garantia-card-remover" onClick={onRemover}>
          Remover garantia
        </button>
      </div>

      {grupoBem.length > 0 && (
        <section className="garantia-card-secao">
          <h4>Documentação e descrição do bem</h4>
          <ChecklistGrupo grupos={grupoBem} estado={garantia.checklist} onMudarItem={onMudarChecklistBem} />
        </section>
      )}

      <section className="garantia-card-secao">
        <h4>Garantidores</h4>
        {garantia.garantidores.map((garantidor) => (
          <div className="garantia-garantidor" key={garantidor.id}>
            <div className="grade-campos">
              <label className="campo">
                <span>Nome</span>
                <input
                  type="text"
                  value={garantidor.nome}
                  onChange={(e) => onMudarCampoGarantidor(garantidor.id, "nome", e.target.value)}
                />
              </label>
              <label className="campo">
                <span>CPF / CNPJ</span>
                <input
                  type="text"
                  value={garantidor.documento}
                  onChange={(e) =>
                    onMudarCampoGarantidor(garantidor.id, "documento", formatarDocumento(e.target.value))
                  }
                />
              </label>
              {garantia.garantidores.length > 1 && (
                <button
                  type="button"
                  className="garantia-garantidor-remover"
                  onClick={() => onRemoverGarantidor(garantidor.id)}
                >
                  Remover garantidor
                </button>
              )}
            </div>
            {grupoGarantidor.length > 0 && (
              <ChecklistGrupo
                grupos={grupoGarantidor}
                estado={garantidor.checklist}
                onMudarItem={(chave, estado) => onMudarChecklistGarantidor(garantidor.id, chave, estado)}
              />
            )}
          </div>
        ))}
        <button type="button" className="garantia-adicionar-garantidor" onClick={onAdicionarGarantidor}>
          + Adicionar garantidor
        </button>
      </section>
    </div>
  );
}
