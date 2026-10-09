import ChecklistGrupo from "./ChecklistGrupo";
import { formatarDocumento, detectarTipoDocumento } from "../utils/cpfCnpj";
import "./ProponenteForm.css";

export default function ProponenteForm({ proponente, checklistDef, onMudarCampo, onMudarChecklist }) {
  const tipoDocumento = detectarTipoDocumento(proponente.documento);

  return (
    <div className="proponente-form">
      <div className="cartao">
        <h2>Proponente</h2>
        <p className="cartao-descricao">
          Dados cadastrais e classificacao de risco do tomador do credito.
        </p>
        <div className="grade-campos">
          <label className="campo">
            <span>Nome / Razao social</span>
            <input
              type="text"
              value={proponente.nome}
              onChange={(e) => onMudarCampo("nome", e.target.value)}
              placeholder="Nome completo ou razao social"
            />
          </label>
          <label className="campo">
            <span>CPF / CNPJ {tipoDocumento && `(${tipoDocumento})`}</span>
            <input
              type="text"
              value={proponente.documento}
              onChange={(e) => onMudarCampo("documento", formatarDocumento(e.target.value))}
              placeholder="000.000.000-00"
            />
          </label>
          <label className="campo">
            <span>Setor de atuacao</span>
            <input
              type="text"
              value={proponente.setorAtuacao}
              onChange={(e) => onMudarCampo("setorAtuacao", e.target.value)}
              placeholder="Ex: pecuaria de corte"
            />
          </label>
          <label className="campo">
            <span>Risco</span>
            <input
              type="text"
              value={proponente.risco}
              onChange={(e) => onMudarCampo("risco", e.target.value)}
              placeholder="Ex: R5"
            />
          </label>
          <label className="campo">
            <span>PD</span>
            <input
              type="text"
              value={proponente.pd}
              onChange={(e) => onMudarCampo("pd", e.target.value)}
            />
          </label>
          <label className="campo">
            <span>QRSA</span>
            <input
              type="text"
              value={proponente.qrsa}
              onChange={(e) => onMudarCampo("qrsa", e.target.value)}
              placeholder="Baixo / Medio / Alto"
            />
          </label>
          <label className="campo">
            <span>Score</span>
            <input
              type="text"
              value={proponente.score}
              onChange={(e) => onMudarCampo("score", e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Renda anual (R$)</span>
            <input
              type="number"
              value={proponente.rendaAnual}
              onChange={(e) => onMudarCampo("rendaAnual", e.target.value)}
              placeholder="0,00"
            />
          </label>
          <label className="campo">
            <span>Patrimonio avaliado (R$)</span>
            <input
              type="number"
              value={proponente.patrimonioAvaliado}
              onChange={(e) => onMudarCampo("patrimonioAvaliado", e.target.value)}
              placeholder="0,00"
            />
          </label>
        </div>
      </div>

      <div className="cartao">
        <h2>Checklist de compliance</h2>
        <p className="cartao-descricao">
          Verificacoes obrigatorias do proponente, independente do programa de credito.
        </p>
        <ChecklistGrupo
          grupos={checklistDef}
          estado={proponente.checklist}
          onMudarItem={onMudarChecklist}
        />
      </div>
    </div>
  );
}
