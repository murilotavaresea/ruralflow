import ChecklistGrupo from "./ChecklistGrupo";
import EstadoVazio from "./EstadoVazio";
import { rotuloPrograma } from "../utils/operacaoModel";

export default function ChecklistDocumental({ programa, grupos, estado, onMudarItem, onIrParaAdministracao }) {
  const rotulo = rotuloPrograma(programa);

  return (
    <div className="cartao">
      <h2>Demais documentos · {rotulo}</h2>
      <p className="cartao-descricao">
        Documentos exigidos para a fonte de recurso e a modalidade escolhidas na aba Proposta.
      </p>
      {grupos.length > 0 ? (
        <ChecklistGrupo grupos={grupos} estado={estado} onMudarItem={onMudarItem} />
      ) : (
        <EstadoVazio
          icone="☰"
          titulo="Nenhum documento cadastrado"
          descricao={`Não há itens de "Demais documentos" para ${rotulo} nesta modalidade. Eles são cadastrados na Administração.`}
        >
          {onIrParaAdministracao && (
            <button type="button" className="btn" onClick={onIrParaAdministracao}>
              Abrir Administração
            </button>
          )}
        </EstadoVazio>
      )}
    </div>
  );
}
