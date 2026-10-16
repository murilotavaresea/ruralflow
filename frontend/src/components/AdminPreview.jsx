import { useMemo, useState } from "react";
import { Modal } from "./UiFeedback";
import ChecklistGrupo from "./ChecklistGrupo";
import { PROGRAMAS } from "../utils/operacaoModel";
import { filtrarGruposPorFonteELinha } from "../utils/linhaModel";

// "Como o analista ve": renderiza o mesmo componente de checklist da operacao, com os itens
// filtrados pela fonte/modalidade escolhidas aqui. As marcacoes feitas na pre-visualizacao
// ficam so na memoria desta janela — nada e salvo.
export default function AdminPreview({ titulo, grupos, usaFonteLinha, linhasPorFonte, onFechar }) {
  const [fonte, setFonte] = useState(PROGRAMAS[0].chave);
  const [linha, setLinha] = useState("");
  const [estado, setEstado] = useState({});

  const gruposComChave = useMemo(
    () => grupos.map((grupo) => ({ ...grupo, itens: grupo.itens.map((item) => ({ ...item, chave: item.id })) })),
    [grupos]
  );

  const visiveis = usaFonteLinha
    ? filtrarGruposPorFonteELinha(gruposComChave, fonte, linha || null)
    : gruposComChave.filter((grupo) => grupo.itens.length > 0);

  const modalidades = linhasPorFonte[fonte] || [];

  return (
    <Modal titulo={`Pré-visualização — ${titulo}`} largura="grande" onFechar={onFechar}>
      <p className="cartao-descricao">
        É assim que esta lista aparece para o analista. As marcações feitas aqui não são salvas.
      </p>

      {usaFonteLinha && (
        <div className="grade-campos admin-preview-filtros">
          <label className="campo">
            <span>Fonte de recurso</span>
            <select
              value={fonte}
              onChange={(e) => {
                setFonte(e.target.value);
                setLinha("");
              }}
            >
              {PROGRAMAS.map((programa) => (
                <option key={programa.chave} value={programa.chave}>
                  {programa.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Modalidade</span>
            <select value={linha} onChange={(e) => setLinha(e.target.value)} disabled={modalidades.length === 0}>
              <option value="">{modalidades.length === 0 ? "Nenhuma modalidade cadastrada" : "Comum a todas"}</option>
              {modalidades.map((modalidade) => (
                <option key={modalidade.id} value={modalidade.id}>
                  {modalidade.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {visiveis.length > 0 ? (
        <ChecklistGrupo
          grupos={visiveis}
          estado={estado}
          onMudarItem={(chave, novoEstado) => setEstado((atual) => ({ ...atual, [chave]: novoEstado }))}
        />
      ) : (
        <p className="cartao-descricao">Nenhum item seria exibido com esta combinação.</p>
      )}
    </Modal>
  );
}
