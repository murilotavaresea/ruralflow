import { useState } from "react";
import { extrairCampos, rotuloCampo, montarTextoFinal } from "../utils/gerarTextoTemplate";
import { novoEstadoItem } from "../utils/operacaoModel";
import "./ChecklistGrupo.css";

const OPCOES_STATUS = [
  { valor: "ok", rotulo: "OK" },
  { valor: "na", rotulo: "N/A" },
  { valor: "pendente", rotulo: "Pend." },
];

function ChecklistItemLinha({ item, itemEstado, onMudar }) {
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const campos = item.tipo === "texto" ? extrairCampos(item.template) : [];

  const mudarStatus = (novoStatus) => {
    // Clicar de novo na opcao ja marcada desmarca o item (volta pro estado "nao avaliado"),
    // em vez de obrigar a trocar pra outra opcao so pra tirar a selecao.
    const statusFinal = itemEstado.status === novoStatus ? "" : novoStatus;
    const devolutivaTexto =
      statusFinal === "pendente" && !itemEstado.devolutivaTexto
        ? item.textoDevolutivaPadrao || ""
        : itemEstado.devolutivaTexto;
    onMudar({ ...itemEstado, status: statusFinal, devolutivaTexto });
  };

  const mudarCampoTexto = (chave, valor) => {
    onMudar({ ...itemEstado, camposTexto: { ...itemEstado.camposTexto, [chave]: valor } });
  };

  return (
    <li className={`checklist-item${itemEstado.status ? ` status-${itemEstado.status}` : ""}`}>
      <div className="checklist-item-linha">
        {item.ajuda && (
          <button
            type="button"
            className="checklist-item-info"
            onClick={() => setAjudaAberta((a) => !a)}
            aria-label="Ver ajuda"
            title={item.ajuda}
          >
            ⓘ
          </button>
        )}
        <span className="checklist-item-nome">{item.nome}</span>
        <div className="checklist-item-status" role="group" aria-label={`Status de ${item.nome}`}>
          {OPCOES_STATUS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={itemEstado.status === opcao.valor ? "ativo" : ""}
              onClick={() => mudarStatus(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {ajudaAberta && item.ajuda && <p className="checklist-item-ajuda">{item.ajuda}</p>}

      {item.tipo === "texto" && (
        <div className="checklist-item-texto">
          {campos.length > 0 && (
            <div className="checklist-item-campos">
              {campos.map((chave) => (
                <label key={chave} className="checklist-item-campo">
                  <span>{rotuloCampo(chave)}</span>
                  <input
                    type="text"
                    value={itemEstado.camposTexto?.[chave] || ""}
                    onChange={(e) => mudarCampoTexto(chave, e.target.value)}
                  />
                </label>
              ))}
            </div>
          )}
          <p className="checklist-item-preview">{montarTextoFinal(item.template, itemEstado.camposTexto)}</p>
        </div>
      )}

      <input
        type="text"
        className="checklist-item-observacao"
        placeholder="Observacao (opcional)"
        value={itemEstado.observacao || ""}
        onChange={(e) => onMudar({ ...itemEstado, observacao: e.target.value })}
      />

      {itemEstado.status === "pendente" && (
        <label className="checklist-item-devolutiva">
          <span>Texto para devolutiva</span>
          <textarea
            rows={2}
            value={itemEstado.devolutivaTexto || ""}
            onChange={(e) => onMudar({ ...itemEstado, devolutivaTexto: e.target.value })}
          />
        </label>
      )}
    </li>
  );
}

export default function ChecklistGrupo({ grupos, estado, onMudarItem }) {
  return (
    <div className="checklist-grupo-lista">
      {grupos.map((grupo) => (
        <section className="checklist-grupo" key={grupo.id}>
          <h3>{grupo.nome}</h3>
          <ul>
            {grupo.itens.map((item) => {
              const itemEstado = estado[item.chave] || novoEstadoItem();
              return (
                <ChecklistItemLinha
                  key={item.chave}
                  item={item}
                  itemEstado={itemEstado}
                  onMudar={(novoEstado) => onMudarItem(item.chave, novoEstado)}
                />
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
