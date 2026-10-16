import ChecklistGrupo from "./ChecklistGrupo";
import CampoDocumento from "./CampoDocumento";
import CampoNumerico from "./CampoNumerico";
import AnaliseMatricula from "./AnaliseMatricula";
import ImovelGarantia from "./ImovelGarantia";
import {
  indiceCoberturaGarantia,
  rotuloTipoGarantia,
  tipoSemValor,
  tipoTemAnaliseMatricula,
  tipoTemGrau,
} from "../utils/garantiaModel";
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
  onAdicionarGrau,
  onRemoverGrau,
  onMudarCampoGrau,
  onRemover,
}) {
  const semValor = tipoSemValor(garantia.tipo);
  const comAnaliseMatricula = tipoTemAnaliseMatricula(garantia.tipo);
  const indice = indiceCoberturaGarantia(garantia, valorOperacao);
  const grupoBem = checklistDef?.bem || [];
  const grupoGarantidor = checklistDef?.proprietario || [];

  return (
    <div className="garantia-card">
      <div className="garantia-card-cabecalho">
        <span className="garantia-card-tipo">{rotuloTipoGarantia(garantia.tipo)}</span>
        <div className="grade-campos garantia-card-campos">
          {!semValor && !comAnaliseMatricula && (
            <label className="campo">
              <span>Valor da garantia</span>
              <CampoNumerico
                prefixo="R$"
                valor={garantia.valor}
                onChange={(valor) => onMudarCampo("valor", valor)}
                placeholder="0,00"
              />
            </label>
          )}
          {tipoTemGrau(garantia.tipo) && (
            <label className="campo">
              <span>Grau</span>
              <input type="text" value={garantia.grau} onChange={(e) => onMudarCampo("grau", e.target.value)} />
            </label>
          )}
          <div className="garantia-card-cobertura">
            <span>{comAnaliseMatricula ? "Índice de garantia" : "Cobertura desta garantia"}</span>
            <strong>{formatarPercentual(indice)}</strong>
            {semValor && <small>O aval cobre toda a operação</small>}
            {comAnaliseMatricula && <small>avaliação ÷ valor da operação</small>}
          </div>
        </div>
        <button type="button" className="btn btn-pequeno btn-perigo" onClick={onRemover}>
          Remover garantia
        </button>
      </div>

      {comAnaliseMatricula && <ImovelGarantia garantia={garantia} onMudarCampo={onMudarCampo} />}

      {grupoBem.length > 0 && (
        <section className="garantia-card-secao">
          <h4>Documentação e descrição do bem</h4>
          <ChecklistGrupo grupos={grupoBem} estado={garantia.checklist} onMudarItem={onMudarChecklistBem} />
        </section>
      )}

      <section className="garantia-card-secao">
        <h4>Garantidores</h4>
        {garantia.garantidores.map((garantidor, posicao) => (
          <div className="garantia-garantidor" key={garantidor.id}>
            <div className="grade-campos">
              <label className="campo">
                <span>Nome do garantidor {garantia.garantidores.length > 1 ? posicao + 1 : ""}</span>
                <input
                  type="text"
                  value={garantidor.nome}
                  onChange={(e) => onMudarCampoGarantidor(garantidor.id, "nome", e.target.value)}
                />
              </label>
              <CampoDocumento
                valor={garantidor.documento}
                onChange={(valor) => onMudarCampoGarantidor(garantidor.id, "documento", valor)}
              />
              {garantia.garantidores.length > 1 && (
                <button
                  type="button"
                  className="btn btn-pequeno btn-perigo garantia-garantidor-remover"
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
        <button type="button" className="btn garantia-adicionar-garantidor" onClick={onAdicionarGarantidor}>
          + Adicionar garantidor
        </button>
      </section>

      {/* por ultimo: depois dos documentos e dos garantidores, que sao o que se preenche primeiro */}
      {comAnaliseMatricula && (
        <AnaliseMatricula
          garantia={garantia}
          valorOperacao={valorOperacao}
          onMudarCampo={onMudarCampo}
          onAdicionarGrau={onAdicionarGrau}
          onRemoverGrau={onRemoverGrau}
          onMudarCampoGrau={onMudarCampoGrau}
        />
      )}
    </div>
  );
}
