import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import config from "../config";
import AdminItemForm from "./AdminItemForm";
import AdminPreview from "./AdminPreview";
import { useUi } from "./UiFeedback";
import { PROGRAMAS, rotuloPrograma } from "../utils/operacaoModel";
import { itemVisivel } from "../utils/linhaModel";
import { mensagemDeErro } from "../utils/erros";
import "./Campos.css";
import "./AdminChecklist.css";

function semAcento(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Reordena `lista` (objetos com .id) conforme `ids`.
function ordenarPorIds(lista, ids) {
  const indice = new Map(lista.map((elemento) => [elemento.id, elemento]));
  return ids.map((id) => indice.get(id)).filter(Boolean);
}

// Texto curto "quem usa este item", mostrado na lista pra nao precisar abrir o formulario.
function resumoEscopo(item, nomesDeLinha) {
  const partes = [];
  if (item.fontes === "todas" || item.fontes === undefined) {
    partes.push("Todas as fontes");
  } else if (Array.isArray(item.fontes)) {
    partes.push(item.fontes.length > 0 ? item.fontes.map(rotuloPrograma).join(" · ") : "Nenhuma fonte");
  }
  if (Array.isArray(item.linhas)) {
    const nomes = item.linhas.map((id) => nomesDeLinha[id]).filter(Boolean);
    if (item.linhas.length === 0) partes.push("nenhuma modalidade");
    else if (nomes.length === 0) partes.push("modalidade removida");
    else partes.push(nomes.length > 2 ? `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}` : nomes.join(", "));
  }
  return partes.join(" — ");
}

const escopoSemEfeito = (item) =>
  (Array.isArray(item.fontes) && item.fontes.length === 0) || (Array.isArray(item.linhas) && item.linhas.length === 0);

// caminhoApi: segmento de URL depois de /admin/checklist/, ex: "proponente", "documentos",
// "garantias/bem/hipoteca", "area_beneficiada/bem".
// caminhoLeitura: array de chaves para navegar na resposta de /referencia/checklist ate
// chegar na lista de grupos, ex: ["proponente"], ["documentos"],
// ["garantias","hipoteca","bem"], ["area_beneficiada","bem"].
export default function AdminChecklist({ caminhoApi, caminhoLeitura, titulo }) {
  const { toast, confirmar } = useUi();
  const [grupos, setGrupos] = useState([]);
  const [linhasPorFonte, setLinhasPorFonte] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [itemEmEdicao, setItemEmEdicao] = useState(null); // { grupoId, itemId | "novo" }
  const [busca, setBusca] = useState("");
  const [filtroFonte, setFiltroFonte] = useState("");
  const [filtroLinha, setFiltroLinha] = useState("");
  const [previewAberto, setPreviewAberto] = useState(false);
  const [arrastando, setArrastando] = useState(null); // { tipo, id, grupoId }
  const [dropAlvo, setDropAlvo] = useState(null); // { id, posicao: "antes" | "depois" }
  // Enter/Esc encerram a edicao do nome; o blur que o navegador dispara logo depois nao pode
  // salvar de novo.
  const edicaoEncerrada = useRef(false);

  const base = `${config.API_BASE_URL}/admin/checklist/${caminhoApi}`;
  // Proponente, Documentos e Area Beneficiada tem o conceito de fonte/modalidade (BNDES/FNO/...
  // /Custeio, Investimento...); so Garantias nao varia por fonte nem modalidade (varia por tipo).
  const usaFonteLinha =
    caminhoLeitura[0] === "proponente" || caminhoLeitura[0] === "documentos" || caminhoLeitura[0] === "area_beneficiada";

  const carregar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) setCarregando(true);
      setErro("");
      try {
        const resposta = await axios.get(`${config.REFERENCIA_URL}/checklist`);
        const dados = caminhoLeitura.reduce((atual, chave) => (atual ? atual[chave] : undefined), resposta.data);
        setGrupos(dados || []);
        setLinhasPorFonte(usaFonteLinha ? resposta.data.linhas || {} : {});
      } catch (e) {
        setErro(`Não foi possível carregar os itens: ${mensagemDeErro(e)}`);
      } finally {
        setCarregando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caminhoApi, caminhoLeitura.join(".")]
  );

  useEffect(() => {
    carregar();
    setItemEmEdicao(null);
    setGrupoEditando(null);
  }, [carregar]);

  // Toda escrita passa por aqui: mostra o erro (antes as falhas de rede passavam em silencio) e
  // recarrega do servidor, o que tambem desfaz qualquer reordenacao otimista que nao vingou.
  const executar = async (acao, sucesso) => {
    try {
      await acao();
      if (sucesso) toast({ tipo: "sucesso", mensagem: sucesso });
      await carregar({ silencioso: true });
      return true;
    } catch (e) {
      toast({ tipo: "erro", mensagem: `Não foi possível concluir a operação: ${mensagemDeErro(e)}` });
      await carregar({ silencioso: true });
      return false;
    }
  };

  const nomesDeLinha = useMemo(() => {
    const mapa = {};
    Object.values(linhasPorFonte).forEach((lista) => lista.forEach((linha) => (mapa[linha.id] = linha.nome)));
    return mapa;
  }, [linhasPorFonte]);

  // --- busca e filtros ----------------------------------------------------------------

  const termo = semAcento(busca).trim();
  const filtrando = termo !== "" || filtroFonte !== "";
  const modalidadesDoFiltro = filtroFonte ? linhasPorFonte[filtroFonte] || [] : [];

  const passaNoFiltro = (item) => {
    if (termo && !semAcento(`${item.nome} ${item.ajuda || ""}`).includes(termo)) return false;
    if (filtroFonte && !itemVisivel(item, filtroFonte, filtroLinha || null)) return false;
    return true;
  };

  const gruposExibidos = grupos
    .map((grupo) => ({ ...grupo, itensExibidos: grupo.itens.filter(passaNoFiltro) }))
    .filter((grupo) => !filtrando || grupo.itensExibidos.length > 0);

  const totalItens = grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  const totalExibidos = gruposExibidos.reduce((soma, grupo) => soma + grupo.itensExibidos.length, 0);

  // --- grupos ------------------------------------------------------------------------

  const criarGrupo = async (e) => {
    e.preventDefault();
    const nome = novoGrupoNome.trim();
    if (!nome) return;
    const ok = await executar(() => axios.post(`${base}/grupos`, { nome }), `Grupo "${nome}" criado.`);
    if (ok) setNovoGrupoNome("");
  };

  const renomearGrupo = async (grupo, nomeDigitado) => {
    const nome = nomeDigitado.trim();
    setGrupoEditando(null);
    if (!nome || nome === grupo.nome) return;
    await executar(() => axios.put(`${base}/grupos/${grupo.id}`, { nome }), "Grupo renomeado.");
  };

  const excluirGrupo = async (grupo) => {
    const resposta = await confirmar({
      titulo: "Excluir este grupo?",
      mensagem: `O grupo "${grupo.nome}" e os ${grupo.itens.length} ${grupo.itens.length === 1 ? "item" : "itens"} dentro dele serão excluídos. Operações que já marcaram esses itens deixam de mostrá-los.`,
      confirmarRotulo: "Excluir grupo",
      perigo: true,
    });
    if (resposta !== "confirmar") return;
    await executar(() => axios.delete(`${base}/grupos/${grupo.id}`), "Grupo excluído.");
  };

  const reordenarGrupos = async (ids) => {
    setGrupos((atuais) => ordenarPorIds(atuais, ids));
    await executar(() => axios.put(`${base}/grupos/reordenar`, { ordem: ids }));
  };

  const moverGrupo = (indice, direcao) => {
    const ids = grupos.map((g) => g.id);
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[indice], ids[alvo]] = [ids[alvo], ids[indice]];
    reordenarGrupos(ids);
  };

  // --- itens -------------------------------------------------------------------------

  const salvarItem = async (grupoId, itemId, dados) => {
    const ok = await executar(
      () =>
        itemId === "novo"
          ? axios.post(`${base}/grupos/${grupoId}/itens`, dados)
          : axios.put(`${base}/itens/${itemId}`, dados),
      itemId === "novo" ? "Item criado." : "Item salvo."
    );
    if (ok) setItemEmEdicao(null);
  };

  const excluirItem = async (item) => {
    const resposta = await confirmar({
      titulo: "Excluir este item?",
      mensagem: `"${item.nome}" será excluído. Operações que já marcaram este item deixam de mostrá-lo.`,
      confirmarRotulo: "Excluir item",
      perigo: true,
    });
    if (resposta !== "confirmar") return;
    await executar(() => axios.delete(`${base}/itens/${item.id}`), "Item excluído.");
  };

  const reordenarItens = async (grupoId, ids) => {
    setGrupos((atuais) =>
      atuais.map((grupo) => (grupo.id === grupoId ? { ...grupo, itens: ordenarPorIds(grupo.itens, ids) } : grupo))
    );
    await executar(() => axios.put(`${base}/grupos/${grupoId}/itens/reordenar`, { ordem: ids }));
  };

  const moverItem = (grupo, indice, direcao) => {
    const ids = grupo.itens.map((i) => i.id);
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[indice], ids[alvo]] = [ids[alvo], ids[indice]];
    reordenarItens(grupo.id, ids);
  };

  // --- arrastar e soltar (a alca ⋮⋮ e a origem; as setas ↑↓ seguem como alternativa de teclado) ---

  const iniciarArraste = (evento, tipo, id, grupoId) => {
    evento.stopPropagation();
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", id); // o Firefox so inicia o arraste com algum dado
    const alvoVisual = evento.currentTarget.closest("[data-arrastavel]");
    if (alvoVisual) evento.dataTransfer.setDragImage(alvoVisual, 16, 16);
    setArrastando({ tipo, id, grupoId });
  };

  const limparArraste = () => {
    setArrastando(null);
    setDropAlvo(null);
  };

  const aoPassarSobre = (evento, tipo, id, grupoId) => {
    if (!arrastando || arrastando.tipo !== tipo || arrastando.id === id) return;
    if (tipo === "item" && arrastando.grupoId !== grupoId) return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.dataTransfer.dropEffect = "move";
    const caixa = evento.currentTarget.getBoundingClientRect();
    const posicao = evento.clientY < caixa.top + caixa.height / 2 ? "antes" : "depois";
    setDropAlvo((atual) => (atual && atual.id === id && atual.posicao === posicao ? atual : { id, posicao }));
  };

  const soltar = (evento, tipo, id, grupoId) => {
    if (!arrastando || arrastando.tipo !== tipo || !dropAlvo || dropAlvo.id !== id) {
      limparArraste();
      return;
    }
    evento.preventDefault();
    evento.stopPropagation();
    const lista = tipo === "grupo" ? grupos : grupos.find((g) => g.id === grupoId)?.itens || [];
    const ids = lista.map((elemento) => elemento.id).filter((elementoId) => elementoId !== arrastando.id);
    const posicaoAlvo = ids.indexOf(id);
    ids.splice(dropAlvo.posicao === "antes" ? posicaoAlvo : posicaoAlvo + 1, 0, arrastando.id);
    limparArraste();
    if (tipo === "grupo") reordenarGrupos(ids);
    else reordenarItens(grupoId, ids);
  };

  const classeDrop = (id) => (dropAlvo && dropAlvo.id === id ? ` drop-${dropAlvo.posicao}` : "");
  const classeArrastando = (id) => (arrastando && arrastando.id === id ? " arrastando" : "");

  if (carregando) return <p className="cartao-descricao" role="status">Carregando…</p>;
  if (erro) {
    return (
      <div className="admin-erro" role="alert">
        <p>{erro}</p>
        <button type="button" className="btn btn-pequeno" onClick={() => carregar()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="admin-checklist">
      <div className="admin-barra">
        <input
          type="search"
          className="admin-busca"
          placeholder="Buscar item…"
          aria-label="Buscar item neste painel"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {usaFonteLinha && (
          <>
            <select
              aria-label="Filtrar pela fonte de recurso"
              value={filtroFonte}
              onChange={(e) => {
                setFiltroFonte(e.target.value);
                setFiltroLinha("");
              }}
            >
              <option value="">Todas as fontes</option>
              {PROGRAMAS.map((programa) => (
                <option key={programa.chave} value={programa.chave}>
                  {programa.rotulo}
                </option>
              ))}
            </select>
            {filtroFonte && modalidadesDoFiltro.length > 0 && (
              <select
                aria-label="Filtrar pela modalidade"
                value={filtroLinha}
                onChange={(e) => setFiltroLinha(e.target.value)}
              >
                <option value="">Comum a todas as modalidades</option>
                {modalidadesDoFiltro.map((linha) => (
                  <option key={linha.id} value={linha.id}>
                    {linha.nome}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
        <button type="button" className="btn btn-pequeno" onClick={() => setPreviewAberto(true)}>
          Pré-visualizar
        </button>
        <span className="admin-contagem" aria-live="polite">
          {totalItens} {totalItens === 1 ? "item" : "itens"} em {grupos.length} {grupos.length === 1 ? "grupo" : "grupos"}
          {filtrando && ` · ${totalExibidos} exibido${totalExibidos === 1 ? "" : "s"}`}
        </span>
      </div>

      {filtrando && (
        <p className="admin-aviso-filtro" role="status">
          Reordenar fica desativado enquanto há busca ou filtro ativo.{" "}
          <button
            type="button"
            className="admin-link"
            onClick={() => {
              setBusca("");
              setFiltroFonte("");
              setFiltroLinha("");
            }}
          >
            Limpar filtros
          </button>
        </p>
      )}

      {grupos.length === 0 && (
        <p className="cartao-descricao">Nenhum grupo ainda. Crie o primeiro no campo abaixo.</p>
      )}
      {filtrando && gruposExibidos.length === 0 && grupos.length > 0 && (
        <p className="cartao-descricao">Nenhum item corresponde à busca ou ao filtro.</p>
      )}

      {gruposExibidos.map((grupo) => {
        const indiceGrupo = grupos.findIndex((g) => g.id === grupo.id);
        const itensDaLista = filtrando ? grupo.itensExibidos : grupo.itens;
        return (
          <section
            className={`admin-grupo${classeDrop(grupo.id)}${classeArrastando(grupo.id)}`}
            key={grupo.id}
            data-arrastavel=""
            onDragOver={(e) => aoPassarSobre(e, "grupo", grupo.id)}
            onDrop={(e) => soltar(e, "grupo", grupo.id)}
          >
            <div className="admin-grupo-cabecalho">
              {!filtrando && (
                <span
                  className="admin-alca"
                  draggable
                  title="Arraste para reordenar o grupo"
                  aria-hidden="true"
                  onDragStart={(e) => iniciarArraste(e, "grupo", grupo.id)}
                  onDragEnd={limparArraste}
                >
                  ⋮⋮
                </span>
              )}
              {grupoEditando === grupo.id ? (
                <input
                  type="text"
                  className="admin-grupo-nome-edicao"
                  defaultValue={grupo.nome}
                  aria-label={`Novo nome do grupo ${grupo.nome}`}
                  autoFocus
                  onBlur={(e) => {
                    if (edicaoEncerrada.current) {
                      edicaoEncerrada.current = false;
                      return;
                    }
                    renomearGrupo(grupo, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      edicaoEncerrada.current = true;
                      renomearGrupo(grupo, e.target.value);
                    } else if (e.key === "Escape") {
                      edicaoEncerrada.current = true;
                      setGrupoEditando(null);
                    }
                  }}
                />
              ) : (
                <h3>
                  {grupo.nome} <small>({grupo.itens.length})</small>
                </h3>
              )}
              <div className="admin-grupo-acoes">
                <button
                  type="button"
                  className="btn btn-pequeno"
                  onClick={() => {
                    edicaoEncerrada.current = false;
                    setGrupoEditando(grupo.id);
                  }}
                  aria-label={`Renomear o grupo ${grupo.nome}`}
                >
                  Renomear
                </button>
                {!filtrando && (
                  <>
                    <button
                      type="button"
                      className="btn btn-pequeno"
                      onClick={() => moverGrupo(indiceGrupo, -1)}
                      disabled={indiceGrupo === 0}
                      aria-label={`Mover o grupo ${grupo.nome} para cima`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-pequeno"
                      onClick={() => moverGrupo(indiceGrupo, 1)}
                      disabled={indiceGrupo === grupos.length - 1}
                      aria-label={`Mover o grupo ${grupo.nome} para baixo`}
                    >
                      ↓
                    </button>
                  </>
                )}
                <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => excluirGrupo(grupo)}>
                  Excluir grupo
                </button>
              </div>
            </div>

            <ul className="admin-item-lista">
              {itensDaLista.map((item) => {
                const indiceItem = grupo.itens.findIndex((i) => i.id === item.id);
                const editando = itemEmEdicao?.grupoId === grupo.id && itemEmEdicao?.itemId === item.id;
                return (
                  <li
                    key={item.id}
                    className={`admin-item${classeDrop(item.id)}${classeArrastando(item.id)}`}
                    data-arrastavel=""
                    onDragOver={(e) => aoPassarSobre(e, "item", item.id, grupo.id)}
                    onDrop={(e) => soltar(e, "item", item.id, grupo.id)}
                  >
                    {editando ? (
                      <AdminItemForm
                        valorInicial={item}
                        fontesDisponiveis={
                          usaFonteLinha ? PROGRAMAS.map((p) => ({ chave: p.chave, rotulo: p.rotulo })) : []
                        }
                        linhasPorFonte={linhasPorFonte}
                        onSalvar={(dados) => salvarItem(grupo.id, item.id, dados)}
                        onCancelar={() => setItemEmEdicao(null)}
                      />
                    ) : (
                      <div className="admin-item-linha">
                        {!filtrando && (
                          <span
                            className="admin-alca"
                            draggable
                            title="Arraste para reordenar o item"
                            aria-hidden="true"
                            onDragStart={(e) => iniciarArraste(e, "item", item.id, grupo.id)}
                            onDragEnd={limparArraste}
                          >
                            ⋮⋮
                          </span>
                        )}
                        <span className="admin-item-tipo">{item.tipo === "texto" ? "Texto" : "Check"}</span>
                        <span className="admin-item-info">
                          <span className="admin-item-nome">{item.nome}</span>
                          {usaFonteLinha && (
                            <span className={`admin-item-escopo${escopoSemEfeito(item) ? " aviso" : ""}`}>
                              {resumoEscopo(item, nomesDeLinha)}
                            </span>
                          )}
                        </span>
                        <div className="admin-item-acoes">
                          {!filtrando && (
                            <>
                              <button
                                type="button"
                                className="btn btn-pequeno"
                                onClick={() => moverItem(grupo, indiceItem, -1)}
                                disabled={indiceItem === 0}
                                aria-label={`Mover o item ${item.nome} para cima`}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="btn btn-pequeno"
                                onClick={() => moverItem(grupo, indiceItem, 1)}
                                disabled={indiceItem === grupo.itens.length - 1}
                                aria-label={`Mover o item ${item.nome} para baixo`}
                              >
                                ↓
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn btn-pequeno"
                            onClick={() => setItemEmEdicao({ grupoId: grupo.id, itemId: item.id })}
                            aria-label={`Editar o item ${item.nome}`}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-pequeno btn-perigo"
                            onClick={() => excluirItem(item)}
                            aria-label={`Excluir o item ${item.nome}`}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}

              {!filtrando && (
                <li>
                  {itemEmEdicao?.grupoId === grupo.id && itemEmEdicao?.itemId === "novo" ? (
                    <AdminItemForm
                      fontesDisponiveis={
                        usaFonteLinha ? PROGRAMAS.map((p) => ({ chave: p.chave, rotulo: p.rotulo })) : []
                      }
                      linhasPorFonte={linhasPorFonte}
                      onSalvar={(dados) => salvarItem(grupo.id, "novo", dados)}
                      onCancelar={() => setItemEmEdicao(null)}
                      textoBotao="Criar item"
                    />
                  ) : (
                    <button
                      type="button"
                      className="btn admin-botao-adicionar"
                      onClick={() => setItemEmEdicao({ grupoId: grupo.id, itemId: "novo" })}
                    >
                      + Novo item em “{grupo.nome}”
                    </button>
                  )}
                </li>
              )}
            </ul>
          </section>
        );
      })}

      <form className="admin-novo-grupo" onSubmit={criarGrupo}>
        <label className="sr-only" htmlFor="admin-novo-grupo-nome">
          Nome do novo grupo
        </label>
        <input
          id="admin-novo-grupo-nome"
          type="text"
          placeholder="Nome do novo grupo"
          value={novoGrupoNome}
          onChange={(e) => setNovoGrupoNome(e.target.value)}
        />
        <button type="submit" className="btn btn-primario" disabled={!novoGrupoNome.trim()}>
          + Novo grupo
        </button>
      </form>

      {previewAberto && (
        <AdminPreview
          titulo={titulo}
          grupos={grupos}
          usaFonteLinha={usaFonteLinha}
          linhasPorFonte={linhasPorFonte}
          onFechar={() => setPreviewAberto(false)}
        />
      )}
    </div>
  );
}
