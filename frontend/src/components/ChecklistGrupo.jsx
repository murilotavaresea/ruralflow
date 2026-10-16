import { useState } from "react";
import { extrairCampos, rotuloCampo, montarTextoFinal } from "../utils/gerarTextoTemplate";
import { contarItens, novoEstadoItem } from "../utils/operacaoModel";
import { useUi } from "./UiFeedback";
import "./Campos.css";
import "./ChecklistGrupo.css";

const OPCOES_STATUS = [
  { valor: "ok", rotulo: "OK", atalho: "O", descricao: "Conforme" },
  { valor: "na", rotulo: "N/A", atalho: "N", descricao: "Não se aplica" },
  { valor: "pendente", rotulo: "Pendente", atalho: "P", descricao: "Pendente de regularização" },
];

// Listas pequenas nao precisam de barra de busca/filtro — so atrapalhariam.
const MINIMO_ITENS_PARA_BARRA = 7;

function semAcento(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function ChecklistItemLinha({ item, itemEstado, onMudar }) {
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const campos = item.tipo === "texto" ? extrairCampos(item.template) : [];

  const status = itemEstado.status;

  const mudarStatus = (novoStatus) => {
    // Clicar de novo na opcao ja marcada desmarca o item (volta pro estado "nao avaliado"),
    // em vez de obrigar a trocar pra outra opcao so pra tirar a selecao.
    const statusFinal = status === novoStatus ? "" : novoStatus;
    const devolutivaTexto =
      statusFinal === "pendente" && !itemEstado.devolutivaTexto
        ? item.textoDevolutivaPadrao || ""
        : itemEstado.devolutivaTexto;
    onMudar({ ...itemEstado, status: statusFinal, devolutivaTexto });
  };

  const mudarCampoTexto = (chave, valor) => {
    onMudar({ ...itemEstado, camposTexto: { ...itemEstado.camposTexto, [chave]: valor } });
  };

  // Atalhos: O / N / P marcam o status do item em foco; J / K pulam pro proximo / anterior.
  // Ignorados enquanto se digita em qualquer campo.
  const aoTeclar = (evento) => {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
    const alvo = evento.target;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName) || alvo.isContentEditable) return;

    const tecla = evento.key.toLowerCase();
    const opcao = OPCOES_STATUS.find((o) => o.atalho.toLowerCase() === tecla);
    if (opcao) {
      evento.preventDefault();
      mudarStatus(opcao.valor);
      return;
    }
    if (tecla === "j" || tecla === "k") {
      evento.preventDefault();
      const itens = Array.from(document.querySelectorAll("[data-checklist-item]"));
      const destino = itens[itens.indexOf(evento.currentTarget) + (tecla === "j" ? 1 : -1)];
      if (destino) destino.focus();
    }
  };

  return (
    <li
      className={`checklist-item${status ? ` status-${status}` : ""}`}
      data-checklist-item=""
      tabIndex={-1}
      onKeyDown={aoTeclar}
    >
      <div className="checklist-item-linha">
        <div className="checklist-item-titulo">
          {item.ajuda && (
            <button
              type="button"
              className="checklist-item-info"
              onClick={() => setAjudaAberta((aberta) => !aberta)}
              aria-expanded={ajudaAberta}
              aria-label={`Ver ajuda sobre ${item.nome}`}
            >
              ⓘ
            </button>
          )}
          <span className="checklist-item-nome">{item.nome}</span>
        </div>

        <div className="checklist-item-controles">
          <div className="checklist-item-status" role="group" aria-label={`Status de ${item.nome}`}>
            {OPCOES_STATUS.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                className={`${opcao.valor}${status === opcao.valor ? " ativo" : ""}`}
                aria-pressed={status === opcao.valor}
                aria-keyshortcuts={opcao.atalho}
                title={`${opcao.descricao} (atalho: ${opcao.atalho})`}
                onClick={() => mudarStatus(opcao.valor)}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
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
        placeholder="Observação (opcional)"
        aria-label={`Observação sobre ${item.nome}`}
        value={itemEstado.observacao || ""}
        onChange={(e) => onMudar({ ...itemEstado, observacao: e.target.value })}
      />

      {status === "pendente" && (
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

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "nao_avaliados", rotulo: "Não avaliados" },
  { valor: "pendentes", rotulo: "Pendentes" },
];

export default function ChecklistGrupo({ grupos, estado, onMudarItem, acoesEmLote = true }) {
  const { toast } = useUi();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [recolhidos, setRecolhidos] = useState(() => new Set());

  const geral = contarItens(grupos, estado);
  const mostrarBarra = geral.totalItens >= MINIMO_ITENS_PARA_BARRA;
  const termo = semAcento(busca).trim();
  const filtrando = mostrarBarra && (filtro !== "todos" || termo !== "");

  const contadoresFiltro = {
    todos: geral.totalItens,
    nao_avaliados: geral.naoAvaliados,
    pendentes: geral.pendente,
  };

  const passaNoFiltro = (item) => {
    if (!filtrando) return true;
    const status = estado[item.chave]?.status || "";
    if (filtro === "nao_avaliados" && status !== "") return false;
    if (filtro === "pendentes" && status !== "pendente") return false;
    if (termo && !semAcento(`${item.nome} ${item.ajuda || ""}`).includes(termo)) return false;
    return true;
  };

  const gruposVisiveis = grupos
    .map((grupo) => ({ ...grupo, itensVisiveis: grupo.itens.filter(passaNoFiltro) }))
    .filter((grupo) => grupo.itensVisiveis.length > 0);

  const alternarGrupo = (grupoId) => {
    setRecolhidos((atuais) => {
      const novos = new Set(atuais);
      if (novos.has(grupoId)) novos.delete(grupoId);
      else novos.add(grupoId);
      return novos;
    });
  };

  const todosRecolhidos = grupos.length > 0 && grupos.every((grupo) => recolhidos.has(grupo.id));

  const marcarRestantesComoOk = (grupo) => {
    const alvos = grupo.itens.filter((item) => !estado[item.chave]?.status);
    if (alvos.length === 0) return;
    alvos.forEach((item) => onMudarItem(item.chave, { ...(estado[item.chave] || novoEstadoItem()), status: "ok" }));
    toast({
      mensagem: `${alvos.length} ${alvos.length === 1 ? "item" : "itens"} de "${grupo.nome}" marcado${alvos.length === 1 ? "" : "s"} como OK.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () => alvos.forEach((item) => onMudarItem(item.chave, estado[item.chave] || novoEstadoItem())),
      },
    });
  };

  // Limpa so o status (OK / N/A / Pendente); observacoes e textos de devolutiva ficam.
  const limparGrupo = (grupo) => {
    const alvos = grupo.itens.filter((item) => estado[item.chave]?.status);
    if (alvos.length === 0) return;
    alvos.forEach((item) => onMudarItem(item.chave, { ...estado[item.chave], status: "" }));
    toast({
      mensagem: `Status de ${alvos.length} ${alvos.length === 1 ? "item" : "itens"} de "${grupo.nome}" limpo${alvos.length === 1 ? "" : "s"}.`,
      acao: {
        rotulo: "Desfazer",
        onClick: () => alvos.forEach((item) => onMudarItem(item.chave, estado[item.chave])),
      },
    });
  };

  return (
    <div className="checklist-grupo-lista">
      {mostrarBarra && (
        <div className="checklist-barra">
          <input
            type="search"
            className="checklist-busca"
            placeholder="Buscar item…"
            aria-label="Buscar item neste checklist"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="checklist-filtros" role="group" aria-label="Filtrar itens por situação">
            {FILTROS.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                className={`chip${filtro === opcao.valor ? " selecionado" : ""}`}
                aria-pressed={filtro === opcao.valor}
                onClick={() => setFiltro(opcao.valor)}
              >
                {opcao.rotulo}
                <span className="chip-contador">{contadoresFiltro[opcao.valor]}</span>
              </button>
            ))}
          </div>
          {grupos.length > 1 && !filtrando && (
            <button
              type="button"
              className="btn btn-fantasma btn-pequeno"
              onClick={() => setRecolhidos(todosRecolhidos ? new Set() : new Set(grupos.map((g) => g.id)))}
            >
              {todosRecolhidos ? "Expandir tudo" : "Recolher tudo"}
            </button>
          )}
          <p
            className="checklist-atalhos"
            title="Com um item em foco: O = OK, N = N/A, P = Pendente; J / K = próximo / anterior"
          >
            Teclado: <kbd>O</kbd> <kbd>N</kbd> <kbd>P</kbd> · <kbd>J</kbd> <kbd>K</kbd>
          </p>
        </div>
      )}

      {filtrando && gruposVisiveis.length === 0 && (
        <div className="checklist-sem-resultado" role="status">
          <p>Nenhum item corresponde ao filtro.</p>
          <button
            type="button"
            className="btn btn-pequeno"
            onClick={() => {
              setBusca("");
              setFiltro("todos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {gruposVisiveis.map((grupo) => {
        const contagem = contarItens([grupo], estado);
        const recolhido = !filtrando && recolhidos.has(grupo.id);
        const idLista = `${grupo.id}-itens`;
        const completo = contagem.totalItens > 0 && contagem.naoAvaliados === 0;
        return (
          <section className="checklist-grupo" key={grupo.id}>
            <div className="checklist-grupo-cabecalho">
              <h3>
                <button
                  type="button"
                  className="checklist-grupo-alternar"
                  aria-expanded={!recolhido}
                  aria-controls={idLista}
                  onClick={() => alternarGrupo(grupo.id)}
                  disabled={filtrando}
                >
                  <span className="checklist-grupo-seta" aria-hidden="true">
                    {recolhido ? "▸" : "▾"}
                  </span>
                  {grupo.nome}
                </button>
              </h3>
              <span
                className={`checklist-contador${completo ? " completo" : ""}`}
                aria-label={`${contagem.preenchidos} de ${contagem.totalItens} itens avaliados`}
              >
                {completo && <span aria-hidden="true">✓ </span>}
                {contagem.preenchidos}/{contagem.totalItens}
              </span>
              {contagem.pendente > 0 && (
                <span className="checklist-selo-pendente">
                  {contagem.pendente} pendente{contagem.pendente > 1 ? "s" : ""}
                </span>
              )}
              {acoesEmLote && !filtrando && (
                <div className="checklist-grupo-acoes">
                  <button
                    type="button"
                    className="btn btn-pequeno"
                    onClick={() => marcarRestantesComoOk(grupo)}
                    disabled={contagem.naoAvaliados === 0}
                    title="Marca como OK só os itens ainda não avaliados deste grupo"
                  >
                    Restantes como OK
                  </button>
                  <button
                    type="button"
                    className="btn btn-pequeno"
                    onClick={() => limparGrupo(grupo)}
                    disabled={contagem.preenchidos === 0}
                    title="Limpa o status (OK / N/A / Pendente) dos itens do grupo; as observações são mantidas"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>
            {!recolhido && (
              <ul id={idLista}>
                {grupo.itensVisiveis.map((item) => (
                  <ChecklistItemLinha
                    key={item.chave}
                    item={item}
                    itemEstado={estado[item.chave] || novoEstadoItem()}
                    onMudar={(novoEstado) => onMudarItem(item.chave, novoEstado)}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
