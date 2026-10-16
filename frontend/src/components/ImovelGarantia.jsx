import CampoNumerico from "./CampoNumerico";
import "./ImovelGarantia.css";

// Caracterizacao do imovel oferecido em garantia (hipoteca / alienacao de imovel): mesmos dados
// do cartao do imovel beneficiado, mais o valor da avaliacao, que e o valor da garantia. Fica no
// topo do cartao da garantia; a analise dos graus da matricula vem depois, no fim.
export default function ImovelGarantia({ garantia, onMudarCampo }) {
  const campoTexto = (campo, rotulo, extras = {}) => (
    <label className="campo">
      <span>{rotulo}</span>
      <input
        type="text"
        value={garantia[campo] || ""}
        onChange={(e) => onMudarCampo(campo, e.target.value)}
        {...extras}
      />
    </label>
  );

  return (
    <section className="garantia-imovel" aria-label="Caracterização do imóvel oferecido em garantia">
      <h4>Imóvel oferecido em garantia</h4>
      <div className="grade-campos colunas-4">
        {campoTexto("nomeImovel", "Nome do imóvel")}
        {campoTexto("matricula", "Matrícula", { placeholder: "Nº da matrícula" })}
        {campoTexto("ccir", "CCIR")}
        {campoTexto("nirfCib", "NIRF / CIB")}
        <label className="campo">
          <span>Área total</span>
          <CampoNumerico
            sufixo="ha"
            valor={garantia.areaTotal || ""}
            onChange={(valor) => onMudarCampo("areaTotal", valor)}
          />
        </label>
        {campoTexto("car", "CAR")}
        {campoTexto("municipio", "Município")}
        <label className="campo">
          <span>Valor da avaliação do imóvel</span>
          <CampoNumerico
            prefixo="R$"
            valor={garantia.valor}
            onChange={(valor) => onMudarCampo("valor", valor)}
            placeholder="0,00"
          />
        </label>
      </div>
    </section>
  );
}
