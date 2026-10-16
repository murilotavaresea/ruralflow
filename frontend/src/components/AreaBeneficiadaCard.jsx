import ChecklistGrupo from "./ChecklistGrupo";
import CampoDocumento from "./CampoDocumento";
import CampoNumerico from "./CampoNumerico";
import "./AreaBeneficiadaCard.css";

export default function AreaBeneficiadaCard({
  imovel,
  checklistDef,
  onMudarCampo,
  onMudarChecklistImovel,
  onAdicionarProprietario,
  onRemoverProprietario,
  onMudarCampoProprietario,
  onMudarChecklistProprietario,
  onRemover,
}) {
  const grupoImovel = checklistDef?.bem || [];
  const grupoProprietario = checklistDef?.proprietario || [];
  const areaTotal = Number(imovel.areaTotal) || 0;
  const areaBeneficiada = Number(imovel.areaBeneficiadaHa) || 0;
  const areaExcede = areaTotal > 0 && areaBeneficiada > areaTotal;

  return (
    <div className="area-beneficiada-card">
      <div className="area-beneficiada-card-cabecalho">
        <span className="area-beneficiada-card-tipo">Imóvel</span>
        <div className="grade-campos area-beneficiada-card-campos">
          <label className="campo">
            <span>Nome do imóvel</span>
            <input
              type="text"
              value={imovel.nomeImovel}
              onChange={(e) => onMudarCampo("nomeImovel", e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Matrícula</span>
            <input type="text" value={imovel.matricula} onChange={(e) => onMudarCampo("matricula", e.target.value)} />
          </label>
          <label className="campo">
            <span>CCIR</span>
            <input type="text" value={imovel.ccir} onChange={(e) => onMudarCampo("ccir", e.target.value)} />
          </label>
          <label className="campo">
            <span>NIRF / CIB</span>
            <input type="text" value={imovel.nirfCib} onChange={(e) => onMudarCampo("nirfCib", e.target.value)} />
          </label>
          <label className="campo">
            <span>Área total</span>
            <CampoNumerico
              sufixo="ha"
              valor={imovel.areaTotal}
              onChange={(valor) => onMudarCampo("areaTotal", valor)}
            />
          </label>
          <label className="campo">
            <span>Área beneficiada</span>
            <CampoNumerico
              sufixo="ha"
              valor={imovel.areaBeneficiadaHa}
              onChange={(valor) => onMudarCampo("areaBeneficiadaHa", valor)}
              aria-invalid={areaExcede}
            />
            {areaExcede && <small className="campo-dica aviso">Maior que a área total do imóvel.</small>}
          </label>
          <label className="campo">
            <span>CAR</span>
            <input type="text" value={imovel.car} onChange={(e) => onMudarCampo("car", e.target.value)} />
          </label>
          <label className="campo">
            <span>Município</span>
            <input type="text" value={imovel.municipio} onChange={(e) => onMudarCampo("municipio", e.target.value)} />
          </label>
        </div>
        <button type="button" className="btn btn-pequeno btn-perigo" onClick={onRemover}>
          Remover imóvel
        </button>
      </div>

      {grupoImovel.length > 0 && (
        <section className="area-beneficiada-card-secao">
          <h4>Documentação do imóvel</h4>
          <ChecklistGrupo grupos={grupoImovel} estado={imovel.checklist} onMudarItem={onMudarChecklistImovel} />
        </section>
      )}

      <section className="area-beneficiada-card-secao">
        <h4>Proprietários</h4>
        {imovel.proprietarios.map((proprietario, posicao) => (
          <div className="area-beneficiada-proprietario" key={proprietario.id}>
            <div className="grade-campos">
              <label className="campo">
                <span>Nome do proprietário {imovel.proprietarios.length > 1 ? posicao + 1 : ""}</span>
                <input
                  type="text"
                  value={proprietario.nome}
                  onChange={(e) => onMudarCampoProprietario(proprietario.id, "nome", e.target.value)}
                />
              </label>
              <CampoDocumento
                valor={proprietario.documento}
                onChange={(valor) => onMudarCampoProprietario(proprietario.id, "documento", valor)}
              />
              {imovel.proprietarios.length > 1 && (
                <button
                  type="button"
                  className="btn btn-pequeno btn-perigo area-beneficiada-proprietario-remover"
                  onClick={() => onRemoverProprietario(proprietario.id)}
                >
                  Remover proprietário
                </button>
              )}
            </div>
            {grupoProprietario.length > 0 && (
              <ChecklistGrupo
                grupos={grupoProprietario}
                estado={proprietario.checklist}
                onMudarItem={(chave, estado) => onMudarChecklistProprietario(proprietario.id, chave, estado)}
              />
            )}
          </div>
        ))}
        <button type="button" className="btn area-beneficiada-adicionar-proprietario" onClick={onAdicionarProprietario}>
          + Adicionar proprietário
        </button>
      </section>
    </div>
  );
}
