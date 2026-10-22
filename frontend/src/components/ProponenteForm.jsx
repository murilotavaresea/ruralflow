import ChecklistGrupo from "./ChecklistGrupo";
import CampoDocumento from "./CampoDocumento";
import CampoNumerico from "./CampoNumerico";
import "./ProponenteForm.css";

const OPCOES_QRSA = ["Baixo", "Médio", "Alto"];

export default function ProponenteForm({ proponente, checklistDef, onMudarCampo, onMudarChecklist }) {
  // Operacoes antigas guardaram o QRSA como texto livre (ex.: "Medio"); mantemos esse valor
  // como opcao extra em vez de apaga-lo ao trocar o campo por uma lista.
  const qrsaForaDaLista = proponente.qrsa && !OPCOES_QRSA.includes(proponente.qrsa);

  return (
    <div className="proponente-form">
      <div className="cartao">
        <h2>Proponente</h2>
        <p className="cartao-descricao">
          Dados cadastrais e classificação de risco do tomador do crédito. Campos com * são obrigatórios
          para fechar o parecer.
        </p>

        {/* um grid so, como no layout original: 9 campos nao precisam de tres secoes empilhadas */}
        <div className="grade-campos colunas-4">
          <label className="campo obrigatorio">
            <span>Nome / Razão social</span>
            <input
              type="text"
              value={proponente.nome}
              onChange={(e) => onMudarCampo("nome", e.target.value)}
              placeholder="Nome completo ou razão social"
              autoComplete="off"
            />
          </label>
          <CampoDocumento
            obrigatorio
            valor={proponente.documento}
            onChange={(valor) => onMudarCampo("documento", valor)}
          />
          <label className="campo">
            <span>Setor de atuação</span>
            <input
              type="text"
              value={proponente.setorAtuacao}
              onChange={(e) => onMudarCampo("setorAtuacao", e.target.value)}
              placeholder="Ex.: pecuária de corte"
            />
          </label>
          <label className="campo">
            <span>Renda anual</span>
            <CampoNumerico
              prefixo="R$"
              valor={proponente.rendaAnual}
              onChange={(valor) => onMudarCampo("rendaAnual", valor)}
              placeholder="0,00"
            />
          </label>
          <label className="campo">
            <span>Patrimônio avaliado</span>
            <CampoNumerico
              prefixo="R$"
              valor={proponente.patrimonioAvaliado}
              onChange={(valor) => onMudarCampo("patrimonioAvaliado", valor)}
              placeholder="0,00"
            />
          </label>
          <label className="campo">
            <span>Risco</span>
            <input
              type="text"
              value={proponente.risco}
              onChange={(e) => onMudarCampo("risco", e.target.value)}
              placeholder="Ex.: R5"
            />
          </label>
          <label className="campo">
            <span>PD</span>
            <input type="text" value={proponente.pd} onChange={(e) => onMudarCampo("pd", e.target.value)} />
          </label>
          <label className="campo">
            <span>QRSA</span>
            <select value={proponente.qrsa} onChange={(e) => onMudarCampo("qrsa", e.target.value)}>
              <option value="">Selecione</option>
              {OPCOES_QRSA.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
              {qrsaForaDaLista && <option value={proponente.qrsa}>{proponente.qrsa}</option>}
            </select>
          </label>
          <label className="campo">
            <span>Score</span>
            <input type="text" value={proponente.score} onChange={(e) => onMudarCampo("score", e.target.value)} />
          </label>
          <label className="campo">
            <span>Perda esperada (PE)</span>
            <CampoNumerico
              sufixo="%"
              maximo={100}
              valor={proponente.perdaEsperada}
              onChange={(valor) => onMudarCampo("perdaEsperada", valor)}
              placeholder="0,00"
            />
          </label>
          <label className="campo">
            <span>Operação em Estágio 3</span>
            <select value={proponente.estagio3} onChange={(e) => onMudarCampo("estagio3", e.target.value)}>
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </label>
          <label className="campo">
            <span>Parte relacionada</span>
            <select value={proponente.parteRelacionada} onChange={(e) => onMudarCampo("parteRelacionada", e.target.value)}>
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </select>
          </label>
        </div>
      </div>

      <div className="cartao">
        <h2>Checklist de compliance</h2>
        <p className="cartao-descricao">
          Verificações do proponente para a fonte de recurso e a modalidade escolhidas na aba Proposta.
        </p>
        {checklistDef.length > 0 ? (
          <ChecklistGrupo grupos={checklistDef} estado={proponente.checklist} onMudarItem={onMudarChecklist} />
        ) : (
          <p className="cartao-descricao">Nenhum item de compliance cadastrado para esta combinação ainda.</p>
        )}
      </div>
    </div>
  );
}
