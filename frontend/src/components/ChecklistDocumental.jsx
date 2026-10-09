import ChecklistGrupo from "./ChecklistGrupo";
import { PROGRAMAS } from "../utils/operacaoModel";

export default function ChecklistDocumental({ programa, grupos, estado, onMudarItem }) {
  const rotulo = PROGRAMAS.find((p) => p.chave === programa)?.rotulo || programa;

  return (
    <div className="cartao">
      <h2>Demais documentos - {rotulo}</h2>
      <p className="cartao-descricao">
        Documentos exigidos para a fonte de recurso/linha selecionada na proposta.
      </p>
      {grupos.length > 0 ? (
        <ChecklistGrupo grupos={grupos} estado={estado} onMudarItem={onMudarItem} />
      ) : (
        <p className="cartao-descricao">Nenhum item cadastrado para este programa ainda.</p>
      )}
    </div>
  );
}
