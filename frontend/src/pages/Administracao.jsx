import { useState } from "react";
import AdminChecklist from "../components/AdminChecklist";
import AdminLinhas from "../components/AdminLinhas";
import { PROGRAMAS } from "../utils/operacaoModel";
import { TIPOS_GARANTIA } from "../utils/garantiaModel";
import "./Administracao.css";

const PAINEIS = [
  { chave: "proponente", rotulo: "Checklist do Proponente" },
  { chave: "documentos", rotulo: "Demais Documentos" },
  { chave: "area_beneficiada", rotulo: "Área Beneficiada" },
  { chave: "garantias", rotulo: "Garantias" },
];

const ESCOPOS_GARANTIA = [
  { chave: "bem", rotulo: "Bem / garantia" },
  { chave: "proprietario", rotulo: "Garantidor" },
];

const ESCOPOS_AREA_BENEFICIADA = [
  { chave: "bem", rotulo: "Imóvel" },
  { chave: "proprietario", rotulo: "Proprietário" },
];

function calcularCaminhos(painel, tipoGarantia, escopoGarantia, escopoAreaBeneficiada) {
  if (painel === "proponente") {
    return { caminhoApi: "proponente", caminhoLeitura: ["proponente"] };
  }
  if (painel === "documentos") {
    return { caminhoApi: "documentos", caminhoLeitura: ["documentos"] };
  }
  if (painel === "area_beneficiada") {
    return {
      caminhoApi: `area_beneficiada/${escopoAreaBeneficiada}`,
      caminhoLeitura: ["area_beneficiada", escopoAreaBeneficiada],
    };
  }
  return {
    caminhoApi: `garantias/${escopoGarantia}/${tipoGarantia}`,
    caminhoLeitura: ["garantias", tipoGarantia, escopoGarantia],
  };
}

export default function Administracao() {
  const [painel, setPainel] = useState("proponente");
  const [fonteLinhas, setFonteLinhas] = useState(PROGRAMAS[0].chave);
  const [tipoGarantia, setTipoGarantia] = useState(TIPOS_GARANTIA[0].chave);
  const [escopoGarantia, setEscopoGarantia] = useState("bem");
  const [escopoAreaBeneficiada, setEscopoAreaBeneficiada] = useState("bem");
  const [linhasVersao, setLinhasVersao] = useState(0);

  const usaFonteLinha = painel === "proponente" || painel === "documentos" || painel === "area_beneficiada";
  const { caminhoApi, caminhoLeitura } = calcularCaminhos(
    painel,
    tipoGarantia,
    escopoGarantia,
    escopoAreaBeneficiada
  );

  return (
    <div className="administracao">
      <header className="administracao-header">
        <h1>Administração de checklist</h1>
        <p>Crie, edite, reordene e exclua os itens que aparecem na operação — sem mexer em código.</p>
      </header>

      <nav className="administracao-selecao">
        {PAINEIS.map((p) => (
          <button key={p.chave} type="button" className={painel === p.chave ? "ativa" : ""} onClick={() => setPainel(p.chave)}>
            {p.rotulo}
          </button>
        ))}

        {painel === "area_beneficiada" && (
          <select value={escopoAreaBeneficiada} onChange={(e) => setEscopoAreaBeneficiada(e.target.value)}>
            {ESCOPOS_AREA_BENEFICIADA.map((e) => (
              <option key={e.chave} value={e.chave}>
                {e.rotulo}
              </option>
            ))}
          </select>
        )}

        {painel === "garantias" && (
          <>
            <select value={tipoGarantia} onChange={(e) => setTipoGarantia(e.target.value)}>
              {TIPOS_GARANTIA.map((t) => (
                <option key={t.chave} value={t.chave}>
                  {t.rotulo}
                </option>
              ))}
            </select>
            <select value={escopoGarantia} onChange={(e) => setEscopoGarantia(e.target.value)}>
              {ESCOPOS_GARANTIA.map((e) => (
                <option key={e.chave} value={e.chave}>
                  {e.rotulo}
                </option>
              ))}
            </select>
          </>
        )}
      </nav>

      {usaFonteLinha && (
        <div className="administracao-linhas-bloco">
          <label className="administracao-linhas-seletor">
            <span>Gerenciar linhas da fonte:</span>
            <select value={fonteLinhas} onChange={(e) => setFonteLinhas(e.target.value)}>
              {PROGRAMAS.map((p) => (
                <option key={p.chave} value={p.chave}>
                  {p.rotulo}
                </option>
              ))}
            </select>
          </label>
          <AdminLinhas key={fonteLinhas} programa={fonteLinhas} onAlterado={() => setLinhasVersao((v) => v + 1)} />
        </div>
      )}

      <AdminChecklist key={`${caminhoApi}-${linhasVersao}`} caminhoApi={caminhoApi} caminhoLeitura={caminhoLeitura} />
    </div>
  );
}
